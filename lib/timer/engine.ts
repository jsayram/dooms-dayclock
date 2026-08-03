import { allocateProportionally } from "./plan.ts";
import type { TimerSnapshot, TimerState } from "./types.ts";

const assertNow = (nowMs: number) => {
  if (!Number.isFinite(nowMs) || nowMs < 0) {
    throw new RangeError("nowMs must be a non-negative finite timestamp.");
  }
};

function elapsedAt(state: TimerState, nowMs: number): number {
  if (state.status !== "running" || state.runningSinceMs === null) {
    return state.activeElapsedMs;
  }
  return state.activeElapsedMs + Math.max(0, nowMs - state.runningSinceMs);
}

export function startTimer(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status === "completed" || state.status === "running") return state;
  return {
    ...state,
    status: "running",
    runningSinceMs: nowMs,
    updatedAtMs: nowMs,
  };
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status !== "running") return state;
  return {
    ...state,
    status: "paused",
    activeElapsedMs: elapsedAt(state, nowMs),
    runningSinceMs: null,
    updatedAtMs: nowMs,
  };
}

export function resumeTimer(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status !== "paused") return state;
  return {
    ...state,
    status: "running",
    runningSinceMs: nowMs,
    updatedAtMs: nowMs,
  };
}

/**
 * Completes the active task and banks the entire remaining wall-clock window
 * across unfinished tasks. Task weights stay stable and finishAtMs never moves.
 */
export function completeActiveTask(state: TimerState, nowMs: number): TimerState {
  assertNow(nowMs);
  if (state.status === "completed") return state;

  const active = state.tasks[state.activeTaskIndex];
  if (!active || active.completedAtMs !== null) return state;
  const tasks = state.tasks.map((task, index) =>
    index === state.activeTaskIndex ? { ...task, completedAtMs: nowMs } : task,
  );
  const nextIndex = tasks.findIndex((task) => task.completedAtMs === null);

  if (nextIndex === -1) {
    return {
      ...state,
      tasks,
      status: "completed",
      activeTaskIndex: tasks.length,
      activeElapsedMs: 0,
      runningSinceMs: null,
      updatedAtMs: nowMs,
    };
  }

  const unfinished = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => task.completedAtMs === null);
  const budgets = allocateProportionally(
    Math.max(0, Math.floor(state.finishAtMs - nowMs)),
    unfinished.map(({ task }) => task.weight),
  );
  unfinished.forEach(({ index }, budgetIndex) => {
    tasks[index] = { ...tasks[index], budgetMs: budgets[budgetIndex] };
  });

  return {
    ...state,
    tasks,
    activeTaskIndex: nextIndex,
    activeElapsedMs: 0,
    runningSinceMs: state.status === "running" ? nowMs : null,
    updatedAtMs: nowMs,
  };
}

export function getTimerSnapshot(state: TimerState, nowMs: number): TimerSnapshot {
  assertNow(nowMs);
  const activeTask = state.tasks[state.activeTaskIndex] ?? null;
  const elapsed = activeTask ? elapsedAt(state, nowMs) : 0;
  const remaining = activeTask ? activeTask.budgetMs - elapsed : 0;
  const goalRemaining = state.finishAtMs - nowMs;
  const completedCount = state.tasks.filter((task) => task.completedAtMs !== null).length;

  return {
    activeTask,
    activeTaskRemainingMs: remaining,
    activeTaskOvertimeMs: Math.max(0, -remaining),
    goalRemainingMs: goalRemaining,
    goalOvertimeMs: Math.max(0, -goalRemaining),
    elapsedOnActiveTaskMs: elapsed,
    progress: completedCount / state.tasks.length,
    completedCount,
    isTaskOvertime: remaining < 0,
    isGoalOvertime: goalRemaining < 0,
  };
}

/** Gives the active task more of the remaining window without moving the finish line. */
export function addTimeToActiveTask(state: TimerState, nowMs: number, amountMs: number): TimerState {
  assertNow(nowMs);
  if (!Number.isSafeInteger(amountMs) || amountMs <= 0 || state.status === "completed") return state;
  const active = state.tasks[state.activeTaskIndex];
  if (!active) return state;
  const elapsed = elapsedAt(state, nowMs);
  const available = Math.max(0, state.finishAtMs - nowMs);
  const currentRemaining = Math.max(0, active.budgetMs - elapsed);
  const desiredRemaining = Math.min(available, currentRemaining + amountMs);
  const tasks = state.tasks.map(task => ({ ...task }));
  tasks[state.activeTaskIndex].budgetMs = elapsed + desiredRemaining;
  const future = tasks.map((task, index) => ({ task, index })).filter(({ task, index }) => index !== state.activeTaskIndex && task.completedAtMs === null);
  if (future.length) {
    const budgets = allocateProportionally(Math.max(0, available - desiredRemaining), future.map(({ task }) => task.weight));
    future.forEach(({ index }, cursor) => { tasks[index].budgetMs = budgets[cursor]; });
  }
  return { ...state, tasks, activeElapsedMs: elapsed, runningSinceMs: state.status === "running" ? nowMs : null, updatedAtMs: nowMs };
}

import { TIMER_STATE_VERSION } from "./types.ts";
import type { TimerState, TimerStatus, TimerTask } from "./types.ts";

const statuses = new Set<TimerStatus>(["idle", "running", "paused", "completed"]);
const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

function isTask(value: unknown): value is TimerTask {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" && task.id.trim().length > 0 &&
    typeof task.title === "string" && task.title.trim().length > 0 &&
    typeof task.weight === "number" && Number.isFinite(task.weight) && task.weight > 0 &&
    Number.isSafeInteger(task.budgetMs) && (task.budgetMs as number) >= 0 &&
    (task.completedAtMs === null || isFiniteNonNegative(task.completedAtMs))
  );
}

export function isValidTimerState(value: unknown): value is TimerState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  if (
    state.version !== TIMER_STATE_VERSION ||
    !isFiniteNonNegative(state.startAtMs) ||
    !isFiniteNonNegative(state.finishAtMs) ||
    state.finishAtMs <= state.startAtMs ||
    typeof state.status !== "string" ||
    !statuses.has(state.status as TimerStatus) ||
    !Array.isArray(state.tasks) || state.tasks.length === 0 ||
    !state.tasks.every(isTask) ||
    !Number.isInteger(state.activeTaskIndex) ||
    !isFiniteNonNegative(state.activeElapsedMs) ||
    !(state.runningSinceMs === null || isFiniteNonNegative(state.runningSinceMs)) ||
    !isFiniteNonNegative(state.updatedAtMs)
  ) return false;

  const tasks = state.tasks as TimerTask[];
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) return false;
  const incompleteIndex = tasks.findIndex((task) => task.completedAtMs === null);
  if (
    incompleteIndex !== -1 &&
    tasks.slice(incompleteIndex).some((task) => task.completedAtMs !== null)
  ) return false;
  const activeIndex = state.activeTaskIndex as number;
  const status = state.status as TimerStatus;
  if (status === "completed") {
    return incompleteIndex === -1 && activeIndex === tasks.length && state.runningSinceMs === null;
  }
  if (incompleteIndex === -1 || activeIndex !== incompleteIndex) return false;
  if (status === "running") return state.runningSinceMs !== null;
  return state.runningSinceMs === null;
}

export function serializeTimerState(state: TimerState): string {
  if (!isValidTimerState(state)) throw new TypeError("Cannot serialize an invalid timer state.");
  return JSON.stringify(state);
}

export function restoreTimerState(serialized: string): TimerState | null {
  try {
    const value: unknown = JSON.parse(serialized);
    return isValidTimerState(value) ? value : null;
  } catch {
    return null;
  }
}

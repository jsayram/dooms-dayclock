import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateProportionally,
  addTimeToActiveTask,
  completeActiveTask,
  createTimerSoundPlayer,
  createTimerState,
  getTimerSnapshot,
  pauseTimer,
  restoreTimerState,
  resumeTimer,
  serializeTimerState,
  startTimer,
} from "../lib/timer/index.ts";

const minute = 60_000;
const tasks = [
  { id: "clear", title: "Clear the room", weight: 2 },
  { id: "pack", title: "Pack the bag", weight: 1 },
  { id: "check", title: "Final check", weight: 1 },
];

test("allocates the exact window proportionally with deterministic rounding", () => {
  assert.deepEqual(allocateProportionally(11, [1, 1, 1]), [4, 4, 3]);
  assert.deepEqual(allocateProportionally(60, [2, 1, 1]), [30, 15, 15]);
});

test("plans all tasks to a fixed end goal", () => {
  const state = createTimerState({ startAtMs: 100, finishAtMs: 60_100, tasks });
  assert.deepEqual(state.tasks.map((task) => task.budgetMs), [30_000, 15_000, 15_000]);
  assert.equal(state.finishAtMs, 60_100);
  assert.equal(state.status, "idle");
});

test("rejects unsafe plan inputs", () => {
  assert.throws(() => createTimerState({ startAtMs: 10, finishAtMs: 10, tasks }));
  assert.throws(() => createTimerState({
    startAtMs: 0,
    finishAtMs: 10,
    tasks: [{ id: "same", title: "One" }, { id: "same", title: "Two" }],
  }));
  assert.throws(() => allocateProportionally(10, [1, 0]));
});

test("pause freezes active time and resume continues it", () => {
  let state = createTimerState({ startAtMs: 0, finishAtMs: 60 * minute, tasks });
  state = startTimer(state, 0);
  state = pauseTimer(state, 5 * minute);
  assert.equal(getTimerSnapshot(state, 20 * minute).elapsedOnActiveTaskMs, 5 * minute);
  state = resumeTimer(state, 20 * minute);
  assert.equal(getTimerSnapshot(state, 22 * minute).elapsedOnActiveTaskMs, 7 * minute);
});

test("completing early banks the remaining window without moving the finish line", () => {
  let state = createTimerState({ startAtMs: 0, finishAtMs: 60 * minute, tasks });
  state = startTimer(state, 0);
  state = completeActiveTask(state, 10 * minute);

  assert.equal(state.finishAtMs, 60 * minute);
  assert.equal(state.tasks[0].completedAtMs, 10 * minute);
  assert.deepEqual(state.tasks.slice(1).map((task) => task.budgetMs), [25 * minute, 25 * minute]);
  assert.equal(state.runningSinceMs, 10 * minute);
});

test("adding time borrows from future work without moving the finish line", () => {
  let state = createTimerState({ startAtMs: 0, finishAtMs: 60 * minute, tasks });
  state = startTimer(state, 0);
  state = addTimeToActiveTask(state, 5 * minute, 5 * minute);
  assert.equal(state.finishAtMs, 60 * minute);
  assert.equal(getTimerSnapshot(state, 5 * minute).activeTaskRemainingMs, 30 * minute);
  assert.deepEqual(state.tasks.slice(1).map(task => task.budgetMs), [12.5 * minute, 12.5 * minute]);
});

test("reports task and goal overtime independently", () => {
  let state = createTimerState({ startAtMs: 0, finishAtMs: 40 * minute, tasks });
  state = startTimer(state, 0);
  const taskLate = getTimerSnapshot(state, 25 * minute);
  assert.equal(taskLate.activeTaskOvertimeMs, 5 * minute);
  assert.equal(taskLate.isGoalOvertime, false);

  const goalLate = getTimerSnapshot(state, 42 * minute);
  assert.equal(goalLate.goalOvertimeMs, 2 * minute);
  assert.equal(goalLate.isGoalOvertime, true);
});

test("completing every task produces a stable completed state", () => {
  let state = createTimerState({ startAtMs: 0, finishAtMs: 60 * minute, tasks });
  state = startTimer(state, 0);
  state = completeActiveTask(state, 5 * minute);
  state = completeActiveTask(state, 15 * minute);
  state = completeActiveTask(state, 25 * minute);
  assert.equal(state.status, "completed");
  assert.equal(state.activeTaskIndex, tasks.length);
  assert.equal(getTimerSnapshot(state, 25 * minute).progress, 1);
});

test("round-trips valid state and rejects corrupted or incompatible storage", () => {
  const state = startTimer(
    createTimerState({ startAtMs: 0, finishAtMs: 60 * minute, tasks }),
    1_000,
  );
  assert.deepEqual(restoreTimerState(serializeTimerState(state)), state);
  assert.equal(restoreTimerState("not json"), null);
  assert.equal(restoreTimerState(JSON.stringify({ ...state, version: 99 })), null);
  assert.equal(restoreTimerState(JSON.stringify({ ...state, activeTaskIndex: 2 })), null);
  const impossibleOrder = {
    ...state,
    tasks: state.tasks.map((task, index) =>
      index === 1 ? { ...task, completedAtMs: 10_000 } : task,
    ),
  };
  assert.equal(restoreTimerState(JSON.stringify(impossibleOrder)), null);
});

test("sound helper stays inert outside the browser and when disabled", async () => {
  const player = createTimerSoundPlayer({ enabled: false });
  assert.equal(await player.play("complete"), false);
  assert.equal(await player.playCountdown(3), false);
  player.setEnabled(true);
  assert.equal(await player.play("goal"), false);
  await player.dispose();
});

test("sound helper honors the reduced-motion preference without creating audio", async () => {
  let audioContextsCreated = 0;
  globalThis.window = {
    matchMedia: () => ({ matches: true }),
    AudioContext: class {
      constructor() { audioContextsCreated += 1; }
    },
  };
  try {
    const player = createTimerSoundPlayer({ enabled: true });
    assert.equal(await player.play("complete"), false);
    assert.equal(audioContextsCreated, 0);
    await player.dispose();
  } finally {
    delete globalThis.window;
  }
});

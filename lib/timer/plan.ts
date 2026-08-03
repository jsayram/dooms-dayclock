import { TIMER_STATE_VERSION } from "./types.ts";
import type { TimerState, TimerTaskInput } from "./types.ts";

const assertFiniteTimestamp = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite timestamp.`);
  }
};

/** Splits integer milliseconds proportionally and preserves the exact total. */
export function allocateProportionally(
  totalMs: number,
  weights: readonly number[],
): number[] {
  if (!Number.isSafeInteger(totalMs) || totalMs < 0) {
    throw new RangeError("totalMs must be a non-negative safe integer.");
  }
  if (weights.length === 0 || weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    throw new RangeError("At least one positive, finite weight is required.");
  }

  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (totalMs * weight) / weightTotal);
  const result = exact.map(Math.floor);
  let remainder = totalMs - result.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let cursor = 0; remainder > 0; cursor += 1, remainder -= 1) {
    result[order[cursor % order.length].index] += 1;
  }
  return result;
}

export function createTimerState(input: {
  startAtMs: number;
  finishAtMs: number;
  tasks: readonly TimerTaskInput[];
}): TimerState {
  assertFiniteTimestamp(input.startAtMs, "startAtMs");
  assertFiniteTimestamp(input.finishAtMs, "finishAtMs");
  if (input.finishAtMs <= input.startAtMs) {
    throw new RangeError("finishAtMs must be later than startAtMs.");
  }
  if (input.tasks.length === 0) throw new RangeError("At least one task is required.");

  const ids = new Set<string>();
  const normalized = input.tasks.map((task) => {
    const id = task.id.trim();
    const title = task.title.trim();
    const weight = task.weight ?? 1;
    if (!id || !title) throw new TypeError("Every task needs a non-empty id and title.");
    if (ids.has(id)) throw new TypeError(`Duplicate task id: ${id}`);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError(`Task ${id} needs a positive, finite weight.`);
    }
    ids.add(id);
    return { id, title, weight };
  });

  const budgets = allocateProportionally(
    input.finishAtMs - input.startAtMs,
    normalized.map((task) => task.weight),
  );

  return {
    version: TIMER_STATE_VERSION,
    startAtMs: input.startAtMs,
    finishAtMs: input.finishAtMs,
    status: "idle",
    tasks: normalized.map((task, index) => ({
      ...task,
      budgetMs: budgets[index],
      completedAtMs: null,
    })),
    activeTaskIndex: 0,
    activeElapsedMs: 0,
    runningSinceMs: null,
    updatedAtMs: input.startAtMs,
  };
}


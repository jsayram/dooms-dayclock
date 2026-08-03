import type { FocusTask } from "../types";

export const defaultTaskSeeds = [
  ["Kitchen reset", "Clear the sink, stack or load dishes, and put obvious items away.", 45],
  ["Bathroom quick pass", "Toilet, sink, mirror, and the visible floor. Good enough counts.", 25],
  ["Bedroom pickup", "Clear the main surfaces and make one clean place to pack.", 30],
  ["Put laundry away", "Fold, hang, and stop before reorganizing any drawers.", 30],
  ["Pack the confirmed items", "Pack what is certain. Leave maybes beside the suitcase.", 45],
  ["Final reset", "Bag trash, check the list, and choose tomorrow's first move.", 15],
] as const;

export function createDefaultTasks(): FocusTask[] {
  return defaultTaskSeeds.map(([title, details, weightMinutes], index) => ({
    id: `task-${index + 1}`,
    title,
    details,
    weightMinutes,
    allocatedSeconds: weightMinutes * 60,
    remainingSeconds: weightMinutes * 60,
    completed: false,
  }));
}

export function nextDefaultFinish(): number {
  const finish = new Date();
  finish.setHours(19, 0, 0, 0);
  if (finish.getTime() <= Date.now()) finish.setDate(finish.getDate() + 1);
  return finish.getTime();
}

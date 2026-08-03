export const TIMER_STATE_VERSION = 1 as const;

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerTaskInput {
  id: string;
  title: string;
  /** Relative share of the available time. */
  weight?: number;
}

export interface TimerTask {
  id: string;
  title: string;
  weight: number;
  budgetMs: number;
  completedAtMs: number | null;
}

export interface TimerState {
  version: typeof TIMER_STATE_VERSION;
  startAtMs: number;
  finishAtMs: number;
  status: TimerStatus;
  tasks: TimerTask[];
  activeTaskIndex: number;
  activeElapsedMs: number;
  runningSinceMs: number | null;
  updatedAtMs: number;
}

export interface TimerSnapshot {
  activeTask: TimerTask | null;
  activeTaskRemainingMs: number;
  activeTaskOvertimeMs: number;
  goalRemainingMs: number;
  goalOvertimeMs: number;
  elapsedOnActiveTaskMs: number;
  progress: number;
  completedCount: number;
  isTaskOvertime: boolean;
  isGoalOvertime: boolean;
}


export type FocusTask = {
  id: string;
  title: string;
  details: string;
  weightMinutes: number;
  allocatedSeconds: number;
  remainingSeconds: number;
  completed: boolean;
};

export type FocusPlan = {
  title: string;
  finishAt: number;
  tasks: FocusTask[];
};

export type FocusStatus = "ready" | "running" | "paused" | "complete";

export type AiProviderId = "openai" | "anthropic" | "ollama" | "lmstudio";
export type MusicProviderId = "youtube" | "spotify" | "apple";

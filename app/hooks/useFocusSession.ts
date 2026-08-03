"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  type TimerState,
} from "../../lib/timer/index";
import { createDefaultTasks, nextDefaultFinish } from "../data/default-plan";
import type { FocusStatus, FocusTask } from "../types";

const STORAGE_KEY = "doomsday-clock-v2-guest-session";
const MAX_TITLE = 120;
export type TaskSeed = { id: string; title: string; details: string; weightMinutes: number };

function initialTimer(): TimerState {
  const now = Date.now();
  const seeds = createDefaultTasks();
  return createTimerState({
    startAtMs: now,
    finishAtMs: nextDefaultFinish(),
    tasks: seeds.map(task => ({ id: task.id, title: task.title, weight: task.weightMinutes })),
  });
}

function safeDetails(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).slice(0, 40).filter(([key, text]) =>
    key.length <= 80 && typeof text === "string" && text.length <= 400,
  ));
}

export function useFocusSession() {
  const defaults = useMemo(() => createDefaultTasks(), []);
  const [timer, setTimer] = useState<TimerState>(initialTimer);
  const [title, setTitle] = useState("Puerto Rico prep sprint");
  const [details, setDetails] = useState<Record<string, string>>(() => Object.fromEntries(defaults.map(t => [t.id, t.details])));
  const [now, setNow] = useState(() => timer.startAtMs);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [storageReady, setStorageReady] = useState(false);
  const sound = useRef<ReturnType<typeof createTimerSoundPlayer> | null>(null);

  useEffect(() => {
    sound.current = createTimerSoundPlayer({ enabled: true, volume: 0.14 });
    return () => { void sound.current?.dispose(); };
  }, []);

  useEffect(() => sound.current?.setEnabled(soundEnabled), [soundEnabled]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { timer?: string; title?: unknown; details?: unknown; soundEnabled?: unknown };
          if (typeof saved.timer === "string") {
            const restored = restoreTimerState(saved.timer);
            if (restored) setTimer(restored);
          }
          if (typeof saved.title === "string" && saved.title.length <= MAX_TITLE) setTitle(saved.title);
          setDetails(previous => ({ ...previous, ...safeDetails(saved.details) }));
          if (typeof saved.soundEnabled === "boolean") setSoundEnabled(saved.soundEnabled);
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ timer: serializeTimerState(timer), title, details, soundEnabled })); }
    catch { /* The in-memory timer remains usable when browser storage is unavailable. */ }
  }, [timer, title, details, soundEnabled, storageReady]);

  const snapshot = getTimerSnapshot(timer, now);
  useEffect(() => {
    if (timer.status === "running") void sound.current?.playCountdown(snapshot.activeTaskRemainingMs / 1000);
  }, [timer.status, snapshot.activeTaskRemainingMs]);

  const tasks: FocusTask[] = timer.tasks.map(task => ({
    id: task.id,
    title: task.title,
    details: details[task.id] ?? "One clear pass. Stop when the timer says stop.",
    weightMinutes: task.weight,
    allocatedSeconds: task.budgetMs / 1000,
    remainingSeconds: task.budgetMs / 1000,
    completed: task.completedAtMs !== null,
  }));

  const status: FocusStatus = timer.status === "completed" ? "complete" : timer.status === "running" ? "running" : timer.status === "paused" ? "paused" : "ready";
  const toggle = useCallback(() => setTimer(current => current.status === "running" ? pauseTimer(current, Date.now()) : current.status === "paused" ? resumeTimer(current, Date.now()) : startTimer(current, Date.now())), []);
  const complete = useCallback(() => {
    setTimer(current => {
      const next = completeActiveTask(current, Date.now());
      void sound.current?.play(next.status === "completed" ? "goal" : "complete");
      return next;
    });
  }, []);
  const restart = useCallback(() => setTimer(current => ({ ...current, activeElapsedMs: 0, runningSinceMs: current.status === "running" ? Date.now() : null, updatedAtMs: Date.now() })), []);
  const addTime = useCallback(() => setTimer(current => addTimeToActiveTask(current, Date.now(), 5 * 60 * 1000)), []);

  const replacePlan = useCallback((nextTitle: string, finishAtMs: number, seeds: TaskSeed[]) => {
    const startAtMs = Date.now();
    setTimer(createTimerState({ startAtMs, finishAtMs, tasks: seeds.map(seed => ({ id: seed.id, title: seed.title, weight: seed.weightMinutes })) }));
    setTitle(nextTitle.trim().slice(0, MAX_TITLE) || "My focus sprint");
    setDetails(Object.fromEntries(seeds.map(seed => [seed.id, seed.details.slice(0, 400)])));
  }, []);

  return { timer, title, tasks, snapshot, status, now, soundEnabled, setSoundEnabled, toggle, complete, restart, addTime, replacePlan };
}

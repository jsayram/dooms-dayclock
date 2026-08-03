"use client";

import { Check, Pause, Play, Plus, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { FocusStatus, FocusTask } from "../types";

type Props = {
  task?: FocusTask;
  status: FocusStatus;
  displayTime: string;
  finishLabel: string;
  progress: number;
  activeStep: number;
  totalSteps: number;
  xp: number;
  soundEnabled: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onRestart: () => void;
  onAddTime: () => void;
  onToggleSound: () => void;
};

export function TimerHero(props: Props) {
  const { task, status, displayTime, finishLabel, progress, xp } = props;
  return (
    <section className="timer-card" aria-labelledby="current-task-heading">
      <div className="timer-card-top">
        <span className="eyebrow"><Zap aria-hidden="true" /> Current quest</span>
        <span className="xp-pill">{xp} XP</span>
      </div>
      <div className="timer-grid">
        <div className="task-copy">
          <p className="task-step">Step {Math.max(1, props.activeStep)} of {Math.max(1, props.totalSteps)}</p>
          <h1 id="current-task-heading">{task?.title ?? "You cleared the board"}</h1>
          <p>{task?.details ?? "Take the win. Your next move can wait until you choose it."}</p>
          <div className="finish-chip">Finish line <strong>{finishLabel}</strong></div>
        </div>
        <div className={`timer-orbit ${status}`} aria-label={`${displayTime} remaining`}>
          <div className="orbit-pulse" />
          <div className="timer-readout"><span>{displayTime}</span><small>{status === "complete" ? "complete" : "remaining"}</small></div>
        </div>
      </div>
      <Progress className="timer-progress" value={Math.round(progress * 100)} aria-label="Sprint progress" />
      <div className="timer-actions">
        <button className="primary-action" onClick={props.onToggle} disabled={status === "complete"}>
          {status === "running" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {status === "running" ? "Pause focus" : status === "paused" ? "Keep going" : "Start focus"}
        </button>
        <button className="reward-action" onClick={props.onComplete} disabled={!task}>
          <Check aria-hidden="true" /> Done early
        </button>
        <button className="icon-button" onClick={props.onRestart} aria-label="Restart current task"><RotateCcw aria-hidden="true" /></button>
        <button className="icon-button" onClick={props.onAddTime} aria-label="Give current task five more minutes"><Plus aria-hidden="true" /></button>
        <button className="icon-button" onClick={props.onToggleSound} aria-label={props.soundEnabled ? "Mute sounds" : "Enable sounds"}>
          {props.soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Flame, Sparkles, Trophy, WalletCards } from "lucide-react";
import { BrandHeader } from "./BrandHeader";
import { TimerHero } from "./TimerHero";
import { TaskLane } from "./TaskLane";
import { PlannerPanel } from "./PlannerPanel";
import { MusicPanel } from "./MusicPanel";
import { AccountabilityCard, type ActivePledge } from "./AccountabilityCard";
import { OutcomeDialog } from "./OutcomeDialog";
import { SettingsDialog } from "./SettingsDialog";
import { CloudPlansCard } from "./CloudPlansCard";
import { useFocusSession, type TaskSeed } from "../hooks/useFocusSession";

function span(ms: number) {
  const total = Math.max(0, Math.ceil(Math.abs(ms) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function finishLabel(timestamp: number) {
  const finish = new Date(timestamp);
  const tomorrow = finish.toDateString() !== new Date().toDateString();
  return `${finish.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${tomorrow ? ` · ${finish.toLocaleDateString([], { month: "short", day: "numeric" })}` : ""}`;
}

export function FocusApp() {
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const session = useFocusSession();
  const [showPlanner, setShowPlanner] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pledge, setPledge] = useState<ActivePledge>(null);
  const [dismissedMiss, setDismissedMiss] = useState(false);
  const current = session.tasks[session.timer.activeTaskIndex];
  const initialSeeds: TaskSeed[] = useMemo(() => session.tasks.map(task => ({ id: task.id, title: task.title, details: task.details, weightMinutes: task.weightMinutes })), [session.tasks]);
  const outcome = session.status === "complete" ? "completed" : session.snapshot.isGoalOvertime && !dismissedMiss ? "missed" : null;
  const xp = session.snapshot.completedCount * 125 + (session.status === "complete" ? 250 : 0);
  const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hydrated) return <main id="main" className="dashboard"><p className="app-loading" role="status">Setting your finish line…</p></main>;

  return (
    <div className="app-shell">
      <BrandHeader onOpenSettings={() => setSettingsOpen(true)} />
      <main id="main" className="dashboard">
        <section className="welcome-strip" aria-label="Sprint overview">
          <div><span className="eyebrow"><Sparkles aria-hidden="true" /> Today&apos;s sprint</span><h2>{session.title}</h2></div>
          <div className="stat-strip">
            <span><Flame aria-hidden="true" /><strong>1</strong><small>day streak</small></span>
            <span><Trophy aria-hidden="true" /><strong>{xp}</strong><small>focus XP</small></span>
            <span><CalendarClock aria-hidden="true" /><strong>{finishLabel(session.timer.finishAtMs)}</strong><small>finish line</small></span>
          </div>
        </section>

        <button className="planner-toggle" onClick={() => setShowPlanner(value => !value)} aria-expanded={showPlanner}>
          <span><CalendarClock aria-hidden="true" /> Edit the plan and finish time</span>{showPlanner ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
        {showPlanner && <PlannerPanel initialTitle={session.title} initialFinishAtMs={session.timer.finishAtMs} initialTasks={initialSeeds} onOpenAi={() => setSettingsOpen(true)} onApply={(title, finish, tasks) => { session.replacePlan(title, finish, tasks); setShowPlanner(false); setDismissedMiss(false); }} />}

        <div className="main-grid">
          <div className="focus-column">
            <TimerHero
              task={current}
              status={session.status}
              displayTime={`${session.snapshot.isTaskOvertime ? "+" : ""}${span(session.snapshot.activeTaskRemainingMs)}`}
              finishLabel={finishLabel(session.timer.finishAtMs)}
              progress={session.snapshot.progress}
              activeStep={Math.min(session.timer.activeTaskIndex + 1, session.tasks.length)}
              totalSteps={session.tasks.length}
              xp={xp}
              soundEnabled={session.soundEnabled}
              onToggle={session.toggle}
              onComplete={session.complete}
              onRestart={session.restart}
              onAddTime={session.addTime}
              onToggleSound={() => session.setSoundEnabled(value => !value)}
            />
            <TaskLane tasks={session.tasks} activeIndex={session.timer.activeTaskIndex} />
          </div>
          <aside className="side-column" aria-label="Optional focus tools">
            <MusicPanel running={session.status === "running"} />
            {clerkReady && <CloudPlansCard title={session.title} finishAtMs={session.timer.finishAtMs} tasks={initialSeeds} onLoad={(title, finishAtMs, tasks) => session.replacePlan(title, finishAtMs, tasks)} />}
            <AccountabilityCard pledge={pledge} onChange={setPledge} />
            <section className="side-card safety-card"><span><WalletCards aria-hidden="true" /></span><div><h2>Nothing extra is required</h2><p>The timer works without sign-in, music, AI, or payment. Those tools stay optional.</p></div></section>
          </aside>
        </div>
      </main>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <OutcomeDialog result={outcome} pledge={pledge} onClose={() => { if (outcome === "missed") setDismissedMiss(true); }} />
    </div>
  );
}

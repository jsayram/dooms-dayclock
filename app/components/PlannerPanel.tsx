"use client";

import { useMemo, useState } from "react";
import { Bot, CalendarClock, Plus, Sparkles, Trash2 } from "lucide-react";
import type { TaskSeed } from "../hooks/useFocusSession";
import { useAiConnection } from "../contexts/AiConnection";

type Props = { initialTitle: string; initialFinishAtMs: number; initialTasks: TaskSeed[]; onApply: (title: string, finishAt: number, tasks: TaskSeed[]) => void; onOpenAi: () => void };

function localTimeValue(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function PlannerPanel({ initialTitle, initialFinishAtMs, initialTasks, onApply, onOpenAi }: Props) {
  const ai = useAiConnection();
  const [title, setTitle] = useState(initialTitle);
  const [finish, setFinish] = useState(localTimeValue(initialFinishAtMs));
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState("");
  const [goal, setGoal] = useState("");
  const total = useMemo(() => tasks.reduce((sum, task) => sum + task.weightMinutes, 0), [tasks]);

  function update(index: number, patch: Partial<TaskSeed>) { setTasks(current => current.map((task, i) => i === index ? { ...task, ...patch } : task)); }
  function add() { if (tasks.length < 20) setTasks(current => [...current, { id: crypto.randomUUID(), title: "New task", details: "Write the smallest useful version of this step.", weightMinutes: 15 }]); }
  function apply() {
    const finishAt = new Date(finish).getTime();
    if (!title.trim()) return setError("Give this sprint a short name.");
    if (!Number.isFinite(finishAt) || finishAt <= Date.now() + 60_000) return setError("Choose a finish time at least one minute from now.");
    if (!tasks.length || tasks.some(task => !task.title.trim() || task.weightMinutes < 1)) return setError("Every task needs a name and at least one minute of weight.");
    setError(""); onApply(title, finishAt, tasks);
  }

  async function draftWithAi() {
    if (!ai.connected) return onOpenAi();
    if (goal.trim().length < 3) return setError("Describe what you need to finish first.");
    setError("");
    try {
      const plan = await ai.generate(goal, Math.min(12, Math.max(3, tasks.length)));
      setTitle(plan.title); setTasks(plan.tasks);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The model could not create a plan."); }
  }

  return (
    <section className="planner-card" aria-labelledby="planner-title">
      <div className="section-heading"><div><span className="eyebrow"><CalendarClock aria-hidden="true" /> Plan the finish</span><h2 id="planner-title">What needs to be done?</h2></div></div>
      <div className="ai-draft-row"><label className="field"><span>Describe the finish line for AI</span><textarea value={goal} maxLength={1200} placeholder="Pack for Puerto Rico and reset the apartment before I leave." onChange={event => setGoal(event.target.value)} /></label><button className="soft-button" onClick={draftWithAi} disabled={ai.busy}><Bot aria-hidden="true" /> {ai.busy ? "Drafting…" : ai.connected ? "Draft with AI" : "Connect AI"}</button></div>
      <label className="field"><span>Sprint name</span><input value={title} maxLength={120} onChange={event => setTitle(event.target.value)} /></label>
      <label className="field"><span>Finish by</span><input type="datetime-local" value={finish} onChange={event => setFinish(event.target.value)} /></label>
      <div className="editable-tasks">
        {tasks.map((task, index) => <div className="editable-task" key={task.id}>
          <span className="task-number">{index + 1}</span>
          <div><input aria-label={`Task ${index + 1} name`} value={task.title} maxLength={100} onChange={event => update(index, { title: event.target.value })} /><input aria-label={`Task ${index + 1} details`} value={task.details} maxLength={400} onChange={event => update(index, { details: event.target.value })} /></div>
          <label><span>Weight</span><input type="number" min="1" max="240" value={task.weightMinutes} onChange={event => update(index, { weightMinutes: Math.max(1, Math.min(240, Number(event.target.value))) })} /></label>
          <button className="icon-button" aria-label={`Remove ${task.title}`} onClick={() => setTasks(current => current.filter((_, i) => i !== index))}><Trash2 aria-hidden="true" /></button>
        </div>)}
      </div>
      <div className="planner-footer"><button className="soft-button" onClick={add}><Plus aria-hidden="true" /> Add step</button><span>{total} weighted minutes</span><button className="primary-action compact" onClick={apply}><Sparkles aria-hidden="true" /> Build my sprint</button></div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  );
}

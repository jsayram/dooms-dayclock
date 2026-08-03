"use client";

import { Check, ListChecks } from "lucide-react";
import type { FocusTask } from "../types";

type Props = { tasks: FocusTask[]; activeIndex: number };

function minutes(seconds: number) { return Math.max(1, Math.round(seconds / 60)); }

export function TaskLane({ tasks, activeIndex }: Props) {
  return (
    <section className="task-lane" aria-labelledby="task-lane-title">
      <div className="section-heading"><div><span className="eyebrow"><ListChecks aria-hidden="true" /> Quest line</span><h2 id="task-lane-title">The rest of the route</h2></div><span>{tasks.filter(t => t.completed).length}/{tasks.length} cleared</span></div>
      <div className="task-list" role="list">
        {tasks.map((task, index) => (
          <div role="listitem" key={task.id} className={`task-row ${task.completed ? "done" : ""} ${index === activeIndex ? "active" : ""}`}>
            <span className="task-state">{task.completed ? <Check aria-hidden="true" /> : index + 1}</span>
            <span className="task-row-copy"><strong>{task.title}</strong><small>{task.details}</small></span>
            <span className="duration-chip">{minutes(task.allocatedSeconds)}m</span>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { selectAllowedEndpoint } from "../../lib/integrations/ai/registry";
import type { AiProviderId } from "../../lib/integrations/ai/types";
import { SessionCredentialStore } from "../../lib/integrations/credentials";
import type { TaskSeed } from "../hooks/useFocusSession";

const credentials = new SessionCredentialStore();
type GeneratedPlan = { title: string; tasks: TaskSeed[] };
type ContextValue = {
  provider: AiProviderId;
  setProvider: (provider: AiProviderId) => void;
  models: string[];
  model: string;
  setModel: (model: string) => void;
  status: string;
  busy: boolean;
  connected: boolean;
  connect: (key?: string) => Promise<void>;
  generate: (goal: string, taskCount: number) => Promise<GeneratedPlan>;
};

const AiConnectionContext = createContext<ContextValue | null>(null);

function parsePlan(value: unknown): GeneratedPlan {
  if (!value || typeof value !== "object") throw new Error("The model returned a plan I could not read.");
  const candidate = value as { title?: unknown; tasks?: unknown };
  if (typeof candidate.title !== "string" || !Array.isArray(candidate.tasks) || !candidate.tasks.length || candidate.tasks.length > 20) throw new Error("The model returned an incomplete plan.");
  const tasks = candidate.tasks.map(item => {
    const task = item as { title?: unknown; details?: unknown; weightMinutes?: unknown };
    if (typeof task.title !== "string" || !task.title.trim()) throw new Error("One generated step was missing a name.");
    return {
      id: crypto.randomUUID(),
      title: task.title.trim().slice(0, 100),
      details: typeof task.details === "string" ? task.details.trim().slice(0, 400) : "",
      weightMinutes: Math.max(1, Math.min(240, Math.round(Number(task.weightMinutes) || 15))),
    } satisfies TaskSeed;
  });
  return { title: candidate.title.trim().slice(0, 120) || "My focus sprint", tasks };
}

function promptFor(goal: string, taskCount: number) {
  return `Return only JSON with a short title and exactly ${taskCount} concrete tasks. Each task needs title, details, and weightMinutes from 1 to 240. Goal: ${goal}`;
}

export function AiConnectionProvider({ children }: { children: ReactNode }) {
  const [provider, changeProvider] = useState<AiProviderId>("openai");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function setProvider(next: AiProviderId) {
    credentials.clear();
    changeProvider(next); setModels([]); setModel(""); setStatus("");
  }

  async function connect(key = "") {
    setBusy(true); setStatus(""); setModels([]); setModel("");
    try {
      let discovered: string[] = [];
      if (provider === "openai" || provider === "anthropic") {
        credentials.set(provider, key);
        const response = await fetch("/api/ai/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey: credentials.get(provider) }) });
        const data = await response.json() as { models?: { id?: string }[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Connection unavailable.");
        discovered = (data.models ?? []).map(item => item.id ?? "").filter(Boolean);
      } else {
        const endpoint = selectAllowedEndpoint(provider);
        const response = await fetch(provider === "ollama" ? `${endpoint}/api/tags` : `${endpoint}/models`, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("The local model server did not answer.");
        const data = await response.json() as { models?: { name?: string }[]; data?: { id?: string }[] };
        discovered = provider === "ollama" ? (data.models ?? []).map(item => item.name ?? "").filter(Boolean) : (data.data ?? []).map(item => item.id ?? "").filter(Boolean);
      }
      setModels(discovered.slice(0, 100)); setModel(discovered[0] ?? "");
      setStatus(discovered.length ? `Connected. ${discovered.length} models available.` : "Connected, but no models were returned.");
    } catch (error) {
      if (provider === "openai" || provider === "anthropic") credentials.clear(provider);
      setStatus(error instanceof Error ? error.message : "Connection unavailable.");
      throw error;
    } finally { setBusy(false); }
  }

  async function generate(goal: string, taskCount: number) {
    const cleanGoal = goal.trim();
    if (cleanGoal.length < 3 || cleanGoal.length > 1200 || !model) throw new Error("Connect a model and describe your goal first.");
    setBusy(true);
    try {
      if (provider === "openai" || provider === "anthropic") {
        const apiKey = credentials.get(provider);
        if (!apiKey) throw new Error("Reconnect your session-only API key.");
        const response = await fetch("/api/ai/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey, model, goal: cleanGoal, taskCount }) });
        const data = await response.json() as { plan?: unknown; error?: string };
        if (!response.ok) throw new Error(data.error ?? "The provider could not create a plan.");
        return parsePlan(data.plan);
      }
      const endpoint = selectAllowedEndpoint(provider);
      const response = await fetch(provider === "ollama" ? `${endpoint}/api/generate` : `${endpoint}/chat/completions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider === "ollama" ? { model, prompt: promptFor(cleanGoal, taskCount), stream: false, format: "json" } : { model, messages: [{ role: "user", content: promptFor(cleanGoal, taskCount) }], temperature: 0.2 }),
      });
      if (!response.ok) throw new Error("The local model could not create a plan.");
      const data = await response.json() as { response?: string; choices?: { message?: { content?: string } }[] };
      return parsePlan(JSON.parse(provider === "ollama" ? data.response ?? "" : data.choices?.[0]?.message?.content ?? ""));
    } finally { setBusy(false); }
  }

  const value = { provider, setProvider, models, model, setModel, status, busy, connected: Boolean(model), connect, generate };
  return <AiConnectionContext.Provider value={value}>{children}</AiConnectionContext.Provider>;
}

export function useAiConnection() {
  const value = useContext(AiConnectionContext);
  if (!value) throw new Error("useAiConnection must be used inside AiConnectionProvider.");
  return value;
}

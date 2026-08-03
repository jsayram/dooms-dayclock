"use client";

import { useAuth } from "@clerk/react";
import { Cloud, Download, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { TaskSeed } from "../hooks/useFocusSession";

type SavedPlan = { id: string; title: string; finishAtMs: number; tasks: TaskSeed[]; updatedAt: string };
type Props = {
  title: string;
  finishAtMs: number;
  tasks: TaskSeed[];
  onLoad: (title: string, finishAtMs: number, tasks: TaskSeed[]) => void;
};

export function CloudPlansCard({ title, finishAtMs, tasks, onLoad }: Props) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("Sign in to use cloud plans.");
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  const refresh = useCallback(async () => {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/plans", { headers: await authHeaders(), cache: "no-store" });
      const data = await response.json() as { plans?: SavedPlan[]; error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "Cloud plans are unavailable.");
      setPlans(data.plans ?? []); setStatus(data.plans?.length ? "Cloud plans refreshed." : "No cloud plans yet.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Cloud plans are unavailable."); }
    finally { setBusy(false); }
  }, [authHeaders]);

  async function save() {
    setBusy(true); setStatus("");
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { ...(await authHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({ title, finishAtMs, tasks }),
      });
      const data = await response.json() as { plan?: SavedPlan; error?: { message?: string } };
      if (!response.ok || !data.plan) throw new Error(data.error?.message ?? "That plan could not be saved.");
      setPlans(current => [data.plan!, ...current]); setStatus("Saved to your account.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "That plan could not be saved."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => { void refresh(); });
  }, [isLoaded, isSignedIn, refresh]);

  return (
    <section className="side-card" aria-labelledby="cloud-plans-title">
      <div className="side-card-title"><span><Cloud aria-hidden="true" /></span><div><h2 id="cloud-plans-title">Cloud plans</h2><p>Optional account storage. Guest recovery still stays on this device.</p></div></div>
      {!isLoaded ? <p className="privacy-note">Checking your session…</p> : !isSignedIn ? <p className="privacy-note">Sign in with Google from the header to save across devices.</p> : <>
        <div className="cloud-actions"><button className="soft-button" onClick={save} disabled={busy}><Save aria-hidden="true" /> Save this plan</button><button className="icon-button" onClick={refresh} disabled={busy} aria-label="Refresh cloud plans"><RefreshCw aria-hidden="true" /></button></div>
        {plans.length > 0 && <label className="field"><span>Saved plans</span><select defaultValue="" onChange={event => {
          const plan = plans.find(item => item.id === event.target.value);
          if (plan) onLoad(plan.title, plan.finishAtMs > Date.now() ? plan.finishAtMs : Date.now() + 60 * 60 * 1000, plan.tasks);
          event.target.value = "";
        }}><option value="" disabled>Choose a plan to load</option>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>}
        {plans.length > 0 && <p className="privacy-note"><Download aria-hidden="true" /> Loading an expired plan moves its finish line one hour ahead so you can edit it safely.</p>}
      </>}
      {status && <p className="connection-status" role="status">{status}</p>}
    </section>
  );
}

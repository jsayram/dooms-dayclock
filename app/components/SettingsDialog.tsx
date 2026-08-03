"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Server, Settings2, X } from "lucide-react";
import { aiProviderRegistry, selectAllowedEndpoint } from "../../lib/integrations/ai/registry";
import type { AiProviderId } from "../../lib/integrations/ai/types";
import { useAiConnection } from "../contexts/AiConnection";

type Props = { open: boolean; onClose: () => void };

export function SettingsDialog({ open, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ai = useAiConnection();
  const provider = ai.provider;
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const descriptor = aiProviderRegistry[provider];
  const endpoint = useMemo(() => selectAllowedEndpoint(provider), [provider]);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  async function connect() {
    try {
      await ai.connect(key);
      if (provider === "openai" || provider === "anthropic") setKey("");
    } catch { /* The shared connection state contains the safe error message. */ }
  }

  return (
    <dialog ref={dialog} className="settings-dialog" onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose} aria-labelledby="settings-title">
      <div className="dialog-head"><div><span className="eyebrow"><Settings2 aria-hidden="true" /> Settings</span><h2 id="settings-title">Connections stay optional</h2></div><button className="icon-button" onClick={onClose} aria-label="Close settings"><X aria-hidden="true" /></button></div>
      <div className="settings-section">
        <div className="settings-title"><Bot aria-hidden="true" /><div><h3>AI task creator</h3><p>Connect one provider, then choose from the models it returns.</p></div></div>
        <label className="field"><span>Provider</span><select value={provider} onChange={event => ai.setProvider(event.target.value as AiProviderId)}>{Object.values(aiProviderRegistry).map(item => <option key={item.id} value={item.id}>{item.displayName} · {item.location}</option>)}</select></label>
        {(provider === "openai" || provider === "anthropic") ? <label className="field"><span>Session-only API key</span><div className="secret-input"><input type={showKey ? "text" : "password"} value={key} autoComplete="off" onChange={event => setKey(event.target.value)} /><button onClick={() => setShowKey(value => !value)} aria-label={showKey ? "Hide API key" : "Show API key"}>{showKey ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div></label> : <div className="endpoint-box"><Server aria-hidden="true" /><span><small>Fixed local endpoint</small><strong>{endpoint}</strong></span></div>}
        <p className="privacy-note"><LockKeyhole aria-hidden="true" /> {descriptor.privacyNotice} Cloud keys stay in memory and disappear on refresh.</p>
        <button className="soft-button full" onClick={connect} disabled={ai.busy || ((provider === "openai" || provider === "anthropic") && key.length < 8)}><KeyRound aria-hidden="true" /> {ai.busy ? "Testing connection…" : "Test connection"}</button>
        {ai.status && <p className="connection-status" role="status"><CheckCircle2 aria-hidden="true" /> {ai.status}</p>}
        {ai.models.length > 0 && <label className="field"><span>Model</span><select value={ai.model} onChange={event => ai.setModel(event.target.value)}>{ai.models.map(id => <option key={id}>{id}</option>)}</select></label>}
      </div>
      <div className="settings-section compact-section"><div className="settings-title"><KeyRound aria-hidden="true" /><div><h3>Google sign-in</h3><p>{process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Clerk is configured. Google availability follows your Clerk dashboard." : "Guest mode is active. Add the Clerk publishable key to enable sign-in."}</p></div></div></div>
    </dialog>
  );
}

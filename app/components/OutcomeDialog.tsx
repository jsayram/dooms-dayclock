"use client";

import { useEffect, useRef } from "react";
import { ExternalLink, Heart, PartyPopper, X } from "lucide-react";
import type { ActivePledge } from "./AccountabilityCard";
import { validateAccountabilityPaymentLink } from "../../lib/integrations/accountability";

type Props = { result: "completed" | "missed" | null; pledge: ActivePledge; onClose: () => void };

export function OutcomeDialog({ result, pledge, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (result && !dialog.current?.open) dialog.current?.showModal();
    if (!result && dialog.current?.open) dialog.current.close();
  }, [result]);
  if (!result) return <dialog ref={dialog} />;
  let paymentUrl = "";
  try { paymentUrl = validateAccountabilityPaymentLink(process.env.NEXT_PUBLIC_BUYMEACOFFEE_URL).url; }
  catch { paymentUrl = ""; }
  const completed = result === "completed";
  return (
    <dialog ref={dialog} className="outcome-dialog" onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose} aria-labelledby="outcome-title">
      <button className="icon-button dialog-close" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
      <span className={`outcome-icon ${completed ? "success" : "warm"}`}>{completed ? <PartyPopper aria-hidden="true" /> : <Heart aria-hidden="true" />}</span>
      <h2 id="outcome-title">{completed ? "You made the finish line." : "That one got away from you."}</h2>
      <p>{completed ? "Your promise is complete. No payment is expected. Take the win and keep the money." : "Your work is still here. Nothing is owed, and every feature stays open. If the pledge helped, you can still honor it. If not, that is completely okay. We hope you had fun and got something done."}</p>
      {pledge && <div className="outcome-pledge"><strong>Your ${pledge.amount} pledge was voluntary.</strong><span>{completed ? "No payment expected." : "You decide what happens next."}</span></div>}
      <div className="outcome-actions">
        <button className="primary-action" onClick={onClose}>{completed ? "Plan another sprint" : "Rebalance my plan"}</button>
        {pledge && paymentUrl && <a className="soft-button" href={paymentUrl} target="_blank" rel="noopener noreferrer">{completed ? "Buy me an optional coffee" : "Honor the pledge, if you want"} <ExternalLink aria-hidden="true" /></a>}
      </div>
      {pledge && !paymentUrl && <small className="payment-disabled">The optional support link has not been configured yet.</small>}
    </dialog>
  );
}

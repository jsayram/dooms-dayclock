"use client";

import { useState } from "react";
import { ExternalLink, HandCoins, HeartHandshake, ShieldCheck } from "lucide-react";
import type { PledgeAmountUsd } from "../../lib/integrations/accountability/types";

export type ActivePledge = { amount: PledgeAmountUsd; active: true } | null;
type Props = { pledge: ActivePledge; onChange: (pledge: ActivePledge) => void };

export function AccountabilityCard({ pledge, onChange }: Props) {
  const [amount, setAmount] = useState<PledgeAmountUsd>(pledge?.amount ?? 3);
  const [accepted, setAccepted] = useState(false);
  return (
    <section className="side-card pledge-card" aria-labelledby="pledge-title">
      <div className="side-card-title"><span><HeartHandshake aria-hidden="true" /></span><div><h2 id="pledge-title">Optional accountability pledge</h2><p>A small promise to yourself. Nothing is charged here.</p></div></div>
      {pledge ? <div className="pledge-active"><HandCoins aria-hidden="true" /><div><strong>${pledge.amount} is on your honor</strong><p>Finish the sprint and no payment is expected. You can remove this anytime.</p></div><button className="text-button" onClick={() => onChange(null)}>Remove</button></div> : <>
        <div className="amount-picker" aria-label="Pledge amount">{([1,2,3,4,5] as PledgeAmountUsd[]).map(value => <button key={value} aria-pressed={amount === value} onClick={() => setAmount(value)}>${value}</button>)}</div>
        <label className="check-row"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>I understand this is voluntary. The app will not charge me, store a payment method, create a debt, or limit any feature.</span></label>
        <button className="soft-button full" disabled={!accepted} onClick={() => onChange({ amount, active: true })}><ShieldCheck aria-hidden="true" /> Make the promise</button>
      </>}
      <a className="policy-link" href="https://help.buymeacoffee.com/en/articles/7983531-different-ways-to-support-a-creator" target="_blank" rel="noopener noreferrer">How Buy Me a Coffee support works <ExternalLink aria-hidden="true" /></a>
    </section>
  );
}

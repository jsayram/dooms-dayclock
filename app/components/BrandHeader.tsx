"use client";

import { Show, SignInButton, UserButton } from "@clerk/react";
import { Clock3, Settings2, ShieldCheck, Sparkles } from "lucide-react";

type Props = { onOpenSettings: () => void };

export function BrandHeader({ onOpenSettings }: Props) {
  const clerkReady = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <header className="brand-header">
      <a className="brand" href="#main" aria-label="Doomsday Clock home">
        <span className="brand-mark"><Clock3 aria-hidden="true" /></span>
        <span><strong>Doomsday Clock</strong><small>Turn panic into a plan</small></span>
      </a>
      <div className="header-actions">
        <span className="privacy-chip"><ShieldCheck aria-hidden="true" /> Private by default</span>
        <button className="icon-button" onClick={onOpenSettings} aria-label="Open settings">
          <Settings2 aria-hidden="true" />
        </button>
        {clerkReady ? (
          <Show when="signed-in" fallback={<SignInButton mode="modal"><button className="sign-in"><Sparkles aria-hidden="true" /> Sign in with Google</button></SignInButton>}>
            <UserButton />
          </Show>
        ) : <button className="sign-in muted" onClick={onOpenSettings}>Guest mode</button>}
      </div>
    </header>
  );
}

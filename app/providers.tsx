"use client";

import { ClerkProvider } from "@clerk/react";
import { AiConnectionProvider } from "./contexts/AiConnection";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const app = <AiConnectionProvider>{children}</AiConnectionProvider>;
  if (!publishableKey) return app;
  return <ClerkProvider publishableKey={publishableKey}>{app}</ClerkProvider>;
}

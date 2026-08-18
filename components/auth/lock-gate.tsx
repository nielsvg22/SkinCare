"use client";

import * as React from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAppLockEnabled, isUnlockedThisSession, verifyAppLock } from "@/lib/auth/app-lock";

export function LockGate({ children }: { children: React.ReactNode }) {
  // null = still checking, true/false = decided. Checking synchronously on
  // first render (not in an effect) avoids a flash of unlocked content —
  // this component only ever mounts client-side, post-hydration, so there's
  // no SSR output to mismatch against.
  const [locked, setLocked] = React.useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return isAppLockEnabled() && !isUnlockedThisSession();
  });
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState(false);

  async function handleUnlock() {
    setVerifying(true);
    setError(false);
    const ok = await verifyAppLock();
    setVerifying(false);
    if (ok) {
      setLocked(false);
    } else {
      setError(true);
    }
  }

  if (locked === null) return null;

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Fingerprint className="size-8" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">App vergrendeld</p>
        <p className="mt-1 text-sm text-foreground-muted">Ontgrendel met Face ID / Touch ID om verder te gaan.</p>
      </div>
      {error && <p className="text-sm text-destructive">Ontgrendelen mislukt — probeer opnieuw.</p>}
      <Button onClick={handleUnlock} disabled={verifying} size="lg">
        {verifying ? "Bezig…" : "Ontgrendelen"}
      </Button>
    </div>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import {
  disableAppLock,
  enableAppLock,
  isAppLockAvailable,
  isAppLockEnabled,
} from "@/lib/auth/app-lock";

export function AppLockToggle() {
  const name = useStore((s) => s.settings.name);
  const [available, setAvailable] = React.useState(false);
  const [enabled, setEnabled] = React.useState(() => (typeof window !== "undefined" ? isAppLockEnabled() : false));
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    isAppLockAvailable().then(setAvailable);
  }, []);

  async function handleToggle(checked: boolean) {
    if (!checked) {
      disableAppLock();
      setEnabled(false);
      toast.success("Appvergrendeling uitgeschakeld");
      return;
    }

    setBusy(true);
    try {
      await enableAppLock(name);
      setEnabled(true);
      toast.success("Appvergrendeling ingeschakeld");
    } catch {
      toast.error("Instellen van Face ID / Touch ID is mislukt of geannuleerd");
    } finally {
      setBusy(false);
    }
  }

  if (!available) {
    return <p className="px-4 py-3.5 text-sm text-foreground-subtle">Niet beschikbaar op dit toestel/deze browser.</p>;
  }

  return <Switch checked={enabled} onCheckedChange={handleToggle} disabled={busy} />;
}

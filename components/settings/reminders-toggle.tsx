"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useStore } from "@/lib/store";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push/subscribe";

export function RemindersToggle() {
  const remindersEnabled = useStore((s) => s.settings.remindersEnabled);
  const updateSettings = useStore((s) => s.updateSettings);
  const mounted = useHasMounted();
  const supported =
    mounted && typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const [busy, setBusy] = React.useState(false);

  async function handleToggle(checked: boolean) {
    if (!checked) {
      setBusy(true);
      try {
        await unsubscribeFromPush();
      } finally {
        setBusy(false);
      }
      updateSettings({ remindersEnabled: false });
      return;
    }

    if (!supported) {
      toast.error("Push-meldingen worden niet ondersteund in deze browser");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Geef toestemming voor meldingen om herinneringen te ontvangen");
      return;
    }

    setBusy(true);
    try {
      await subscribeToPush();
      updateSettings({ remindersEnabled: true });
      toast.success("Herinneringen ingeschakeld — je krijgt rond je ochtendtijd een melding");
    } catch {
      toast.error("Abonneren op meldingen is mislukt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Switch
      checked={remindersEnabled && supported}
      onCheckedChange={handleToggle}
      disabled={busy || (mounted && !supported)}
    />
  );
}

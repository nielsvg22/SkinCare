"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { hasPendingLogs } from "@/lib/offline/log-queue";

/** Retries any offline-queued log writes on mount and whenever the device comes back online. */
export function OfflineSync() {
  const flushPendingLogs = useStore((s) => s.flushPendingLogs);

  useEffect(() => {
    if (hasPendingLogs()) {
      flushPendingLogs();
      toast.success("Offline wijzigingen gesynchroniseerd");
    }

    function handleOnline() {
      if (hasPendingLogs()) {
        flushPendingLogs();
        toast.success("Weer online — wijzigingen gesynchroniseerd");
      }
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushPendingLogs]);

  return null;
}

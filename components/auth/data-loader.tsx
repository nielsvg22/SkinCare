"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAllData } from "@/lib/supabase/repo";
import { useStore } from "@/lib/store";
import { LoadingScreen } from "@/components/auth/loading-screen";

/**
 * Loads the signed-in user's data from Supabase into the store on mount, and
 * keeps it in sync with auth state changes (sign-out from this or another
 * tab, or a fresh sign-in after email confirmation).
 */
export function DataLoader({ children }: { children: React.ReactNode }) {
  const hasHydrated = useStore((s) => s._hasHydrated);
  const hydrate = useStore((s) => s.hydrate);
  const reset = useStore((s) => s.reset);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        reset();
        return;
      }
      try {
        const data = await fetchAllData(supabase, user.id);
        if (!cancelled) hydrate(user.id, data);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    load();

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") reset();
      if (event === "SIGNED_IN") load();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-foreground-muted">
          Je gegevens konden niet worden geladen. Controleer je internetverbinding en probeer het opnieuw.
        </p>
      </div>
    );
  }

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

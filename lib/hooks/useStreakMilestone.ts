"use client";

import { useEffect, useState } from "react";

export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 200, 365];

function storageKey(milestone: number) {
  return `verzorgingsroutine-milestone-seen:${milestone}`;
}

/**
 * Returns a milestone to celebrate once (per device) when the streak first
 * reaches it. This component only ever mounts post-hydration (behind
 * DataLoader's gate), so adjusting state during render here — the React-
 * endorsed pattern for "state that depends on a changed prop" — can't cause
 * an SSR/client mismatch.
 */
export function useStreakMilestone(current: number): number | null {
  const [trackedCurrent, setTrackedCurrent] = useState(-1);
  const [celebrate, setCelebrate] = useState<number | null>(null);

  if (current !== trackedCurrent) {
    setTrackedCurrent(current);
    if (typeof window !== "undefined") {
      const reached = STREAK_MILESTONES.filter((m) => current >= m);
      const next = reached.find((m) => !localStorage.getItem(storageKey(m)));
      if (next) {
        localStorage.setItem(storageKey(next), "1");
        setCelebrate(next);
      }
    }
  }

  useEffect(() => {
    if (celebrate === null) return;
    const timer = setTimeout(() => setCelebrate(null), 5000);
    return () => clearTimeout(timer);
  }, [celebrate]);

  return celebrate;
}

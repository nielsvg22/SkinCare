"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after the client has mounted — avoids hydration mismatches for client-only reads (e.g. resolved theme). */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

"use client";

import type { DailyLog } from "@/lib/types";

// A small localStorage-persisted queue of not-yet-synced daily-log writes,
// keyed by date so repeated offline taps on the same day collapse into a
// single pending write instead of piling up. Scoped to log writes only (by
// far the most frequent action, e.g. checking things off with poor signal)
// rather than every store action — a reasonable, honestly-scoped slice of
// "offline support" rather than a full generic mutation queue.
const STORAGE_KEY = "verzorgingsroutine-pending-logs";

function readQueue(): Record<string, DailyLog> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeQueue(queue: Record<string, DailyLog>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueuePendingLog(log: DailyLog) {
  const queue = readQueue();
  queue[log.date] = log;
  writeQueue(queue);
}

export function dequeuePendingLog(dateKey: string) {
  const queue = readQueue();
  delete queue[dateKey];
  writeQueue(queue);
}

export function getPendingLogs(): DailyLog[] {
  return Object.values(readQueue());
}

export function hasPendingLogs(): boolean {
  return Object.keys(readQueue()).length > 0;
}

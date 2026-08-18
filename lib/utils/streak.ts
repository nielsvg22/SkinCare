import type { DailyLog, Product, StreakInfo } from "@/lib/types";
import { addDaysToKey, getWeekStartKey, parseDateKey, todayKey } from "@/lib/utils/date";
import { buildRoutineForDay, isDayFullyCompleted, requiredStepIds } from "@/lib/utils/routine";

export type DayStatus = "completed" | "partial" | "missed" | "future" | "no-routine";

export function getDayStatus(
  products: Product[],
  logs: Record<string, DailyLog>,
  dateKey: string
): DayStatus {
  const today = todayKey();
  if (dateKey > today) return "future";

  const log = logs[dateKey];
  const date = parseDateKey(dateKey);
  const day = buildRoutineForDay(products, date, log, log?.shaveDayEnabled ?? false);
  const required = requiredStepIds(day);

  if (required.length === 0) return "no-routine";
  if (isDayFullyCompleted(day, log)) return "completed";

  const completedCount = required.filter((id) => log?.completedStepIds.includes(id)).length;
  return completedCount > 0 ? "partial" : "missed";
}

export function computeStreaks(
  products: Product[],
  logs: Record<string, DailyLog>,
  referenceDate: Date = new Date()
): StreakInfo {
  const refKey = todayKey();

  // Current streak: walk backwards from today. Today counts only once completed;
  // an incomplete-but-in-progress "today" doesn't break the streak yet.
  let current = 0;
  let cursor = refKey;
  let first = true;
  while (true) {
    const status = getDayStatus(products, logs, cursor);
    if (status === "no-routine") {
      cursor = addDaysToKey(cursor, -1);
      continue;
    }
    if (status === "completed") {
      current += 1;
      cursor = addDaysToKey(cursor, -1);
      first = false;
      continue;
    }
    if (first && cursor === refKey) {
      // Today not finished yet — doesn't break the streak, just don't count it.
      cursor = addDaysToKey(cursor, -1);
      first = false;
      continue;
    }
    break;
  }

  // Longest streak: scan all known log dates plus today.
  const dateKeys = Object.keys(logs).sort();
  let longest = 0;
  let running = 0;
  let prevKey: string | null = null;
  for (const key of dateKeys) {
    if (key > refKey) continue;
    const status = getDayStatus(products, logs, key);
    if (status === "no-routine") continue;
    if (status === "completed") {
      if (prevKey && addDaysToKey(prevKey, 1) === key) {
        running += 1;
      } else {
        running = 1;
      }
      longest = Math.max(longest, running);
      prevKey = key;
    } else {
      running = 0;
      prevKey = key;
    }
  }
  longest = Math.max(longest, current);

  // This week (Monday-based).
  const weekStart = getWeekStartKey(referenceDate);
  let completedThisWeek = 0;
  let totalDaysThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const key = addDaysToKey(weekStart, i);
    if (key > refKey) continue;
    const status = getDayStatus(products, logs, key);
    if (status === "no-routine") continue;
    totalDaysThisWeek += 1;
    if (status === "completed") completedThisWeek += 1;
  }
  const percentThisWeek =
    totalDaysThisWeek === 0 ? 0 : Math.round((completedThisWeek / totalDaysThisWeek) * 100);

  return { current, longest, completedThisWeek, totalDaysThisWeek, percentThisWeek };
}

export function percentCompletedInRange(
  products: Product[],
  logs: Record<string, DailyLog>,
  startKey: string,
  endKey: string
): number {
  let total = 0;
  let completed = 0;
  let cursor = startKey;
  while (cursor <= endKey) {
    const status = getDayStatus(products, logs, cursor);
    if (status !== "no-routine" && status !== "future") {
      total += 1;
      if (status === "completed") completed += 1;
    }
    cursor = addDaysToKey(cursor, 1);
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export interface DailyCompletionPoint {
  date: string;
  percent: number;
}

export function last30DaysCompletion(
  products: Product[],
  logs: Record<string, DailyLog>
): DailyCompletionPoint[] {
  const today = todayKey();
  const points: DailyCompletionPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const key = addDaysToKey(today, -i);
    const log = logs[key];
    const date = parseDateKey(key);
    const day = buildRoutineForDay(products, date, log, log?.shaveDayEnabled ?? false);
    const required = requiredStepIds(day);
    const completed = required.filter((id) => log?.completedStepIds.includes(id)).length;
    const percent = required.length === 0 ? 0 : Math.round((completed / required.length) * 100);
    points.push({ date: key, percent });
  }
  return points;
}

export interface ProductConsistency {
  productId: string;
  productName: string;
  scheduledDays: number;
  completedDays: number;
  percent: number;
}

/** Ranks products by how consistently they were completed over the last N days (only on days they were scheduled). */
export function productConsistency(
  products: Product[],
  logs: Record<string, DailyLog>,
  daysBack = 30
): ProductConsistency[] {
  const today = todayKey();
  const tally = new Map<string, { scheduled: number; completed: number }>();

  for (let i = 0; i < daysBack; i++) {
    const key = addDaysToKey(today, -i);
    const log = logs[key];
    const date = parseDateKey(key);
    const day = buildRoutineForDay(products, date, log, log?.shaveDayEnabled ?? false);
    for (const step of [...day.morning, ...day.evening]) {
      if (!step.scheduledToday || step.optionalToday || step.placeholder || step.kind !== "product") {
        continue;
      }
      const entry = tally.get(step.id) ?? { scheduled: 0, completed: 0 };
      entry.scheduled += 1;
      if (step.completed) entry.completed += 1;
      tally.set(step.id, entry);
    }
  }

  const results: ProductConsistency[] = [];
  tally.forEach((value, productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product || value.scheduled === 0) return;
    results.push({
      productId,
      productName: product.name,
      scheduledDays: value.scheduled,
      completedDays: value.completed,
      percent: Math.round((value.completed / value.scheduled) * 100),
    });
  });

  return results.sort((a, b) => a.percent - b.percent);
}

import type { DailyLog, Product, WeeklyCheckIn } from "@/lib/types";
import { addDaysToKey, toDateKey, todayKey } from "@/lib/utils/date";
import { buildRoutineForDay, requiredStepIds } from "@/lib/utils/routine";
import { getDayStatus, productConsistency } from "@/lib/utils/streak";
import { estimateConsumption } from "@/lib/utils/consumption";
import { parseDateKey } from "@/lib/utils/date";

const DUTCH_MONTHS_LONG = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** Partial-credit completion percentage for a single tracked day (0-100). */
function dayCompletionPercent(products: Product[], logs: Record<string, DailyLog>, dateKey: string): number | null {
  const status = getDayStatus(products, logs, dateKey);
  if (status === "no-routine" || status === "future" || status === "paused") return null;

  const log = logs[dateKey];
  const date = parseDateKey(dateKey);
  const day = buildRoutineForDay(products, date, log, log?.shaveDayEnabled ?? false);
  const required = requiredStepIds(day);
  if (required.length === 0) return null;
  const completed = required.filter((id) => log?.completedStepIds.includes(id)).length;
  return (completed / required.length) * 100;
}

export interface LifetimeCompletion {
  completedDays: number;
  totalDays: number;
  percent: number;
}

/** How many tracked days (since your first logged day) were fully completed. */
export function lifetimeCompletion(products: Product[], logs: Record<string, DailyLog>): LifetimeCompletion {
  const dateKeys = Object.keys(logs).sort();
  if (dateKeys.length === 0) return { completedDays: 0, totalDays: 0, percent: 0 };

  const today = todayKey();
  let cursor = dateKeys[0];
  let totalDays = 0;
  let completedDays = 0;
  while (cursor <= today) {
    const status = getDayStatus(products, logs, cursor);
    if (status !== "no-routine" && status !== "future" && status !== "paused") {
      totalDays += 1;
      if (status === "completed") completedDays += 1;
    }
    cursor = addDaysToKey(cursor, 1);
  }
  const percent = totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);
  return { completedDays, totalDays, percent };
}

export interface StreakMomentum {
  avgWithMomentum: number | null; // completion % on days right after a fully completed day
  avgFresh: number | null; // completion % on days right after a missed/partial day
  sampleWithMomentum: number;
  sampleFresh: number;
}

/** Are you more consistent on days that follow an already-completed day (streak momentum)? */
export function streakMomentum(products: Product[], logs: Record<string, DailyLog>): StreakMomentum {
  const dateKeys = Object.keys(logs).sort();
  const withMomentum: number[] = [];
  const fresh: number[] = [];

  for (const key of dateKeys) {
    const prevKey = addDaysToKey(key, -1);
    const prevStatus = getDayStatus(products, logs, prevKey);
    if (prevStatus === "no-routine" || prevStatus === "paused") continue; // no signal from a day that had no routine

    const percent = dayCompletionPercent(products, logs, key);
    if (percent === null) continue;

    if (prevStatus === "completed") withMomentum.push(percent);
    else fresh.push(percent);
  }

  const avg = (arr: number[]) => (arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length));

  return {
    avgWithMomentum: avg(withMomentum),
    avgFresh: avg(fresh),
    sampleWithMomentum: withMomentum.length,
    sampleFresh: fresh.length,
  };
}

export interface AdherenceStockEffect {
  productId: string;
  productName: string;
  adherencePercent: number;
  plannedMonths: number | null;
  actualMonths: number | null;
}

/** Compares logged real-world usage vs the planned schedule, and what that means for how long stock lasts. */
export function adherenceStockEffects(
  products: Product[],
  logs: Record<string, DailyLog>,
  daysBack = 60
): AdherenceStockEffect[] {
  const consistency = productConsistency(products, logs, daysBack);

  return consistency
    .filter((c) => c.scheduledDays >= 3)
    .map((c) => {
      const product = products.find((p) => p.id === c.productId);
      if (!product) return null;
      const { monthsRemaining } = estimateConsumption(product);
      const adherencePercent = c.percent;
      const actualMonths =
        monthsRemaining === null || adherencePercent === 0 ? monthsRemaining : monthsRemaining / (adherencePercent / 100);
      return {
        productId: c.productId,
        productName: c.productName,
        adherencePercent,
        plannedMonths: monthsRemaining,
        actualMonths,
      };
    })
    .filter((v): v is AdherenceStockEffect => v !== null)
    .sort((a, b) => a.adherencePercent - b.adherencePercent);
}

export interface CheckInTrendEntry {
  label: string;
  first: number;
  last: number;
  deltaPercent: number | null; // null when first === 0 (can't express a meaningful % change)
}

export interface CheckInTrend {
  entries: CheckInTrendEntry[];
  weeksTracked: number;
}

/** How self-reported ratings evolved from your first to your most recent weekly check-in. */
export function checkInTrend(checkIns: WeeklyCheckIn[]): CheckInTrend | null {
  if (checkIns.length < 2) return null;
  const sorted = [...checkIns].sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  function entry(label: string, key: "hair" | "skin" | "eyes"): CheckInTrendEntry {
    const firstVal = first[key];
    const lastVal = last[key];
    const deltaPercent = firstVal === 0 ? null : Math.round(((lastVal - firstVal) / firstVal) * 100);
    return { label, first: firstVal, last: lastVal, deltaPercent };
  }

  return {
    entries: [entry("Haar", "hair"), entry("Huid", "skin"), entry("Ogen", "eyes")],
    weeksTracked: sorted.length,
  };
}

export interface MonthlyWrapped {
  monthLabel: string;
  completedDays: number;
  totalDays: number;
  percent: number;
  bestStreakInMonth: number;
  mostConsistentProduct: string | null;
  leastConsistentProduct: string | null;
}

/** A month-in-review summary — for the current month up through today, or any completed month if you pass its 1st. */
export function monthlyWrapped(
  products: Product[],
  logs: Record<string, DailyLog>,
  monthStart: Date
): MonthlyWrapped {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const today = parseDateKey(todayKey());
  const rangeEnd = lastOfMonth < today ? lastOfMonth : today;

  const startKey = toDateKey(firstOfMonth);
  const endKey = toDateKey(rangeEnd);

  let totalDays = 0;
  let completedDays = 0;
  let running = 0;
  let bestStreakInMonth = 0;
  let cursor = startKey;
  while (cursor <= endKey) {
    const status = getDayStatus(products, logs, cursor);
    if (status !== "no-routine" && status !== "paused" && status !== "future") {
      totalDays += 1;
      if (status === "completed") {
        completedDays += 1;
        running += 1;
        bestStreakInMonth = Math.max(bestStreakInMonth, running);
      } else {
        running = 0;
      }
    }
    cursor = addDaysToKey(cursor, 1);
  }

  const daysBack = Math.max(1, Math.round((rangeEnd.getTime() - firstOfMonth.getTime()) / 86_400_000) + 1);
  const consistency = productConsistency(products, logs, daysBack).filter((c) => c.scheduledDays >= 3);
  const mostConsistentProduct = consistency.length > 0 ? consistency[consistency.length - 1].productName : null;
  const leastConsistentProduct =
    consistency.length > 1 && consistency[0].percent < 100 ? consistency[0].productName : null;

  return {
    monthLabel: `${DUTCH_MONTHS_LONG[month]} ${year}`,
    completedDays,
    totalDays,
    percent: totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100),
    bestStreakInMonth,
    mostConsistentProduct,
    leastConsistentProduct,
  };
}

import type { Product } from "@/lib/types";
import { weeklyOccurrences } from "@/lib/utils/routine";

const DAYS_PER_MONTH = 30.44;

export function totalRemainingVolume(product: Product): number {
  const { stock, volume } = product;
  const unopened = stock.bottlesUnopened * volume;
  const open = stock.openBottle.isOpen ? (volume * stock.openBottle.remainingPercent) / 100 : 0;
  return unopened + open;
}

export function averageUsagePerApplication(product: Product): number {
  const { min, max } = product.usagePerApplication;
  return (min + max) / 2;
}

export function estimatedDailyUsage(product: Product): number {
  const perWeek = weeklyOccurrences(product);
  return (averageUsagePerApplication(product) * perWeek) / 7;
}

export interface ConsumptionEstimate {
  remainingVolume: number;
  dailyUsage: number;
  daysRemaining: number | null; // null when usage is 0 (paused/unused product)
  monthsRemaining: number | null;
}

export function estimateConsumption(product: Product): ConsumptionEstimate {
  const remainingVolume = totalRemainingVolume(product);
  const dailyUsage = estimatedDailyUsage(product);

  if (dailyUsage <= 0) {
    return { remainingVolume, dailyUsage, daysRemaining: null, monthsRemaining: null };
  }

  const daysRemaining = remainingVolume / dailyUsage;
  const monthsRemaining = daysRemaining / DAYS_PER_MONTH;

  return { remainingVolume, dailyUsage, daysRemaining, monthsRemaining };
}

export function isLowStock(product: Product, defaultThresholdDays: number): boolean {
  const threshold = product.stock.lowStockThresholdDays ?? defaultThresholdDays;
  const { daysRemaining } = estimateConsumption(product);
  if (daysRemaining === null) return false;
  return daysRemaining <= threshold;
}

export function formatMonthsRemaining(months: number | null): string {
  if (months === null) return "Onbekend";
  if (months < 1) return "< 1 maand";
  const rounded = Math.round(months);
  return `± ${rounded} ${rounded === 1 ? "maand" : "maanden"}`;
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return "Onbekend";
  const rounded = Math.round(days);
  return `± ${rounded} ${rounded === 1 ? "dag" : "dagen"}`;
}

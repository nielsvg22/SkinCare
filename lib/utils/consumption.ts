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

/** Current inventory value: purchase price × containers actually in stock (sealed + the open one). */
export function currentInventoryValue(products: Product[]): number {
  return products.reduce((sum, p) => {
    if (p.purchasePrice === undefined) return sum;
    const containers = p.stock.bottlesUnopened + (p.stock.openBottle.isOpen ? 1 : 0);
    return sum + p.purchasePrice * containers;
  }, 0);
}

/** Estimated recurring spend per month, based on usage rate and price per container. */
export function estimatedMonthlySpend(products: Product[]): number {
  return products.reduce((sum, p) => {
    if (p.purchasePrice === undefined || p.paused) return sum;
    const { dailyUsage } = estimateConsumption(p);
    if (dailyUsage <= 0) return sum;
    const costPerUnit = p.purchasePrice / p.volume;
    return sum + costPerUnit * dailyUsage * DAYS_PER_MONTH;
  }, 0);
}

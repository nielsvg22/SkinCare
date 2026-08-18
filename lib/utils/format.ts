import type { Product, RoutineStepView } from "@/lib/types";
import { WEEKDAY_LABELS_SHORT } from "@/lib/data/seed";
import {
  MANUAL_STEP_AFTERSHAVE_PLACEHOLDER,
  MANUAL_STEP_GEZICHT_REINIGEN,
  MANUAL_STEP_SCHEREN,
} from "@/lib/utils/routine";

export function frequencyLabel(product: Product): string {
  const rule = product.frequency;
  switch (rule.type) {
    case "daily":
      return "Iedere dag";
    case "shaveDaysOnly":
      return "Alleen op scheerdagen";
    case "timesPerWeek":
      return `${rule.times}× per week`;
    case "specificWeekdays": {
      if (rule.weekdays.length === 3 || rule.weekdays.length === 4) return "Om de dag";
      const sorted = [...rule.weekdays].sort((a, b) => a - b);
      return sorted.map((d) => WEEKDAY_LABELS_SHORT[d]).join(", ");
    }
    default:
      return "";
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  [MANUAL_STEP_SCHEREN]: "Scheren",
  [MANUAL_STEP_AFTERSHAVE_PLACEHOLDER]: "Gezicht",
  [MANUAL_STEP_GEZICHT_REINIGEN]: "Gezicht",
};

export function stepCategoryLabel(step: RoutineStepView): string {
  if (step.product) return step.product.category;
  return CATEGORY_LABELS[step.id] ?? "Verzorging";
}

export function formatVolume(product: Product): string {
  return `${product.volume} ${product.unit}`;
}

export function formatPrice(value?: number): string {
  if (value === undefined) return "";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value);
}

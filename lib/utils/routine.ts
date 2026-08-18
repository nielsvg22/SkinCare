import type { DailyLog, Product, RoutineDay, RoutineStepView } from "@/lib/types";

export const MANUAL_STEP_SCHEREN = "manual:scheren";
export const MANUAL_STEP_AFTERSHAVE_PLACEHOLDER = "manual:aftershave-placeholder";
export const MANUAL_STEP_GEZICHT_REINIGEN = "manual:gezicht-reinigen";

/** Assumed average shaves/week, used only for stock-consumption estimates. */
export const ASSUMED_SHAVE_DAYS_PER_WEEK = 3;

function isDouchePhase(category: Product["category"]): boolean {
  return category === "Haar" || category === "Lichaam";
}

export function isScheduledOn(
  product: Product,
  date: Date,
  shaveDayEnabled: boolean
): boolean {
  const rule = product.frequency;
  switch (rule.type) {
    case "daily":
      return true;
    case "specificWeekdays":
      return rule.weekdays.includes(date.getDay());
    case "shaveDaysOnly":
      return shaveDayEnabled;
    case "timesPerWeek":
      return true;
    default:
      return true;
  }
}

export function weeklyOccurrences(product: Product): number {
  const rule = product.frequency;
  switch (rule.type) {
    case "daily":
      return 7;
    case "specificWeekdays":
      return rule.weekdays.length;
    case "shaveDaysOnly":
      return ASSUMED_SHAVE_DAYS_PER_WEEK;
    case "timesPerWeek":
      return rule.times;
    default:
      return 7;
  }
}

function toProductStep(
  product: Product,
  date: Date,
  log: DailyLog | undefined,
  shaveDayEnabled: boolean,
  opts: { forcedOptional?: boolean; note?: string } = {}
): RoutineStepView {
  const scheduledToday = isScheduledOn(product, date, shaveDayEnabled);
  const completed = !!log?.completedStepIds.includes(product.id);
  const skippedToday = !!log?.skippedStepIds.includes(product.id);
  const optionalToday = opts.forcedOptional ?? !!product.optional;

  let instructions = product.instructions;
  if (opts.note) {
    instructions = `${instructions} ${opts.note}`;
  }
  if (shaveDayEnabled && product.shaveDayNote) {
    instructions = `${instructions} ${product.shaveDayNote}`;
  }

  return {
    id: product.id,
    kind: "product",
    product,
    label: product.name,
    subLabel: product.brand,
    instructions,
    scheduledToday,
    completed,
    optionalToday,
    skippedToday,
    order: product.order,
  };
}

function manualStep(
  id: string,
  label: string,
  order: number,
  log: DailyLog | undefined,
  opts: { subLabel?: string; instructions?: string; optionalToday?: boolean; placeholder?: boolean } = {}
): RoutineStepView {
  return {
    id,
    kind: "manual",
    label,
    subLabel: opts.subLabel,
    instructions: opts.instructions,
    scheduledToday: true,
    completed: !!log?.completedStepIds.includes(id),
    optionalToday: !!opts.optionalToday,
    skippedToday: !!log?.skippedStepIds.includes(id),
    placeholder: opts.placeholder,
    order,
  };
}

export function buildRoutineForDay(
  products: Product[],
  date: Date,
  log: DailyLog | undefined,
  shaveDayEnabled: boolean
): RoutineDay {
  const active = products.filter((p) => !p.paused && !p.customMoment);

  // ---- Morning ----
  const morningProducts = active.filter(
    (p) => (p.period === "morning" || p.period === "both") && !p.shaveOnly
  );
  const doucheProducts = morningProducts
    .filter((p) => isDouchePhase(p.category))
    .sort((a, b) => a.order - b.order);
  const naDoucheProducts = morningProducts
    .filter((p) => !isDouchePhase(p.category))
    .sort((a, b) => a.order - b.order);

  const doucheSteps = doucheProducts.map((p) => toProductStep(p, date, log, shaveDayEnabled));
  // "both" products are mandatory in the morning — only their evening occurrence is optional.
  const naDoucheSteps = naDoucheProducts.map((p) =>
    toProductStep(p, date, log, shaveDayEnabled, { forcedOptional: p.optional })
  );

  const morning: RoutineStepView[] = [...doucheSteps];

  if (shaveDayEnabled) {
    morning.push(
      manualStep(MANUAL_STEP_SCHEREN, "Scheren", doucheSteps.length + 1, log, {
        subLabel: "Scheerdag",
      })
    );

    const aftershaveProduct = active.find((p) => p.shaveOnly);
    if (aftershaveProduct) {
      morning.push(
        toProductStep(aftershaveProduct, date, log, shaveDayEnabled, {})
      );
    } else {
      morning.push(
        manualStep(MANUAL_STEP_AFTERSHAVE_PLACEHOLDER, "Aftershave", doucheSteps.length + 2, log, {
          subLabel: "Nog geen aftershave toegevoegd",
          placeholder: true,
        })
      );
    }
  }

  morning.push(...naDoucheSteps);
  morning.forEach((step, idx) => (step.order = idx + 1));

  // ---- Evening ----
  const eveningProducts = active.filter(
    (p) => (p.period === "evening" || p.period === "both") && !p.shaveOnly
  );
  const hasCleanserProduct = eveningProducts.some(
    (p) => p.category === "Gezicht" && p.period !== "both"
  );

  const evening: RoutineStepView[] = [];
  if (!hasCleanserProduct) {
    evening.push(
      manualStep(MANUAL_STEP_GEZICHT_REINIGEN, "Gezicht reinigen", 1, log)
    );
  }

  eveningProducts
    .sort((a, b) => a.order - b.order)
    .forEach((p) => {
      evening.push(
        toProductStep(p, date, log, shaveDayEnabled, {
          forcedOptional: p.period === "both" ? true : p.optional,
          note: p.period === "both" ? p.conditionalNote : undefined,
        })
      );
    });
  evening.forEach((step, idx) => (step.order = idx + 1));

  // ---- Custom moments (e.g. "Na het sporten") ----
  const custom: Record<string, RoutineStepView[]> = {};
  const customProducts = products.filter((p) => !p.paused && p.customMoment && !p.shaveOnly);
  customProducts
    .sort((a, b) => a.order - b.order)
    .forEach((p) => {
      const label = p.customMoment!;
      if (!custom[label]) custom[label] = [];
      custom[label].push(toProductStep(p, date, log, shaveDayEnabled));
    });
  Object.values(custom).forEach((steps) => steps.forEach((step, idx) => (step.order = idx + 1)));

  return { morning, evening, custom };
}

export function requiredStepIds(day: RoutineDay): string[] {
  return [...day.morning, ...day.evening, ...Object.values(day.custom).flat()]
    .filter((s) => s.scheduledToday && !s.optionalToday && !s.placeholder)
    .map((s) => s.id);
}

export function isDayFullyCompleted(day: RoutineDay, log: DailyLog | undefined): boolean {
  const required = requiredStepIds(day);
  if (required.length === 0) return false;
  return required.every((id) => log?.completedStepIds.includes(id));
}

export function periodProgress(steps: RoutineStepView[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const relevant = steps.filter((s) => s.scheduledToday && !s.optionalToday && !s.placeholder);
  const completed = relevant.filter((s) => s.completed).length;
  const total = relevant.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

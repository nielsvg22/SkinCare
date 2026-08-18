// Maps between Supabase row shapes (snake_case) and the app's camelCase types.

import type {
  DailyLog,
  Product,
  ProgressPhoto,
  Settings,
  ShoppingItem,
  WeeklyCheckIn,
} from "@/lib/types";

export function productFromRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: row.brand as string,
    category: row.category as Product["category"],
    volume: Number(row.volume),
    unit: row.unit as Product["unit"],
    image: (row.image as string) ?? "",
    period: row.period as Product["period"],
    frequency: row.frequency as Product["frequency"],
    instructions: (row.instructions as string) ?? "",
    usagePerApplication: row.usage_per_application as Product["usagePerApplication"],
    stock: row.stock as Product["stock"],
    purchasePrice: row.purchase_price === null ? undefined : Number(row.purchase_price),
    purchaseUrl: (row.purchase_url as string) ?? undefined,
    customMoment: (row.custom_moment as string) ?? undefined,
    shaveOnly: !!row.shave_only,
    optional: !!row.optional,
    conditionalNote: (row.conditional_note as string) ?? undefined,
    shaveDayNote: (row.shave_day_note as string) ?? undefined,
    paused: !!row.paused,
    order: Number(row.sort_order),
    createdAt: row.created_at as string,
  };
}

export function productToRow(product: Partial<Product>, userId?: string) {
  const row: Record<string, unknown> = {};
  if (product.id !== undefined) row.id = product.id;
  if (userId) row.user_id = userId;
  if (product.name !== undefined) row.name = product.name;
  if (product.brand !== undefined) row.brand = product.brand;
  if (product.category !== undefined) row.category = product.category;
  if (product.volume !== undefined) row.volume = product.volume;
  if (product.unit !== undefined) row.unit = product.unit;
  if (product.image !== undefined) row.image = product.image;
  if (product.period !== undefined) row.period = product.period;
  if (product.frequency !== undefined) row.frequency = product.frequency;
  if (product.instructions !== undefined) row.instructions = product.instructions;
  if (product.usagePerApplication !== undefined) row.usage_per_application = product.usagePerApplication;
  if (product.stock !== undefined) row.stock = product.stock;
  // These use `in` (key present) rather than `!== undefined` (value present):
  // callers that want to CLEAR one of these pass `{ ...field: undefined }`
  // explicitly, which must still write null — a plain `!== undefined` check
  // would silently skip it and leave the old value in the database forever.
  if ("purchasePrice" in product) row.purchase_price = product.purchasePrice ?? null;
  if ("purchaseUrl" in product) row.purchase_url = product.purchaseUrl ?? null;
  if ("customMoment" in product) row.custom_moment = product.customMoment ?? null;
  if (product.shaveOnly !== undefined) row.shave_only = product.shaveOnly;
  if (product.optional !== undefined) row.optional = product.optional;
  if ("conditionalNote" in product) row.conditional_note = product.conditionalNote ?? null;
  if ("shaveDayNote" in product) row.shave_day_note = product.shaveDayNote ?? null;
  if (product.paused !== undefined) row.paused = product.paused;
  if (product.order !== undefined) row.sort_order = product.order;
  if (product.createdAt !== undefined) row.created_at = product.createdAt;
  return row;
}

export function logFromRow(row: Record<string, unknown>): DailyLog {
  return {
    date: row.log_date as string,
    completedStepIds: (row.completed_step_ids as string[]) ?? [],
    skippedStepIds: (row.skipped_step_ids as string[]) ?? [],
    shaveDayEnabled: !!row.shave_day_enabled,
    dayPaused: !!row.day_paused,
  };
}

export function logToRow(log: DailyLog, userId: string) {
  return {
    user_id: userId,
    log_date: log.date,
    completed_step_ids: log.completedStepIds,
    skipped_step_ids: log.skippedStepIds,
    shave_day_enabled: log.shaveDayEnabled,
    day_paused: !!log.dayPaused,
  };
}

export function shoppingItemFromRow(row: Record<string, unknown>): ShoppingItem {
  return {
    id: row.id as string,
    name: row.name as string,
    done: !!row.done,
    linkedProductId: (row.linked_product_id as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function checkInFromRow(row: Record<string, unknown>): WeeklyCheckIn {
  return {
    id: row.id as string,
    weekStart: row.week_start as string,
    hair: Number(row.hair),
    skin: Number(row.skin),
    eyes: Number(row.eyes),
    note: (row.note as string) ?? "",
    createdAt: row.created_at as string,
  };
}

export function photoFromRow(row: Record<string, unknown>): ProgressPhoto {
  return {
    id: row.id as string,
    date: row.photo_date as string,
    category: row.category as ProgressPhoto["category"],
    imageKey: row.storage_path as string,
    note: (row.note as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function settingsFromRow(row: Record<string, unknown> | null): Settings {
  if (!row) {
    return {
      name: "Jij",
      theme: "system",
      morningTime: "07:00",
      eveningTime: "22:00",
      defaultLowStockThresholdDays: 21,
      remindersEnabled: false,
      onboardedAt: new Date().toISOString(),
      shareShoppingList: false,
    };
  }
  return {
    name: row.name as string,
    theme: row.theme as Settings["theme"],
    morningTime: row.morning_time as string,
    eveningTime: row.evening_time as string,
    defaultLowStockThresholdDays: Number(row.default_low_stock_threshold_days),
    remindersEnabled: !!row.reminders_enabled,
    onboardedAt: row.onboarded_at as string,
    partnerId: (row.partner_id as string) ?? null,
    shareShoppingList: !!row.share_shopping_list,
  };
}

export function settingsToRow(settings: Partial<Settings>) {
  const row: Record<string, unknown> = {};
  if (settings.name !== undefined) row.name = settings.name;
  if (settings.theme !== undefined) row.theme = settings.theme;
  if (settings.morningTime !== undefined) row.morning_time = settings.morningTime;
  if (settings.eveningTime !== undefined) row.evening_time = settings.eveningTime;
  if (settings.defaultLowStockThresholdDays !== undefined)
    row.default_low_stock_threshold_days = settings.defaultLowStockThresholdDays;
  if (settings.remindersEnabled !== undefined) row.reminders_enabled = settings.remindersEnabled;
  if (settings.shareShoppingList !== undefined) row.share_shopping_list = settings.shareShoppingList;
  return row;
}

import { z } from "zod";
import type { AppState } from "@/lib/types";

const frequencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({ type: z.literal("specificWeekdays"), weekdays: z.array(z.number().min(0).max(6)) }),
  z.object({ type: z.literal("shaveDaysOnly") }),
  z.object({ type: z.literal("timesPerWeek"), times: z.number().min(1).max(14) }),
]);

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  category: z.enum(["Haar", "Lichaam", "Ogen", "Gezicht", "Overig"]),
  volume: z.number(),
  unit: z.enum(["ml", "g", "stuks"]),
  image: z.string(),
  period: z.enum(["morning", "evening", "both"]),
  frequency: frequencySchema,
  instructions: z.string(),
  usagePerApplication: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(["ml", "g", "stuks"]),
  }),
  stock: z.object({
    bottlesUnopened: z.number(),
    openBottle: z.object({
      isOpen: z.boolean(),
      remainingPercent: z.number(),
      openedAt: z.string().optional(),
    }),
    lowStockThresholdDays: z.number().optional(),
  }),
  purchasePrice: z.number().optional(),
  shaveOnly: z.boolean().optional(),
  optional: z.boolean().optional(),
  conditionalNote: z.string().optional(),
  shaveDayNote: z.string().optional(),
  paused: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
});

const dailyLogSchema = z.object({
  date: z.string(),
  completedStepIds: z.array(z.string()),
  skippedStepIds: z.array(z.string()),
  shaveDayEnabled: z.boolean(),
});

const settingsSchema = z.object({
  name: z.string(),
  theme: z.enum(["light", "dark", "system"]),
  morningTime: z.string(),
  eveningTime: z.string(),
  defaultLowStockThresholdDays: z.number(),
  remindersEnabled: z.boolean(),
  onboardedAt: z.string(),
});

const shoppingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  done: z.boolean(),
  linkedProductId: z.string().optional(),
  createdAt: z.string(),
});

const checkInSchema = z.object({
  id: z.string(),
  weekStart: z.string(),
  hair: z.number(),
  skin: z.number(),
  eyes: z.number(),
  note: z.string(),
  createdAt: z.string(),
});

const photoSchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.enum(["haarlijn", "haar", "huid"]),
  imageKey: z.string(),
  note: z.string().optional(),
  createdAt: z.string(),
});

export const appStateSchema = z.object({
  version: z.number(),
  settings: settingsSchema,
  products: z.array(productSchema),
  logs: z.record(z.string(), dailyLogSchema),
  shoppingList: z.array(shoppingItemSchema),
  checkIns: z.array(checkInSchema),
  photos: z.array(photoSchema),
});

export interface ValidationResult {
  success: boolean;
  data?: AppState;
  error?: string;
}

export function validateImportedData(raw: unknown): ValidationResult {
  const result = appStateSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path.join(".") || "bestand";
    return { success: false, error: `Ongeldig back-upbestand (${path}: ${first?.message}).` };
  }
  return { success: true, data: result.data as AppState };
}

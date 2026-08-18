import type { Settings, ShoppingItem } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  name: "Niels",
  theme: "system",
  morningTime: "08:00",
  eveningTime: "22:00",
  defaultLowStockThresholdDays: 21,
  remindersEnabled: false,
  onboardedAt: new Date().toISOString(),
  shareShoppingList: false,
};

export const SEED_SHOPPING_LIST: ShoppingItem[] = [
  {
    id: "shopping-seed-aftershave",
    name: "Aftershave",
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "shopping-seed-cleanser",
    name: "Gezichtsreiniger",
    done: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

/** Weekday labels, index-aligned with JS Date#getDay() (0 = zondag). */
export const WEEKDAY_LABELS_SHORT = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
export const WEEKDAY_LABELS_LONG = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

/** Monday-first order, used for the weekly overview grid (Ma..Zo). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

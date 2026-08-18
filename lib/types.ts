// Core domain types for the personal care routine app.
// All persisted state is derived from these shapes.

export type ProductCategory = "Haar" | "Lichaam" | "Ogen" | "Gezicht" | "Overig";

export type RoutinePeriod = "morning" | "evening";

export type Unit = "ml" | "g" | "stuks";

/**
 * How often a product is used.
 * - daily: every day
 * - specificWeekdays: only on the given weekdays (0 = zondag ... 6 = zaterdag, JS getDay() convention)
 * - shaveDaysOnly: only counted/scheduled when shave mode is active for that day
 * - timesPerWeek: a target number of uses per week, not tied to fixed days
 */
export type FrequencyRule =
  | { type: "daily" }
  | { type: "specificWeekdays"; weekdays: number[] }
  | { type: "shaveDaysOnly" }
  | { type: "timesPerWeek"; times: number };

export interface UsageAmount {
  min: number;
  max: number;
  unit: Unit;
}

export interface OpenBottleState {
  isOpen: boolean;
  /** Estimated percentage (0-100) remaining in the currently opened container. */
  remainingPercent: number;
  openedAt?: string; // ISO date
}

export interface ProductStock {
  /** Full, still-sealed containers in stock (not counting the currently open one). */
  bottlesUnopened: number;
  openBottle: OpenBottleState;
  /** Custom low-stock threshold in days; falls back to the global setting when undefined. */
  lowStockThresholdDays?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  volume: number;
  unit: Unit;
  /** Path under /public, e.g. "/products/american-crew-boost-shampoo.png", or an idb: reference for user uploads. */
  image: string;
  period: RoutinePeriod | "both";
  frequency: FrequencyRule;
  instructions: string;
  usagePerApplication: UsageAmount;
  stock: ProductStock;
  purchasePrice?: number;
  /** Where this product is usually bought — shown as a "buy again" link when stock is low. */
  purchaseUrl?: string;
  /**
   * Custom routine moment (e.g. "Na het sporten") beyond morning/evening.
   * When set, the product is grouped under this label instead of the
   * morning/evening sections and `period` is ignored for placement.
   */
  customMoment?: string;
  /** Only relevant/used during shave-day routine (e.g. aftershave). */
  shaveOnly?: boolean;
  /** Step is optional: can be skipped for a day without breaking the streak. */
  optional?: boolean;
  /** Optional guidance shown for optional/conditional steps. */
  conditionalNote?: string;
  /** Extra instruction appended only when shave-day mode is active. */
  shaveDayNote?: string;
  paused: boolean;
  order: number;
  createdAt: string;
}

export type NewProductInput = Omit<Product, "id" | "createdAt" | "order">;

export interface DailyLog {
  date: string; // YYYY-MM-DD, local
  completedStepIds: string[]; // productIds (or synthetic step ids like "shave:scheren")
  skippedStepIds: string[]; // voluntarily skipped optional steps
  shaveDayEnabled: boolean;
  /** Vacation/pause mode: the day is excluded from streaks entirely (not a miss). */
  dayPaused?: boolean;
}

export interface WeeklyCheckIn {
  id: string;
  weekStart: string; // YYYY-MM-DD (monday)
  hair: number; // 1-5
  skin: number; // 1-5
  eyes: number; // 1-5
  note: string;
  createdAt: string;
}

export type ProgressPhotoCategory = "haarlijn" | "haar" | "huid";

export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  category: ProgressPhotoCategory;
  /** Reference key into the IndexedDB image store. */
  imageKey: string;
  note?: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
  linkedProductId?: string;
  createdAt: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface ConditionerScheduleDay {
  weekday: number; // 0-6
  active: boolean;
}

export interface Settings {
  name: string;
  theme: ThemeMode;
  morningTime: string; // "08:00"
  eveningTime: string; // "22:00"
  defaultLowStockThresholdDays: number;
  /** Best-effort local reminders while the app/tab is open — see README for iOS PWA push limitations. */
  remindersEnabled: boolean;
  onboardedAt: string;
}

export interface AppState {
  version: number;
  settings: Settings;
  products: Product[];
  logs: Record<string, DailyLog>; // keyed by date
  shoppingList: ShoppingItem[];
  checkIns: WeeklyCheckIn[];
  photos: ProgressPhoto[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  completedThisWeek: number;
  totalDaysThisWeek: number;
  percentThisWeek: number;
}

export interface RoutineStepView {
  id: string;
  kind: "product" | "manual";
  product?: Product;
  label: string;
  subLabel?: string;
  instructions?: string;
  scheduledToday: boolean;
  completed: boolean;
  optionalToday: boolean;
  skippedToday: boolean;
  /** True when this represents a not-yet-configured product (e.g. aftershave) rather than a checkable step. */
  placeholder?: boolean;
  order: number;
}

export interface RoutineDay {
  morning: RoutineStepView[];
  evening: RoutineStepView[];
  /** Custom routine moments (e.g. "Na het sporten"), keyed by label. */
  custom: Record<string, RoutineStepView[]>;
}

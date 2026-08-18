"use client";

import { create } from "zustand";
import { toast } from "sonner";
import type {
  AppState,
  DailyLog,
  NewProductInput,
  Product,
  ProgressPhoto,
  Settings,
  WeeklyCheckIn,
} from "@/lib/types";
import { todayKey } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/client";
import { deleteUserImage } from "@/lib/storage/supabase-storage";
import { enqueuePendingLog, dequeuePendingLog, getPendingLogs } from "@/lib/offline/log-queue";
import {
  clearAllUserData,
  deleteProductRow,
  deleteShoppingItemRow,
  deletePhotoRow,
  fetchAllData,
  insertCheckInRow,
  insertPhotoRow,
  insertProductRow,
  insertShoppingItemRow,
  replaceAllData,
  updateCheckInRow,
  updateProductRow,
  updateProfileRow,
  updateShoppingItemRow,
  upsertLogRow,
} from "@/lib/supabase/repo";

// Lazily created: instantiating @supabase/ssr's browser client eagerly at
// module scope throws when env vars aren't present, which breaks static
// prerendering of any page that merely imports the store. Deferring this
// until an action actually runs (always client-side, post-hydration) avoids
// that entirely.
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

function reportError(action: string) {
  toast.error(`${action} kon niet worden opgeslagen — controleer je internetverbinding`);
}

let offlineToastShown = false;

/**
 * Writes a daily log to Supabase. On a network failure (not offline by
 * choice — genuinely unreachable), the log is queued in localStorage rather
 * than just showing an error, and gets retried automatically once the
 * device is back online (see components/pwa/offline-sync.tsx).
 */
function syncLog(userId: string, log: DailyLog) {
  upsertLogRow(getSupabase(), userId, log).then(({ error }) => {
    if (!error) {
      dequeuePendingLog(log.date);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueuePendingLog(log);
      if (!offlineToastShown) {
        offlineToastShown = true;
        toast("Je bent offline — wordt gesynchroniseerd zodra je weer verbinding hebt", { icon: "📡" });
      }
    } else {
      reportError("Voortgang");
    }
  });
}

interface AppActions {
  // Routine / logs
  completeStep: (stepId: string, dateKey?: string) => void;
  uncompleteStep: (stepId: string, dateKey?: string) => void;
  toggleStep: (stepId: string, dateKey?: string) => void;
  skipStepToday: (stepId: string, dateKey?: string) => void;
  unskipStepToday: (stepId: string, dateKey?: string) => void;
  setShaveDayEnabled: (enabled: boolean, dateKey?: string) => void;
  setDayPaused: (paused: boolean, dateKey?: string) => void;
  getShaveDayEnabled: (dateKey?: string) => boolean;

  // Products
  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  reorderProducts: (orderedIds: string[]) => void;
  setProductPaused: (id: string, paused: boolean) => void;

  // Shopping list
  addShoppingItem: (name: string, linkedProductId?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;

  // Check-ins
  addCheckIn: (checkIn: Omit<WeeklyCheckIn, "id" | "createdAt">) => void;
  updateCheckIn: (id: string, patch: Partial<WeeklyCheckIn>) => void;

  // Photos
  addPhoto: (photo: Omit<ProgressPhoto, "id" | "createdAt">) => void;
  removePhoto: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<Settings>) => void;

  // Data management
  exportData: () => AppState;
  importData: (data: AppState) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Auth / hydration
  userId: string | null;
  _hasHydrated: boolean;
  hydrate: (userId: string, data: AppState) => void;
  reset: () => void;

  /** Retries any log writes that were queued while offline. */
  flushPendingLogs: () => void;
}

type Store = AppState & AppActions;

function ensureLog(logs: Record<string, DailyLog>, dateKey: string): DailyLog {
  return (
    logs[dateKey] ?? {
      date: dateKey,
      completedStepIds: [],
      skippedStepIds: [],
      shaveDayEnabled: false,
    }
  );
}

const emptyState: AppState = {
  version: 1,
  settings: {
    name: "Jij",
    theme: "system",
    morningTime: "07:00",
    eveningTime: "22:00",
    defaultLowStockThresholdDays: 21,
    remindersEnabled: false,
    onboardedAt: new Date().toISOString(),
  },
  products: [],
  logs: {},
  shoppingList: [],
  checkIns: [],
  photos: [],
};

export const useStore = create<Store>()((set, get) => ({
  ...emptyState,
  userId: null,
  _hasHydrated: false,

  hydrate: (userId, data) => set({ ...data, userId, _hasHydrated: true }),
  reset: () => set({ ...emptyState, userId: null, _hasHydrated: false }),

  flushPendingLogs: () => {
    const userId = get().userId;
    if (!userId) return;
    getPendingLogs().forEach((log) => syncLog(userId, log));
  },

  completeStep: (stepId, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    if (log.completedStepIds.includes(stepId)) return;
    const updated: DailyLog = {
      ...log,
      completedStepIds: [...log.completedStepIds, stepId],
      skippedStepIds: log.skippedStepIds.filter((id) => id !== stepId),
    };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  uncompleteStep: (stepId, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    const updated: DailyLog = { ...log, completedStepIds: log.completedStepIds.filter((id) => id !== stepId) };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  toggleStep: (stepId, dateKey = todayKey()) => {
    const log = get().logs[dateKey];
    if (log?.completedStepIds.includes(stepId)) {
      get().uncompleteStep(stepId, dateKey);
    } else {
      get().completeStep(stepId, dateKey);
    }
  },

  skipStepToday: (stepId, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    if (log.skippedStepIds.includes(stepId)) return;
    const updated: DailyLog = { ...log, skippedStepIds: [...log.skippedStepIds, stepId] };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  unskipStepToday: (stepId, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    const updated: DailyLog = { ...log, skippedStepIds: log.skippedStepIds.filter((id) => id !== stepId) };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  setShaveDayEnabled: (enabled, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    const updated: DailyLog = { ...log, shaveDayEnabled: enabled };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  getShaveDayEnabled: (dateKey = todayKey()) => get().logs[dateKey]?.shaveDayEnabled ?? false,

  setDayPaused: (paused, dateKey = todayKey()) => {
    const log = ensureLog(get().logs, dateKey);
    const updated: DailyLog = { ...log, dayPaused: paused };
    set((state) => ({ logs: { ...state.logs, [dateKey]: updated } }));
    const userId = get().userId;
    if (userId) syncLog(userId, updated);
  },

  addProduct: (input) => {
    const product: Product = {
      ...input,
      id: crypto.randomUUID(),
      order: get().products.length + 1,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ products: [...state.products, product] }));
    const userId = get().userId;
    if (userId) insertProductRow(getSupabase(), userId, product).then(({ error }) => error && reportError("Product"));
    return product;
  },

  updateProduct: (id, patch) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    if (get().userId) updateProductRow(getSupabase(), id, patch).then(({ error }) => error && reportError("Product"));
  },

  removeProduct: (id) => {
    const product = get().products.find((p) => p.id === id);
    if (product?.image?.startsWith("http")) deleteUserImage(getSupabase(), product.image).catch(() => {});
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    if (get().userId) deleteProductRow(getSupabase(), id).then(({ error }) => error && reportError("Product verwijderen"));
  },

  reorderProducts: (orderedIds) => {
    set((state) => ({
      products: state.products.map((p) => {
        const idx = orderedIds.indexOf(p.id);
        return idx === -1 ? p : { ...p, order: idx + 1 };
      }),
    }));
    if (get().userId) {
      orderedIds.forEach((id, idx) => {
        updateProductRow(getSupabase(), id, { order: idx + 1 }).then(({ error }) => error && reportError("Volgorde"));
      });
    }
  },

  setProductPaused: (id, paused) => {
    set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, paused } : p)) }));
    if (get().userId) updateProductRow(getSupabase(), id, { paused }).then(({ error }) => error && reportError("Product"));
  },

  addShoppingItem: (name, linkedProductId) => {
    const item = { id: crypto.randomUUID(), name, done: false, linkedProductId, createdAt: new Date().toISOString() };
    set((state) => ({ shoppingList: [...state.shoppingList, item] }));
    const userId = get().userId;
    if (userId) insertShoppingItemRow(getSupabase(), userId, item).then(({ error }) => error && reportError("Boodschappenitem"));
  },

  toggleShoppingItem: (id) => {
    const item = get().shoppingList.find((i) => i.id === id);
    if (!item) return;
    const done = !item.done;
    set((state) => ({
      shoppingList: state.shoppingList.map((i) => (i.id === id ? { ...i, done } : i)),
    }));
    if (get().userId) updateShoppingItemRow(getSupabase(), id, { done }).then(({ error }) => error && reportError("Boodschappenitem"));
  },

  removeShoppingItem: (id) => {
    set((state) => ({ shoppingList: state.shoppingList.filter((item) => item.id !== id) }));
    if (get().userId) deleteShoppingItemRow(getSupabase(), id).then(({ error }) => error && reportError("Verwijderen"));
  },

  addCheckIn: (checkIn) => {
    const entry = { ...checkIn, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    set((state) => ({ checkIns: [...state.checkIns, entry] }));
    const userId = get().userId;
    if (userId) insertCheckInRow(getSupabase(), userId, entry).then(({ error }) => error && reportError("Logboek"));
  },

  updateCheckIn: (id, patch) => {
    set((state) => ({ checkIns: state.checkIns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    if (get().userId) updateCheckInRow(getSupabase(), id, patch).then(({ error }) => error && reportError("Logboek"));
  },

  addPhoto: (photo) => {
    const entry = { ...photo, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    set((state) => ({ photos: [...state.photos, entry] }));
    const userId = get().userId;
    if (userId) insertPhotoRow(getSupabase(), userId, entry).then(({ error }) => error && reportError("Foto"));
  },

  removePhoto: (id) => {
    const photo = get().photos.find((p) => p.id === id);
    if (photo) deleteUserImage(getSupabase(), photo.imageKey).catch(() => {});
    set((state) => ({ photos: state.photos.filter((p) => p.id !== id) }));
    if (get().userId) deletePhotoRow(getSupabase(), id).then(({ error }) => error && reportError("Foto verwijderen"));
  },

  updateSettings: (patch) => {
    set((state) => ({ settings: { ...state.settings, ...patch } }));
    const userId = get().userId;
    if (userId) updateProfileRow(getSupabase(), userId, patch).then(({ error }) => error && reportError("Instellingen"));
  },

  exportData: () => {
    const { settings, products, logs, shoppingList, checkIns, photos } = get();
    return { version: 1, settings, products, logs, shoppingList, checkIns, photos };
  },

  importData: async (data) => {
    set({ ...data });
    const userId = get().userId;
    if (userId) await replaceAllData(getSupabase(), userId, data);
  },

  resetAllData: async () => {
    const userId = get().userId;
    if (userId) {
      await clearAllUserData(getSupabase(), userId);
      const fresh = await fetchAllData(getSupabase(), userId);
      set({ ...fresh, userId });
    } else {
      set({ ...emptyState });
    }
  },
}));

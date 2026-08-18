import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppState, DailyLog, Product, ProgressPhoto, Settings, ShoppingItem, WeeklyCheckIn } from "@/lib/types";
import { SEED_PRODUCTS } from "@/lib/data/products";
import { SEED_SHOPPING_LIST } from "@/lib/data/seed";
import {
  checkInFromRow,
  logFromRow,
  logToRow,
  photoFromRow,
  productFromRow,
  productToRow,
  settingsFromRow,
  settingsToRow,
  shoppingItemFromRow,
} from "@/lib/supabase/mappers";

const STORE_VERSION = 1;

export async function fetchAllData(supabase: SupabaseClient, userId: string): Promise<AppState> {
  const [profileRes, productsRes, logsRes, shoppingRes, checkInsRes, photosRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("products").select("*").eq("user_id", userId).order("sort_order"),
    supabase.from("daily_logs").select("*").eq("user_id", userId),
    supabase.from("shopping_items").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("check_ins").select("*").eq("user_id", userId).order("week_start"),
    supabase.from("progress_photos").select("*").eq("user_id", userId).order("photo_date"),
  ]);

  let products = (productsRes.data ?? []).map(productFromRow);
  let shoppingList: ShoppingItem[] = (shoppingRes.data ?? []).map(shoppingItemFromRow);

  // First-ever login for this account: seed the starter catalogue once.
  // This used to key off "products.length === 0", which is not safe against
  // duplicate/overlapping calls (multiple auth-state events can fire for one
  // sign-in) — two callers can both observe zero products and both seed,
  // doubling every new account. profiles.has_seeded is claimed atomically:
  // the UPDATE only affects a row (and only one caller's `claimed` comes back
  // non-empty) when has_seeded is still false, so no matter how many times
  // this function gets called concurrently, seeding can only ever win once.
  if (profileRes.data && !profileRes.data.has_seeded) {
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ has_seeded: true })
      .eq("id", userId)
      .eq("has_seeded", false)
      .select("id");

    if (claimed && claimed.length > 0) {
      const { error } = await seedProductsForUser(supabase, userId);
      if (error) console.error("Failed to seed starter products:", error.message);

      const { error: shopError } = await supabase.from("shopping_items").insert(
        SEED_SHOPPING_LIST.map((item) => ({
          id: item.id,
          user_id: userId,
          name: item.name,
          done: item.done,
          created_at: item.createdAt,
        }))
      );
      if (shopError) console.error("Failed to seed starter shopping list:", shopError.message);

      const [reseededProducts, reseededShopping] = await Promise.all([
        supabase.from("products").select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("shopping_items").select("*").eq("user_id", userId).order("created_at"),
      ]);
      products = (reseededProducts.data ?? []).map(productFromRow);
      shoppingList = (reseededShopping.data ?? []).map(shoppingItemFromRow);
    }
  }

  const logs: Record<string, DailyLog> = {};
  (logsRes.data ?? []).forEach((row) => {
    const log = logFromRow(row);
    logs[log.date] = log;
  });

  const settings: Settings = settingsFromRow(profileRes.data ?? null);
  const checkIns: WeeklyCheckIn[] = (checkInsRes.data ?? []).map(checkInFromRow);
  const photos: ProgressPhoto[] = (photosRes.data ?? []).map(photoFromRow);

  if (settings.partnerId) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", settings.partnerId)
      .maybeSingle();
    settings.partnerName = partnerProfile?.name ?? null;
  }

  return { version: STORE_VERSION, settings, products, logs, shoppingList, checkIns, photos };
}

async function seedProductsForUser(supabase: SupabaseClient, userId: string) {
  // products.id is a global primary key (not scoped per user), so the seed
  // catalogue's friendly slugs ("boost-shampoo", ...) can only ever be used
  // once across ALL accounts — give every seeded row a fresh unique id.
  const rows = SEED_PRODUCTS.map((p) => productToRow({ ...p, id: crypto.randomUUID() }, userId));
  return supabase.from("products").insert(rows);
}

// ---- Products ----
export async function insertProductRow(supabase: SupabaseClient, userId: string, product: Product) {
  return supabase.from("products").insert(productToRow(product, userId));
}
export async function updateProductRow(supabase: SupabaseClient, id: string, patch: Partial<Product>) {
  return supabase.from("products").update(productToRow(patch)).eq("id", id);
}
export async function deleteProductRow(supabase: SupabaseClient, id: string) {
  return supabase.from("products").delete().eq("id", id);
}

// ---- Logs ----
export async function upsertLogRow(supabase: SupabaseClient, userId: string, log: DailyLog) {
  return supabase.from("daily_logs").upsert(logToRow(log, userId), { onConflict: "user_id,log_date" });
}

// ---- Shopping list ----
export async function insertShoppingItemRow(supabase: SupabaseClient, userId: string, item: ShoppingItem) {
  return supabase.from("shopping_items").insert({
    id: item.id,
    user_id: userId,
    name: item.name,
    done: item.done,
    linked_product_id: item.linkedProductId ?? null,
    created_at: item.createdAt,
  });
}
export async function updateShoppingItemRow(supabase: SupabaseClient, id: string, patch: Partial<ShoppingItem>) {
  const row: Record<string, unknown> = {};
  if (patch.done !== undefined) row.done = patch.done;
  if (patch.name !== undefined) row.name = patch.name;
  return supabase.from("shopping_items").update(row).eq("id", id);
}
export async function deleteShoppingItemRow(supabase: SupabaseClient, id: string) {
  return supabase.from("shopping_items").delete().eq("id", id);
}

// ---- Check-ins ----
export async function insertCheckInRow(supabase: SupabaseClient, userId: string, checkIn: WeeklyCheckIn) {
  return supabase.from("check_ins").insert({
    id: checkIn.id,
    user_id: userId,
    week_start: checkIn.weekStart,
    hair: checkIn.hair,
    skin: checkIn.skin,
    eyes: checkIn.eyes,
    note: checkIn.note,
    created_at: checkIn.createdAt,
  });
}
export async function updateCheckInRow(supabase: SupabaseClient, id: string, patch: Partial<WeeklyCheckIn>) {
  const row: Record<string, unknown> = {};
  if (patch.hair !== undefined) row.hair = patch.hair;
  if (patch.skin !== undefined) row.skin = patch.skin;
  if (patch.eyes !== undefined) row.eyes = patch.eyes;
  if (patch.note !== undefined) row.note = patch.note;
  return supabase.from("check_ins").update(row).eq("id", id);
}

// ---- Photos ----
export async function insertPhotoRow(supabase: SupabaseClient, userId: string, photo: ProgressPhoto) {
  return supabase.from("progress_photos").insert({
    id: photo.id,
    user_id: userId,
    photo_date: photo.date,
    category: photo.category,
    storage_path: photo.imageKey,
    note: photo.note ?? null,
    created_at: photo.createdAt,
  });
}
export async function deletePhotoRow(supabase: SupabaseClient, id: string) {
  return supabase.from("progress_photos").delete().eq("id", id);
}

// ---- Settings / profile ----
export async function updateProfileRow(supabase: SupabaseClient, userId: string, patch: Partial<Settings>) {
  return supabase.from("profiles").update(settingsToRow(patch)).eq("id", userId);
}

// ---- Bulk operations (import / reset) ----
const USER_TABLES = ["products", "daily_logs", "shopping_items", "check_ins", "progress_photos"] as const;

async function deleteAllRows(supabase: SupabaseClient, userId: string) {
  await Promise.all(USER_TABLES.map((table) => supabase.from(table).delete().eq("user_id", userId)));
}

/** Overwrites all of this user's Supabase data with an imported backup. */
export async function replaceAllData(supabase: SupabaseClient, userId: string, data: AppState) {
  await deleteAllRows(supabase, userId);

  await Promise.all([
    data.products.length > 0
      ? supabase.from("products").insert(data.products.map((p) => productToRow(p, userId)))
      : Promise.resolve(),
    Object.values(data.logs).length > 0
      ? supabase.from("daily_logs").insert(Object.values(data.logs).map((l) => logToRow(l, userId)))
      : Promise.resolve(),
    data.shoppingList.length > 0
      ? supabase.from("shopping_items").insert(
          data.shoppingList.map((item) => ({
            id: item.id,
            user_id: userId,
            name: item.name,
            done: item.done,
            linked_product_id: item.linkedProductId ?? null,
            created_at: item.createdAt,
          }))
        )
      : Promise.resolve(),
    data.checkIns.length > 0
      ? supabase.from("check_ins").insert(
          data.checkIns.map((c) => ({
            id: c.id,
            user_id: userId,
            week_start: c.weekStart,
            hair: c.hair,
            skin: c.skin,
            eyes: c.eyes,
            note: c.note,
            created_at: c.createdAt,
          }))
        )
      : Promise.resolve(),
    data.photos.length > 0
      ? supabase.from("progress_photos").insert(
          data.photos.map((p) => ({
            id: p.id,
            user_id: userId,
            photo_date: p.date,
            category: p.category,
            storage_path: p.imageKey,
            note: p.note ?? null,
            created_at: p.createdAt,
          }))
        )
      : Promise.resolve(),
  ]);

  await supabase.from("profiles").update(settingsToRow(data.settings)).eq("id", userId);
}

/** Wipes all of this user's Supabase data and reseeds the starter product catalogue. */
export async function clearAllUserData(supabase: SupabaseClient, userId: string) {
  await deleteAllRows(supabase, userId);

  const { data: files } = await supabase.storage.from("routine-photos").list(userId);
  if (files && files.length > 0) {
    await supabase.storage.from("routine-photos").remove(files.map((f) => `${userId}/${f.name}`));
  }

  await supabase
    .from("profiles")
    .update(settingsToRow({ name: "Jij", theme: "system", morningTime: "07:00", eveningTime: "22:00", defaultLowStockThresholdDays: 21, remindersEnabled: false }))
    .eq("id", userId);

  await seedProductsForUser(supabase, userId);
}

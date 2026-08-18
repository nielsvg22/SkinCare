import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyLog, Product, ShoppingItem } from "@/lib/types";
import { productFromRow, logFromRow, shoppingItemFromRow } from "@/lib/supabase/mappers";

/** Reads a linked partner's data — only returns rows the partner-read RLS policies actually allow. */
export async function fetchPartnerProducts(supabase: SupabaseClient, partnerId: string): Promise<Product[]> {
  const { data } = await supabase.from("products").select("*").eq("user_id", partnerId);
  return (data ?? []).map(productFromRow);
}

export async function fetchPartnerLogs(
  supabase: SupabaseClient,
  partnerId: string
): Promise<Record<string, DailyLog>> {
  const { data } = await supabase.from("daily_logs").select("*").eq("user_id", partnerId);
  const logs: Record<string, DailyLog> = {};
  (data ?? []).forEach((row) => {
    const log = logFromRow(row);
    logs[log.date] = log;
  });
  return logs;
}

/** Empty when the partner hasn't turned sharing on — the RLS policy simply returns no rows. */
export async function fetchPartnerShoppingItems(
  supabase: SupabaseClient,
  partnerId: string
): Promise<ShoppingItem[]> {
  const { data } = await supabase.from("shopping_items").select("*").eq("user_id", partnerId).order("created_at");
  return (data ?? []).map(shoppingItemFromRow);
}

export async function togglePartnerShoppingItem(supabase: SupabaseClient, id: string, done: boolean) {
  return supabase.from("shopping_items").update({ done }).eq("id", id);
}

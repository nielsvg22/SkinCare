import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  checkInFromRow,
  logFromRow,
  photoFromRow,
  productFromRow,
  settingsFromRow,
  shoppingItemFromRow,
} from "@/lib/supabase/mappers";

const MAX_BACKUPS_PER_USER = 8;

// Triggered weekly by Vercel Cron. Snapshots every account's full data as a
// JSON file in the private `backups` bucket — a safety net independent of
// the manual export in Instellingen, and independent of Supabase itself
// having a bad day. Keeps the most recent MAX_BACKUPS_PER_USER per user.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server-configuratie ontbreekt" }, { status: 500 });
  }

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id");
  if (profilesError || !profiles) {
    return NextResponse.json({ error: profilesError?.message ?? "Kon profielen niet ophalen" }, { status: 500 });
  }

  let backedUp = 0;

  await Promise.all(
    profiles.map(async (profile) => {
      const userId = profile.id as string;

      const [profileRes, productsRes, logsRes, shoppingRes, checkInsRes, photosRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("products").select("*").eq("user_id", userId),
        supabase.from("daily_logs").select("*").eq("user_id", userId),
        supabase.from("shopping_items").select("*").eq("user_id", userId),
        supabase.from("check_ins").select("*").eq("user_id", userId),
        supabase.from("progress_photos").select("*").eq("user_id", userId),
      ]);

      const logs: Record<string, ReturnType<typeof logFromRow>> = {};
      (logsRes.data ?? []).forEach((row) => {
        const log = logFromRow(row);
        logs[log.date] = log;
      });

      const snapshot = {
        version: 1,
        createdAt: new Date().toISOString(),
        settings: settingsFromRow(profileRes.data ?? null),
        products: (productsRes.data ?? []).map(productFromRow),
        logs,
        shoppingList: (shoppingRes.data ?? []).map(shoppingItemFromRow),
        checkIns: (checkInsRes.data ?? []).map(checkInFromRow),
        photos: (photosRes.data ?? []).map(photoFromRow),
      };

      const fileName = `${userId}/${new Date().toISOString().slice(0, 10)}.json`;
      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(fileName, JSON.stringify(snapshot, null, 2), {
          contentType: "application/json",
          upsert: true,
        });

      if (!uploadError) backedUp += 1;

      const { data: existing } = await supabase.storage.from("backups").list(userId, {
        sortBy: { column: "name", order: "desc" },
      });
      if (existing && existing.length > MAX_BACKUPS_PER_USER) {
        const toDelete = existing.slice(MAX_BACKUPS_PER_USER).map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("backups").remove(toDelete);
      }
    })
  );

  return NextResponse.json({ backedUp, totalUsers: profiles.length });
}

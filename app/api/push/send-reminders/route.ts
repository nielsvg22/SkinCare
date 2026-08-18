import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { buildRoutineForDay, requiredStepIds } from "@/lib/utils/routine";
import { getWeekStartKey, todayKey } from "@/lib/utils/date";
import { isLowStock } from "@/lib/utils/consumption";
import { productFromRow, logFromRow } from "@/lib/supabase/mappers";
import type { Product } from "@/lib/types";

// Triggered by Vercel Cron once per UTC hour (see vercel.json — 24 entries,
// one per hour). Firing every hour — rather than trying to predict each
// user's exact local time with a couple of fixed UTC slots — is what makes
// this correctly support custom morning/evening times AND DST, without
// needing separate handling for either.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server-configuratie ontbreekt" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:no-reply@example.com",
    vapidPublicKey,
    vapidPrivateKey
  );

  const now = new Date();
  const amsterdamParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const currentHour = Number(amsterdamParts.find((p) => p.type === "hour")?.value);
  const currentWeekday = amsterdamParts.find((p) => p.type === "weekday")?.value; // "Sun", "Mon", ...
  const isSunday = currentWeekday === "Sun";

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const [{ data: subscriptions }, { data: profiles }] = await Promise.all([
    supabase.from("push_subscriptions").select("*"),
    supabase
      .from("profiles")
      .select("id, morning_time, evening_time, reminders_enabled, default_low_stock_threshold_days"),
  ]);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no-subscriptions" });
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const relevantUserIds = [...new Set(subscriptions.map((s) => s.user_id))];

  const [productsRes, logsRes, checkInsRes] = await Promise.all([
    supabase.from("products").select("*").in("user_id", relevantUserIds),
    supabase.from("daily_logs").select("*").in("user_id", relevantUserIds).eq("log_date", todayKey()),
    supabase.from("check_ins").select("user_id, week_start").in("user_id", relevantUserIds),
  ]);

  const productsByUser = new Map<string, Product[]>();
  (productsRes.data ?? []).forEach((row) => {
    const list = productsByUser.get(row.user_id) ?? [];
    list.push(productFromRow(row));
    productsByUser.set(row.user_id, list);
  });

  const todayLogByUser = new Map((logsRes.data ?? []).map((row) => [row.user_id, logFromRow(row)]));
  const thisWeekStart = getWeekStartKey(now);
  const checkInWeeksByUser = new Map<string, Set<string>>();
  (checkInsRes.data ?? []).forEach((row) => {
    const set = checkInWeeksByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.week_start);
    checkInWeeksByUser.set(row.user_id, set);
  });

  let sent = 0;
  const stale: string[] = [];

  async function sendTo(sub: { endpoint: string; p256dh: string; auth: string }, payload: object) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) stale.push(sub.endpoint);
    }
  }

  await Promise.all(
    subscriptions.map(async (sub) => {
      const profile = profileById.get(sub.user_id);
      if (!profile || !profile.reminders_enabled) return;

      const products = productsByUser.get(sub.user_id) ?? [];
      const log = todayLogByUser.get(sub.user_id);
      const day = buildRoutineForDay(products, now, log, log?.shaveDayEnabled ?? false);

      const morningHour = Number(String(profile.morning_time).split(":")[0]);
      const eveningHour = Number(String(profile.evening_time).split(":")[0]);

      if (morningHour === currentHour) {
        const morningRequired = requiredStepIds({ morning: day.morning, evening: [], custom: {} });
        const morningDone =
          morningRequired.length > 0 && morningRequired.every((id) => log?.completedStepIds.includes(id));
        if (!morningDone) {
          const conditionerToday = day.morning.some(
            (s) => s.scheduledToday && s.label.toLowerCase().includes("conditioner")
          );
          await sendTo(sub, {
            title: "Tijd voor je ochtendroutine",
            body: conditionerToday ? "Vandaag is conditioner-dag." : "Goedemorgen! Klaar voor een frisse start?",
            url: "/",
          });
        }

        const lowStockProducts = products.filter(
          (p) => !p.paused && isLowStock(p, profile.default_low_stock_threshold_days)
        );
        if (lowStockProducts.length > 0) {
          const names = lowStockProducts.map((p) => p.name).join(", ");
          await sendTo(sub, {
            title: "Voorraad bijna op",
            body: lowStockProducts.length === 1 ? `${names} is bijna op.` : `Bijna op: ${names}.`,
            url: "/products",
          });
        }
      }

      if (eveningHour === currentHour) {
        const eveningRequired = requiredStepIds({ morning: [], evening: day.evening, custom: {} });
        const eveningDone =
          eveningRequired.length > 0 && eveningRequired.every((id) => log?.completedStepIds.includes(id));
        if (!eveningDone && eveningRequired.length > 0) {
          await sendTo(sub, {
            title: "Even je avondroutine",
            body: "Vergeet je gezicht niet te reinigen.",
            url: "/",
          });
        }

        if (isSunday && !(checkInWeeksByUser.get(sub.user_id)?.has(thisWeekStart) ?? false)) {
          await sendTo(sub, {
            title: "Hoe ging je week?",
            body: "Vul je wekelijkse logboek in — haar, huid en ogen.",
            url: "/progress",
          });
        }
      }
    })
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ sent, hour: currentHour, cleaned: stale.length });
}

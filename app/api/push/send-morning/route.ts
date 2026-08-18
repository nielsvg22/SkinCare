import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Triggered by Vercel Cron (see vercel.json — two entries, one per DST state,
// since Hobby-tier cron schedules run in fixed UTC and can't otherwise track
// Europe/Amsterdam's seasonal offset). Each invocation only actually sends
// when it lands in the *correct* local hour; the other is a no-op.
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

  const currentHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  const supabase = createServiceClient(supabaseUrl, serviceRoleKey);

  const [{ data: subscriptions }, { data: profiles }] = await Promise.all([
    supabase.from("push_subscriptions").select("*"),
    supabase.from("profiles").select("id, morning_time, reminders_enabled"),
  ]);

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no-subscriptions" });
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  const stale: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      const profile = profileById.get(sub.user_id);
      if (!profile || !profile.reminders_enabled) return;

      const targetHour = Number(String(profile.morning_time).split(":")[0]);
      if (targetHour !== currentHour) return;

      const payload = JSON.stringify({
        title: "Tijd voor je ochtendroutine",
        body: "Goedemorgen! Klaar voor een frisse start?",
        url: "/",
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          stale.push(sub.endpoint);
        }
      }
    })
  );

  if (stale.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ sent, hour: currentHour, cleaned: stale.length });
}

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Note: excluding by file extension (not a "products/" path prefix) so the
  // real /products app route still goes through the auth check — only the
  // static assets under /public/products/*.png are skipped here.
  // /api/ is excluded entirely: those routes authorize themselves (Supabase
  // session check inside subscribe/unsubscribe, CRON_SECRET inside
  // send-reminders) — Vercel Cron's request has no Supabase session cookie
  // at all, so leaving /api/ behind this gate silently redirected every
  // cron-triggered call to /login before the handler ever ran.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/.*|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

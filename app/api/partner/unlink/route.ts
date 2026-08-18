import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server-configuratie ontbreekt" }, { status: 500 });
  }
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await admin.from("profiles").select("partner_id").eq("id", user.id).maybeSingle();
  const partnerId = profile?.partner_id;

  await admin.from("profiles").update({ partner_id: null, share_shopping_list: false }).eq("id", user.id);
  if (partnerId) {
    await admin.from("profiles").update({ partner_id: null }).eq("id", partnerId);
  }

  return NextResponse.json({ ok: true });
}

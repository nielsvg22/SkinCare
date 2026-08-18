import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const body = await request.json();
  const code = String(body?.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Vul een code in" }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server-configuratie ontbreekt" }, { status: 500 });
  }
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);

  const { data: invite, error: inviteError } = await admin
    .from("partner_invites")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Ongeldige code" }, { status: 404 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    await admin.from("partner_invites").delete().eq("code", code);
    return NextResponse.json({ error: "Deze code is verlopen" }, { status: 410 });
  }
  if (invite.created_by === user.id) {
    return NextResponse.json({ error: "Je kunt niet je eigen code gebruiken" }, { status: 400 });
  }

  const { error: linkError1 } = await admin
    .from("profiles")
    .update({ partner_id: invite.created_by })
    .eq("id", user.id);
  const { error: linkError2 } = await admin
    .from("profiles")
    .update({ partner_id: user.id })
    .eq("id", invite.created_by);

  if (linkError1 || linkError2) {
    return NextResponse.json({ error: "Koppelen is mislukt" }, { status: 500 });
  }

  await admin.from("partner_invites").delete().eq("code", code);

  const { data: partnerProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", invite.created_by)
    .maybeSingle();

  return NextResponse.json({ partnerName: partnerProfile?.name ?? "je partner" });
}

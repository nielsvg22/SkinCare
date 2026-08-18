"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthActionState {
  error?: string;
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vul je e-mailadres en wachtwoord in" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Inloggen mislukt — controleer je e-mailadres en wachtwoord" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !email || !password) {
    return { error: "Vul alle velden in" };
  }
  if (password.length < 8) {
    return { error: "Wachtwoord moet minstens 8 tekens zijn" };
  }
  if (password !== passwordConfirm) {
    return { error: "Wachtwoorden komen niet overeen" };
  }

  // Created via the admin API (server-only, service_role key) and immediately
  // confirmed — this is a 2-person personal app, not a public product that
  // needs email-based identity verification, so we skip Supabase's mailer
  // entirely rather than depend on its shared/rate-limited SMTP.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError) {
    if (createError.code === "email_exists" || createError.message.toLowerCase().includes("already")) {
      return { error: "Er bestaat al een account met dit e-mailadres" };
    }
    return { error: "Aanmaken van account is mislukt — probeer het opnieuw" };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    return { error: "Account is aangemaakt, maar inloggen is mislukt — probeer opnieuw in te loggen" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

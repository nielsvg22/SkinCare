"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { signUp, type AuthActionState } from "../login/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-radius-lg bg-navy-500 text-primary-foreground">
          <Sparkles className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Account aanmaken</h1>
        <p className="text-sm text-foreground-muted">Jouw eigen verzorgingsroutine, overal beschikbaar</p>
      </div>

      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Naam</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Wachtwoord</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="passwordConfirm">Wachtwoord bevestigen</Label>
          <Input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" size="lg" disabled={pending} className="mt-2">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Account aanmaken
        </Button>
      </form>

      <p className="mt-6 text-sm text-foreground-muted">
        Al een account?{" "}
        <Link href="/login" className="font-medium text-accent underline-offset-2 hover:underline">
          Inloggen
        </Link>
      </p>
    </div>
  );
}

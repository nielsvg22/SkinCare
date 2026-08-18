"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  const reset = useStore((s) => s.reset);

  return (
    <Button
      variant="outline"
      className="justify-start"
      onClick={() => {
        reset();
        signOut();
      }}
    >
      <LogOut className="size-4" />
      Uitloggen
    </Button>
  );
}

"use client";

import { Scissors } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ShaveToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ShaveToggle({ checked, onCheckedChange }: ShaveToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-radius-lg border p-4 transition-colors",
        checked ? "border-blue-200 bg-blue-50" : "border-border bg-surface"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            checked ? "bg-blue-400 text-white" : "bg-muted text-foreground-muted"
          )}
        >
          <Scissors className="size-[18px]" strokeWidth={1.8} />
        </div>
        <div>
          <Label htmlFor="shave-toggle" className="text-[15px]">
            Vandaag scheren
          </Label>
          <p className="text-xs text-foreground-muted">Voegt scheren en aftershave toe aan je routine</p>
        </div>
      </div>
      <Switch id="shave-toggle" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

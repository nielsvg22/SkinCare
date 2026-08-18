"use client";

import { Palmtree } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PauseToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function PauseToggle({ checked, onCheckedChange }: PauseToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-radius-lg border p-4 transition-colors",
        checked ? "border-beige-400/60 bg-beige-50" : "border-border bg-surface"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            checked ? "bg-beige-400 text-white" : "bg-muted text-foreground-muted"
          )}
        >
          <Palmtree className="size-[18px]" strokeWidth={1.8} />
        </div>
        <div>
          <Label htmlFor="pause-toggle" className="text-[15px]">
            Vakantie/pauzestand
          </Label>
          <p className="text-xs text-foreground-muted">Telt niet mee voor je streak vandaag</p>
        </div>
      </div>
      <Switch id="pause-toggle" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "blue" | "green" | "orange" | "neutral";
  className?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatTileProps["accent"]>, string> = {
  blue: "text-blue-600 bg-blue-50",
  green: "text-green-600 bg-green-50",
  orange: "text-orange-600 bg-orange-400/12",
  neutral: "text-foreground-muted bg-muted",
};

export function StatTile({ label, value, icon, accent = "neutral", className }: StatTileProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-center gap-3 p-4">
        {icon && (
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-radius", ACCENT_CLASSES[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight text-foreground tabular-nums">{value}</p>
          <p className="truncate text-xs text-foreground-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayStatus } from "@/lib/utils/streak";

interface WeekDayCircleProps {
  label: string;
  dayNumber: number;
  status: DayStatus;
  isToday: boolean;
}

export function WeekDayCircle({ label, dayNumber, status, isToday }: WeekDayCircleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          isToday ? "text-accent" : "text-foreground-subtle"
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
          status === "completed" && "border-success bg-success text-success-foreground",
          status === "partial" && "border-orange-400 bg-orange-400/12 text-orange-600",
          status === "missed" && "border-border-strong bg-surface-2 text-foreground-subtle",
          status === "future" && "border-dashed border-border text-foreground-subtle",
          status === "no-routine" && "border-border text-foreground-subtle",
          isToday && status !== "completed" && "ring-2 ring-accent/40"
        )}
      >
        {status === "completed" ? (
          <Check className="size-[18px]" strokeWidth={2.6} />
        ) : status === "future" || status === "no-routine" ? (
          <Minus className="size-4" />
        ) : (
          dayNumber
        )}
      </div>
    </div>
  );
}

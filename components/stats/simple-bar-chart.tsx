"use client";

import { cn } from "@/lib/utils";
import type { DailyCompletionPoint } from "@/lib/utils/streak";

interface SimpleBarChartProps {
  data: DailyCompletionPoint[];
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  return (
    <div className="flex items-end gap-[3px] rounded-radius-lg border border-border bg-surface p-4" style={{ height: 120 }}>
      {data.map((point) => (
        <div
          key={point.date}
          className="group relative flex-1"
          style={{ height: "100%" }}
        >
          <div className="flex h-full flex-col justify-end">
            <div
              className={cn(
                "w-full rounded-[2px] transition-all",
                point.percent === 100
                  ? "bg-success"
                  : point.percent > 0
                    ? "bg-orange-400"
                    : "bg-border"
              )}
              style={{ height: `${Math.max(4, point.percent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

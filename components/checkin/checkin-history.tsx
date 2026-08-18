"use client";

import { Star } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseDateKey, addDays, formatDisplayDate } from "@/lib/utils/date";

export function CheckInHistory() {
  const checkIns = useStore((s) => s.checkIns);
  const sorted = [...checkIns].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  if (sorted.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground-muted">Eerdere weken</h3>
      {sorted.map((entry) => {
        const weekStartDate = parseDateKey(entry.weekStart);
        const weekEndDate = addDays(weekStartDate, 6);
        return (
          <div key={entry.id} className="rounded-radius-lg border border-border bg-surface p-4">
            <p className="text-xs text-foreground-subtle">
              {formatDisplayDate(weekStartDate)} – {formatDisplayDate(weekEndDate)}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <MiniStars label="Haar" value={entry.hair} />
              <MiniStars label="Huid" value={entry.skin} />
              <MiniStars label="Ogen" value={entry.eyes} />
            </div>
            {entry.note && <p className="mt-2 text-sm text-foreground-muted">{entry.note}</p>}
          </div>
        );
      })}
    </div>
  );
}

function MiniStars({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-radius bg-surface-2 py-2">
      <span className="text-foreground-subtle">{label}</span>
      <div className="flex items-center gap-0.5">
        <Star className="size-3 fill-orange-500 text-orange-500" />
        <span className="font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

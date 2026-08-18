"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, ListChecks, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WeekDayCircle } from "@/components/week/week-day-circle";
import { StatTile } from "@/components/stats/stat-tile";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { addDays, addDaysToKey, getWeekStart, toDateKey, todayKey } from "@/lib/utils/date";
import { getDayStatus } from "@/lib/utils/streak";
import { WEEK_ORDER, WEEKDAY_LABELS_SHORT } from "@/lib/data/seed";
import { computeStreaks } from "@/lib/utils/streak";

export default function WeekPage() {
  const products = useStore((s) => s.products);
  const logs = useStore((s) => s.logs);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const viewedWeekStart = useMemo(() => addDays(getWeekStart(today), weekOffset * 7), [weekOffset]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekStartKey = toDateKey(viewedWeekStart);
  const todayKeyStr = todayKey();

  const days = WEEK_ORDER.map((weekday, idx) => {
    const dateKey = addDaysToKey(weekStartKey, idx);
    const date = new Date(viewedWeekStart);
    date.setDate(date.getDate() + idx);
    return {
      dateKey,
      weekday,
      dayNumber: date.getDate(),
      status: getDayStatus(products, logs, dateKey),
      isToday: dateKey === todayKeyStr,
    };
  });

  const completed = days.filter((d) => d.status === "completed").length;
  const trackable = days.filter((d) => d.status !== "future" && d.status !== "no-routine").length;
  const percent = trackable === 0 ? 0 : Math.round((completed / trackable) * 100);

  const streaks = useMemo(() => computeStreaks(products, logs, today), [products, logs]); // eslint-disable-line react-hooks/exhaustive-deps

  const rangeLabel = formatWeekRange(viewedWeekStart);

  return (
    <div className="flex flex-col pb-6">
      <PageHeader title="Week" subtitle="Zie in één oogopslag hoe consistent je bent geweest." />

      <section className="mt-2 px-5">
        <div className="flex items-center justify-between rounded-radius-lg border border-border bg-surface p-4 shadow-soft-sm">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setWeekOffset((v) => v - 1)}
            aria-label="Vorige week"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-accent underline-offset-2 hover:underline"
              >
                Naar deze week
              </button>
            )}
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setWeekOffset((v) => v + 1)}
            disabled={weekOffset >= 0}
            aria-label="Volgende week"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-5 flex items-start justify-between rounded-radius-lg border border-border bg-surface p-4 shadow-soft-sm">
          {days.map((d) => (
            <WeekDayCircle
              key={d.dateKey}
              label={WEEKDAY_LABELS_SHORT[d.weekday]}
              dayNumber={d.dayNumber}
              status={d.status}
              isToday={d.isToday}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 px-5">
        <StatTile
          label="Voltooid deze week"
          value={`${completed}/${trackable || completed}`}
          icon={<ListChecks className="size-5" />}
          accent="blue"
        />
        <StatTile
          label="Percentage"
          value={`${percent}%`}
          icon={<Trophy className="size-5" />}
          accent="green"
        />
        <StatTile
          label="Huidige streak"
          value={`${streaks.current} ${streaks.current === 1 ? "dag" : "dagen"}`}
          icon={<Flame className="size-5" />}
          accent="orange"
        />
        <StatTile
          label="Langste streak"
          value={`${streaks.longest} ${streaks.longest === 1 ? "dag" : "dagen"}`}
          icon={<Trophy className="size-5" />}
          accent="neutral"
        />
      </section>
    </div>
  );
}

function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === end.getMonth();
  const months = [
    "jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec",
  ];
  const startLabel = `${weekStart.getDate()} ${sameMonth ? "" : months[weekStart.getMonth()]}`.trim();
  const endLabel = `${end.getDate()} ${months[end.getMonth()]}`;
  return `${startLabel} – ${endLabel}`;
}

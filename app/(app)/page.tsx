"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressRing } from "@/components/routine/progress-ring";
import { RoutineStepCard } from "@/components/routine/routine-step-card";
import { PhaseIndicator } from "@/components/routine/phase-indicator";
import { ShaveToggle } from "@/components/routine/shave-toggle";
import { StreakFooter } from "@/components/routine/streak-footer";
import { CompletionBanner } from "@/components/routine/completion-banner";
import { Separator } from "@/components/ui/separator";
import { formatDisplayDate, getGreeting, todayKey } from "@/lib/utils/date";
import { buildRoutineForDay, periodProgress } from "@/lib/utils/routine";
import { computeStreaks } from "@/lib/utils/streak";
import type { RoutineStepView } from "@/lib/types";

const ENCOURAGEMENTS = [
  "Lekker bezig. Nog {n} en je ochtendroutine is compleet.",
  "Bijna daar — nog {n} te gaan.",
  "Goed op weg, nog {n} voor een frisse start.",
];

export default function TodayPage() {
  const products = useStore((s) => s.products);
  const logs = useStore((s) => s.logs);
  const settings = useStore((s) => s.settings);
  const completeStep = useStore((s) => s.completeStep);
  const uncompleteStep = useStore((s) => s.uncompleteStep);
  const skipStepToday = useStore((s) => s.skipStepToday);
  const unskipStepToday = useStore((s) => s.unskipStepToday);
  const setShaveDayEnabled = useStore((s) => s.setShaveDayEnabled);

  const [now] = useState(() => new Date());
  const dateKey = todayKey();
  const log = logs[dateKey];
  const shaveDayEnabled = log?.shaveDayEnabled ?? false;

  const routineDay = useMemo(
    () => buildRoutineForDay(products, now, log, shaveDayEnabled),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, log, shaveDayEnabled, dateKey]
  );

  const morningProgress = periodProgress(routineDay.morning);
  const eveningProgress = periodProgress(routineDay.evening);

  const streaks = useMemo(
    () => computeStreaks(products, logs, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, logs, dateKey]
  );

  const [showCelebration, setShowCelebration] = useState(false);
  const prevMorningPercent = useRef(morningProgress.percent);
  useEffect(() => {
    if (prevMorningPercent.current < 100 && morningProgress.percent === 100) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4500);
      return () => clearTimeout(timer);
    }
    prevMorningPercent.current = morningProgress.percent;
  }, [morningProgress.percent]);

  function handleToggle(step: RoutineStepView) {
    if (step.completed) {
      uncompleteStep(step.id);
      return;
    }
    completeStep(step.id);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
    toast(`${step.label} voltooid`, {
      icon: "✓",
      action: {
        label: "Ongedaan maken",
        onClick: () => uncompleteStep(step.id),
      },
    });
  }

  const remaining = morningProgress.total - morningProgress.completed;
  const encouragement =
    remaining > 0 && morningProgress.completed > 0
      ? ENCOURAGEMENTS[remaining % ENCOURAGEMENTS.length].replace(
          "{n}",
          remaining === 1 ? "één stap" : `${remaining} stappen`
        )
      : undefined;

  const doucheNames = routineDay.morning
    .filter((s) => s.product && (s.product.category === "Haar" || s.product.category === "Lichaam"))
    .map((s) => s.label);
  const naDoucheNames = routineDay.morning
    .filter((s) => s.product && (s.product.category === "Ogen" || s.product.category === "Gezicht"))
    .map((s) => s.label);

  return (
    <div className="flex flex-col pb-4">
      <PageHeader
        title={`${getGreeting(now)}, ${settings.name} 👋`}
        subtitle={formatDisplayDate(now)}
      />

      <div className="px-5">
        <ShaveToggle checked={shaveDayEnabled} onCheckedChange={(v) => setShaveDayEnabled(v)} />
      </div>

      <section className="mt-5 flex flex-col items-center gap-3 px-5">
        <ProgressRing
          percent={morningProgress.percent}
          label="Ochtendroutine"
          sublabel={`${morningProgress.completed} van ${morningProgress.total}`}
        />
        <p className="text-sm text-foreground-muted">
          {morningProgress.total} stappen voor een frisse start
        </p>
      </section>

      <CompletionBanner show={showCelebration} label="Ochtendroutine voltooid ✓" />

      <section className="mt-5 flex flex-col gap-3 px-5">
        <PhaseIndicator label="DOUCHE" steps={doucheNames} />
        <PhaseIndicator label="NA DOUCHEN" steps={naDoucheNames} />

        <div className="mt-1 flex flex-col gap-3">
          {routineDay.morning.map((step, idx) => (
            <RoutineStepCard
              key={step.id}
              step={step}
              index={idx + 1}
              onToggle={() => handleToggle(step)}
              onSkip={step.optionalToday ? () => skipStepToday(step.id) : undefined}
              onUnskip={() => unskipStepToday(step.id)}
            />
          ))}
        </div>
      </section>

      <Separator className="my-7" />

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Avondroutine</h2>
          <span className="text-sm text-foreground-muted">
            {eveningProgress.completed}/{eveningProgress.total || eveningProgress.completed}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {routineDay.evening.map((step, idx) => (
            <RoutineStepCard
              key={step.id}
              step={step}
              index={idx + 1}
              onToggle={() => handleToggle(step)}
              onSkip={step.optionalToday ? () => skipStepToday(step.id) : undefined}
              onUnskip={() => unskipStepToday(step.id)}
            />
          ))}
        </div>
      </section>

      <StreakFooter current={streaks.current} message={encouragement} />
    </div>
  );
}

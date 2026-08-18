"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, CalendarCheck, Minus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  adherenceStockEffects,
  checkInTrend,
  lifetimeCompletion,
  streakMomentum,
} from "@/lib/utils/insights";
import { formatMonthsRemaining } from "@/lib/utils/consumption";

export function StreakEffect() {
  const products = useStore((s) => s.products);
  const logs = useStore((s) => s.logs);
  const checkIns = useStore((s) => s.checkIns);

  const lifetime = useMemo(() => lifetimeCompletion(products, logs), [products, logs]);
  const momentum = useMemo(() => streakMomentum(products, logs), [products, logs]);
  const stockEffects = useMemo(() => adherenceStockEffects(products, logs), [products, logs]);
  const ratingTrend = useMemo(() => checkInTrend(checkIns), [checkIns]);

  const hasMomentumSignal = momentum.sampleWithMomentum > 0 && momentum.sampleFresh > 0;
  const notableStockEffects = stockEffects.filter((e) => e.adherencePercent < 95).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          Effect van je streak
        </CardTitle>
        <CardDescription>Wat je consistentie tot nu toe concreet oplevert.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-radius border border-border bg-surface-2 p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <CalendarCheck className="size-[18px]" />
          </div>
          <div>
            {lifetime.totalDays === 0 ? (
              <p className="text-sm text-foreground-muted">
                Nog geen historie — vink vandaag je eerste stappen af om dit te zien groeien.
              </p>
            ) : (
              <p className="text-sm text-foreground">
                Je hebt <span className="font-semibold">{lifetime.completedDays} van {lifetime.totalDays} dagen</span>{" "}
                je routine volledig gevolgd
                <span className="text-foreground-muted"> ({lifetime.percent}%)</span>.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-foreground">
            {hasMomentumSignal ? (
              <>
                Na een volledig voltooide dag haal je gemiddeld{" "}
                <span className="font-semibold text-green-600">{momentum.avgWithMomentum}%</span> van je routine —
                na een gemiste dag is dat{" "}
                <span className="font-semibold text-orange-600">{momentum.avgFresh}%</span>. Momentum werkt dus in je voordeel.
              </>
            ) : (
              "Nog te weinig historie om het effect van je streak op je consistentie te laten zien."
            )}
          </p>
        </div>

        {notableStockEffects.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Effect op je voorraad
            </p>
            {notableStockEffects.map((e) => (
              <div key={e.productId} className="flex items-center justify-between rounded-radius bg-surface-2 px-3 py-2 text-sm">
                <span className="text-foreground">{e.productName}</span>
                <span className="text-foreground-muted">
                  {e.adherencePercent}% van schema → {formatMonthsRemaining(e.actualMonths)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            Beoordelingen sinds je eerste log
          </p>
          {ratingTrend ? (
            <div className="grid grid-cols-3 gap-2">
              {ratingTrend.entries.map((entry) => (
                <div key={entry.label} className="flex flex-col items-center gap-1 rounded-radius bg-surface-2 py-2.5">
                  <span className="text-xs text-foreground-subtle">{entry.label}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {entry.last}/5
                  </span>
                  <TrendBadge deltaPercent={entry.deltaPercent} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground-subtle">
              Vul minimaal twee weken het logboek in om een trend te zien.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendBadge({ deltaPercent }: { deltaPercent: number | null }) {
  if (deltaPercent === null || deltaPercent === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-foreground-subtle">
        <Minus className="size-3" />
        gelijk
      </span>
    );
  }
  const positive = deltaPercent > 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", positive ? "text-green-600" : "text-orange-600")}>
      {positive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(deltaPercent)}%
    </span>
  );
}

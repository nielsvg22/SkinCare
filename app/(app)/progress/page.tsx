"use client";

import { useMemo, useState } from "react";
import { Flame, Trophy, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatTile } from "@/components/stats/stat-tile";
import { SimpleBarChart } from "@/components/stats/simple-bar-chart";
import { StreakEffect } from "@/components/stats/streak-effect";
import { CombinedStreak } from "@/components/stats/combined-streak";
import { ExpenseOverview } from "@/components/stats/expense-overview";
import { WrappedDialog } from "@/components/stats/wrapped-dialog";
import { CheckInForm } from "@/components/checkin/checkin-form";
import { CheckInHistory } from "@/components/checkin/checkin-history";
import { AddPhotoDialog } from "@/components/photos/add-photo-dialog";
import { PhotoTimeline } from "@/components/photos/photo-timeline";
import { ComparePhotosDialog } from "@/components/photos/compare-photos-dialog";
import { useStore } from "@/lib/store";
import { addDaysToKey, todayKey } from "@/lib/utils/date";
import { computeStreaks, last30DaysCompletion, percentCompletedInRange, productConsistency } from "@/lib/utils/streak";

export default function ProgressPage() {
  const products = useStore((s) => s.products);
  const logs = useStore((s) => s.logs);
  const [tab, setTab] = useState("stats");

  const today = new Date();
  const streaks = useMemo(() => computeStreaks(products, logs, today), [products, logs]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekPercent = useMemo(
    () => percentCompletedInRange(products, logs, addDaysToKey(todayKey(), -6), todayKey()),
    [products, logs]
  );
  const monthPercent = useMemo(
    () => percentCompletedInRange(products, logs, addDaysToKey(todayKey(), -29), todayKey()),
    [products, logs]
  );
  const chartData = useMemo(() => last30DaysCompletion(products, logs), [products, logs]);
  const consistency = useMemo(() => productConsistency(products, logs, 30), [products, logs]);
  const mostForgotten = consistency[0];
  const mostConsistent = consistency[consistency.length - 1];

  return (
    <div className="flex flex-col pb-6">
      <PageHeader title="Progressie" subtitle="Statistieken, logboek en foto's" />

      <div className="px-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="stats" className="flex-1">Statistieken</TabsTrigger>
            <TabsTrigger value="log" className="flex-1">Logboek</TabsTrigger>
            <TabsTrigger value="photos" className="flex-1">Foto&apos;s</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="flex flex-col gap-5">
            <WrappedDialog />

            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Deze week" value={`${weekPercent}%`} icon={<TrendingUp className="size-5" />} accent="blue" />
              <StatTile label="Deze maand" value={`${monthPercent}%`} icon={<TrendingUp className="size-5" />} accent="green" />
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
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground-muted">Laatste 30 dagen</p>
              <SimpleBarChart data={chartData} />
            </div>

            {consistency.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {mostForgotten && mostForgotten.percent < 100 && (
                  <StatTile
                    label="Meest vergeten"
                    value={mostForgotten.productName}
                    icon={<TrendingDown className="size-5" />}
                    accent="orange"
                  />
                )}
                {mostConsistent && (
                  <StatTile
                    label="Meest consistent"
                    value={mostConsistent.productName}
                    icon={<TrendingUp className="size-5" />}
                    accent="green"
                  />
                )}
              </div>
            )}

            <ExpenseOverview />

            <CombinedStreak />

            <StreakEffect />
          </TabsContent>

          <TabsContent value="log" className="flex flex-col gap-5">
            <CheckInForm />
            <CheckInHistory />
          </TabsContent>

          <TabsContent value="photos" className="flex flex-col gap-5">
            <div className="flex justify-end gap-2">
              <ComparePhotosDialog />
              <AddPhotoDialog />
            </div>
            <PhotoTimeline />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

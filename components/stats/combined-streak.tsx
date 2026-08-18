"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { fetchPartnerLogs, fetchPartnerProducts } from "@/lib/supabase/partner";
import { getDayStatus } from "@/lib/utils/streak";
import { addDaysToKey, getWeekStartKey, todayKey } from "@/lib/utils/date";
import type { DailyLog, Product } from "@/lib/types";

export function CombinedStreak() {
  const partnerId = useStore((s) => s.settings.partnerId);
  const partnerName = useStore((s) => s.settings.partnerName);

  if (!partnerId) return null;
  return <CombinedStreakInner key={partnerId} partnerId={partnerId} partnerName={partnerName} />;
}

function CombinedStreakInner({
  partnerId,
  partnerName,
}: {
  partnerId: string;
  partnerName: string | null | undefined;
}) {
  const myProducts = useStore((s) => s.products);
  const myLogs = useStore((s) => s.logs);
  const [partnerData, setPartnerData] = React.useState<{ products: Product[]; logs: Record<string, DailyLog> } | null>(
    null
  );

  React.useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    Promise.all([fetchPartnerProducts(supabase, partnerId), fetchPartnerLogs(supabase, partnerId)]).then(
      ([products, logs]) => {
        if (!cancelled) setPartnerData({ products, logs });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  if (!partnerData) return null;

  const weekStart = getWeekStartKey(new Date());
  const today = todayKey();
  let bothCompletedDays = 0;
  let trackedDays = 0;
  for (let i = 0; i < 7; i++) {
    const key = addDaysToKey(weekStart, i);
    if (key > today) continue;
    const myStatus = getDayStatus(myProducts, myLogs, key);
    const partnerStatus = getDayStatus(partnerData.products, partnerData.logs, key);
    if (myStatus === "no-routine" && partnerStatus === "no-routine") continue;
    trackedDays += 1;
    if (myStatus === "completed" && partnerStatus === "completed") bothCompletedDays += 1;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-accent" />
          Samen met {partnerName ?? "je partner"}
        </CardTitle>
        <CardDescription>Dagen deze week dat jullie allebei de volledige routine deden.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground">
          <span className="text-2xl font-semibold tabular-nums text-foreground">{bothCompletedDays}</span>
          <span className="text-foreground-muted"> van {trackedDays} dagen samen volbracht</span>
        </p>
      </CardContent>
    </Card>
  );
}

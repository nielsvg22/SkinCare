"use client";

import * as React from "react";
import { Sparkles, Flame, TrendingUp, TrendingDown, CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { monthlyWrapped } from "@/lib/utils/insights";

export function WrappedDialog() {
  const products = useStore((s) => s.products);
  const logs = useStore((s) => s.logs);
  const [open, setOpen] = React.useState(false);

  const wrapped = React.useMemo(() => monthlyWrapped(products, logs, new Date()), [products, logs]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="self-start">
          <Sparkles className="size-3.5" />
          Maandoverzicht
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{wrapped.monthLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1 rounded-radius-lg bg-gradient-to-br from-blue-50 to-beige-50 py-6">
            <span className="text-4xl font-semibold text-foreground tabular-nums">{wrapped.percent}%</span>
            <span className="text-sm text-foreground-muted">
              {wrapped.completedDays} van {wrapped.totalDays} dagen volledig voltooid
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <WrappedRow
              icon={<Flame className="size-4" />}
              label="Beste reeks deze maand"
              value={`${wrapped.bestStreakInMonth} ${wrapped.bestStreakInMonth === 1 ? "dag" : "dagen"}`}
            />
            {wrapped.mostConsistentProduct && (
              <WrappedRow
                icon={<TrendingUp className="size-4" />}
                label="Meest consistent"
                value={wrapped.mostConsistentProduct}
              />
            )}
            {wrapped.leastConsistentProduct && (
              <WrappedRow
                icon={<TrendingDown className="size-4" />}
                label="Meest vergeten"
                value={wrapped.leastConsistentProduct}
              />
            )}
            <WrappedRow
              icon={<CalendarCheck className="size-4" />}
              label="Dagen bijgehouden"
              value={String(wrapped.totalDays)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WrappedRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-radius bg-surface-2 px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-sm text-foreground-muted">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

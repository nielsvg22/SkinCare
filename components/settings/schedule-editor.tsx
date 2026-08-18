"use client";

import { useStore } from "@/lib/store";
import { WEEKDAY_LABELS_SHORT } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ScheduleEditor() {
  const products = useStore((s) => s.products);
  const updateProduct = useStore((s) => s.updateProduct);

  const scheduled = products.filter(
    (p): p is Product & { frequency: { type: "specificWeekdays"; weekdays: number[] } } =>
      p.frequency.type === "specificWeekdays"
  );

  if (scheduled.length === 0) {
    return (
      <p className="px-4 py-3.5 text-sm text-foreground-subtle">
        Geen producten met een weekdagschema. Stel dit in bij een product onder Producten.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-3.5">
      {scheduled.map((product) => (
        <div key={product.id} className="flex flex-col gap-2">
          <p className="text-sm text-foreground">{product.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS_SHORT.map((label, idx) => {
              const active = product.frequency.weekdays.includes(idx);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const weekdays = active
                      ? product.frequency.weekdays.filter((d) => d !== idx)
                      : [...product.frequency.weekdays, idx];
                    updateProduct(product.id, { frequency: { type: "specificWeekdays", weekdays } });
                  }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border-strong text-foreground-muted"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

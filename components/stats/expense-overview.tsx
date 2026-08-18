"use client";

import { Euro, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { currentInventoryValue, estimatedMonthlySpend } from "@/lib/utils/consumption";
import { formatPrice } from "@/lib/utils/format";
import { StatTile } from "@/components/stats/stat-tile";

export function ExpenseOverview() {
  const products = useStore((s) => s.products);
  const hasPrices = products.some((p) => p.purchasePrice !== undefined);

  if (!hasPrices) return null;

  const inventoryValue = currentInventoryValue(products);
  const monthlySpend = estimatedMonthlySpend(products);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-foreground-muted">Uitgaven</p>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Huidige voorraadwaarde"
          value={formatPrice(inventoryValue)}
          icon={<Wallet className="size-5" />}
          accent="blue"
        />
        <StatTile
          label="± per maand"
          value={formatPrice(monthlySpend)}
          icon={<Euro className="size-5" />}
          accent="neutral"
        />
      </div>
    </div>
  );
}

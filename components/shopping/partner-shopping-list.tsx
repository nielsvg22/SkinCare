"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { fetchPartnerShoppingItems, togglePartnerShoppingItem } from "@/lib/supabase/partner";
import { Checkbox } from "@/components/ui/checkbox";
import type { ShoppingItem } from "@/lib/types";

export function PartnerShoppingList() {
  const partnerId = useStore((s) => s.settings.partnerId);
  const partnerName = useStore((s) => s.settings.partnerName);

  if (!partnerId) return null;
  return <PartnerShoppingListInner key={partnerId} partnerId={partnerId} partnerName={partnerName} />;
}

function PartnerShoppingListInner({
  partnerId,
  partnerName,
}: {
  partnerId: string;
  partnerName: string | null | undefined;
}) {
  const [items, setItems] = React.useState<ShoppingItem[] | null>(null);

  const load = React.useCallback(() => {
    fetchPartnerShoppingItems(createClient(), partnerId).then(setItems);
  }, [partnerId]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (!items || items.length === 0) return null;

  const pending = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  function handleToggle(item: ShoppingItem) {
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) ?? null);
    togglePartnerShoppingItem(createClient(), item.id, !item.done).then(() => load());
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
        <Users className="size-3.5" />
        Lijst van {partnerName ?? "je partner"}
      </p>
      <div className="flex flex-col gap-2">
        {[...pending, ...done].map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-radius-lg border border-border bg-surface px-4 py-3"
          >
            <Checkbox checked={item.done} onCheckedChange={() => handleToggle(item)} />
            <span className={item.done ? "flex-1 text-foreground-subtle line-through" : "flex-1 text-foreground"}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

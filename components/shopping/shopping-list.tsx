"use client";

import * as React from "react";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { isLowStock } from "@/lib/utils/consumption";

export function ShoppingList() {
  const shoppingList = useStore((s) => s.shoppingList);
  const products = useStore((s) => s.products);
  const defaultThreshold = useStore((s) => s.settings.defaultLowStockThresholdDays);
  const addShoppingItem = useStore((s) => s.addShoppingItem);
  const toggleShoppingItem = useStore((s) => s.toggleShoppingItem);
  const removeShoppingItem = useStore((s) => s.removeShoppingItem);
  const [newItem, setNewItem] = React.useState("");

  const suggestions = products.filter(
    (p) =>
      !p.paused &&
      isLowStock(p, defaultThreshold) &&
      !shoppingList.some((item) => item.linkedProductId === p.id && !item.done)
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newItem.trim();
    if (!trimmed) return;
    addShoppingItem(trimmed);
    setNewItem("");
  }

  const pending = shoppingList.filter((i) => !i.done);
  const done = shoppingList.filter((i) => i.done);

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Nieuw item, bijv. Aftershave"
          aria-label="Nieuw boodschappenitem"
        />
        <Button type="submit" size="icon" aria-label="Toevoegen" disabled={!newItem.trim()}>
          <Plus className="size-5" />
        </Button>
      </form>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Voorgesteld — bijna op
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => addShoppingItem(`${p.brand} ${p.name}`, p.id)}
                className="flex items-center gap-1.5 rounded-radius-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-sm text-orange-600 transition-colors hover:bg-orange-400/20"
              >
                <Plus className="size-3.5" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {shoppingList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-radius-lg border border-dashed border-border-strong py-10 text-center">
          <ShoppingBag className="size-8 text-foreground-subtle" strokeWidth={1.5} />
          <p className="text-sm text-foreground-muted">Je boodschappenlijst is leeg</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((item) => (
            <ShoppingRow
              key={item.id}
              name={item.name}
              done={item.done}
              onToggle={() => toggleShoppingItem(item.id)}
              onRemove={() => removeShoppingItem(item.id)}
            />
          ))}
          {done.length > 0 && (
            <>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Gekocht
              </p>
              {done.map((item) => (
                <ShoppingRow
                  key={item.id}
                  name={item.name}
                  done={item.done}
                  onToggle={() => toggleShoppingItem(item.id)}
                  onRemove={() => removeShoppingItem(item.id)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ShoppingRow({
  name,
  done,
  onToggle,
  onRemove,
}: {
  name: string;
  done: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-radius-lg border border-border bg-surface px-4 py-3">
      <Checkbox checked={done} onCheckedChange={onToggle} />
      <span className={done ? "flex-1 text-foreground-subtle line-through" : "flex-1 text-foreground"}>
        {name}
      </span>
      <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label={`${name} verwijderen`}>
        <Trash2 className="size-4 text-foreground-subtle" />
      </Button>
    </div>
  );
}

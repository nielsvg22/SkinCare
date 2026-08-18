"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ExternalLink,
  GripVertical,
  Pause,
  Pencil,
  Play,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/products/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { estimateConsumption, formatMonthsRemaining, isLowStock } from "@/lib/utils/consumption";
import { formatVolume, frequencyLabel } from "@/lib/utils/format";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATEGORY_BADGE: Record<Product["category"], "blue" | "green" | "beige" | "orange" | "default"> = {
  Haar: "blue",
  Lichaam: "green",
  Ogen: "beige",
  Gezicht: "orange",
  Overig: "default",
};

interface ProductCardProps {
  product: Product;
  /** Combined dnd-kit attributes + listeners for the drag handle, pre-merged by the caller. */
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function ProductCard({ product, dragHandleProps, isDragging }: ProductCardProps) {
  const defaultThreshold = useStore((s) => s.settings.defaultLowStockThresholdDays);
  const setProductPaused = useStore((s) => s.setProductPaused);
  const removeProduct = useStore((s) => s.removeProduct);
  const addShoppingItem = useStore((s) => s.addShoppingItem);
  const shoppingList = useStore((s) => s.shoppingList);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const consumption = estimateConsumption(product);
  const lowStock = isLowStock(product, defaultThreshold);
  const alreadyOnList = shoppingList.some(
    (item) => item.linkedProductId === product.id && !item.done
  );

  function handleAddToShoppingList() {
    addShoppingItem(`${product.brand} ${product.name}`, product.id);
    toast.success("Toegevoegd aan boodschappenlijst");
  }

  return (
    <div
      className={cn(
        "rounded-radius-lg border bg-surface p-4 shadow-soft-sm transition-opacity",
        product.paused ? "border-border opacity-60" : "border-border",
        isDragging && "shadow-soft-lg opacity-90"
      )}
    >
      <div className="flex gap-4">
        {dragHandleProps && (
          <button
            type="button"
            className="flex shrink-0 cursor-grab touch-none items-center text-foreground-subtle active:cursor-grabbing"
            aria-label="Verplaatsen"
            {...dragHandleProps}
          >
            <GripVertical className="size-5" />
          </button>
        )}
        <ProductImage image={product.image} name={product.name} category={product.category} className="size-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={CATEGORY_BADGE[product.category]}>{product.category}</Badge>
            {product.paused && <Badge variant="outline">Gepauzeerd</Badge>}
          </div>
          <p className="mt-1 truncate font-semibold text-foreground">{product.name}</p>
          <p className="text-sm text-foreground-muted">
            {product.brand} · {formatVolume(product)}
          </p>
          <p className="mt-0.5 text-xs text-foreground-subtle">{frequencyLabel(product)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-radius bg-surface-2 px-3 py-2">
        <span className="text-sm text-foreground-muted">Geschatte voorraad</span>
        <span className="text-sm font-medium text-foreground">
          {formatMonthsRemaining(consumption.monthsRemaining)}
        </span>
      </div>

      {lowStock && (
        <div className="mt-2 flex flex-col gap-2 rounded-radius border border-orange-400/30 bg-orange-400/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
            <AlertTriangle className="size-4 shrink-0" />
            Bijna op — nog {Math.max(0, Math.round(consumption.daysRemaining ?? 0))} dagen voorraad
          </div>
          <div className="flex gap-2">
            {product.purchaseUrl && (
              <Button asChild size="sm" variant="outline" className="border-orange-400/40 text-orange-600 hover:bg-orange-400/10">
                <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Opnieuw bestellen
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-orange-400/40 text-orange-600 hover:bg-orange-400/10"
              onClick={handleAddToShoppingList}
              disabled={alreadyOnList}
            >
              <ShoppingCart className="size-3.5" />
              {alreadyOnList ? "Op de lijst" : "Op boodschappenlijst"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-end border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setProductPaused(product.id, !product.paused)}
            aria-label={product.paused ? "Hervatten" : "Pauzeren"}
          >
            {product.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          </Button>
          <Button asChild size="icon-sm" variant="ghost" aria-label="Bewerken">
            <Link href={`/products/${product.id}`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDelete(true)}
            aria-label="Verwijderen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Product verwijderen"
        description={`Weet je zeker dat je "${product.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        onConfirm={() => {
          removeProduct(product.id);
          toast.success("Product verwijderd");
        }}
      />
    </div>
  );
}

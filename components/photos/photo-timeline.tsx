"use client";

import * as React from "react";
import { Camera, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { parseDateKey, formatDisplayDate } from "@/lib/utils/date";
import type { ProgressPhoto, ProgressPhotoCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ProgressPhotoCategory, string> = {
  haarlijn: "Haarlijn",
  haar: "Haar",
  huid: "Huid",
};

export function PhotoTimeline() {
  const photos = useStore((s) => s.photos);
  const removePhoto = useStore((s) => s.removePhoto);
  const [toDelete, setToDelete] = React.useState<ProgressPhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-radius-lg border border-dashed border-border-strong py-12 text-center">
        <Camera className="size-8 text-foreground-subtle" strokeWidth={1.5} />
        <p className="text-sm text-foreground-muted">Nog geen progressiefoto&apos;s</p>
        <p className="max-w-[220px] text-xs text-foreground-subtle">
          Voeg maandelijks een foto toe om je voortgang zelf te vergelijken.
        </p>
      </div>
    );
  }

  const sorted = [...photos].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((photo) => (
        <div key={photo.id} className="flex items-center gap-4 rounded-radius-lg border border-border bg-surface p-3">
          <ProductImage image={photo.imageKey} name={CATEGORY_LABELS[photo.category]} className="size-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{CATEGORY_LABELS[photo.category]}</p>
            <p className="text-xs text-foreground-subtle">{formatDisplayDate(parseDateKey(photo.date))}</p>
            {photo.note && <p className="mt-1 text-sm text-foreground-muted">{photo.note}</p>}
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-foreground-subtle"
            onClick={() => setToDelete(photo)}
            aria-label="Foto verwijderen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Foto verwijderen"
        description="Weet je zeker dat je deze progressiefoto wilt verwijderen?"
        confirmLabel="Verwijderen"
        onConfirm={() => toDelete && removePhoto(toDelete.id)}
      />
    </div>
  );
}

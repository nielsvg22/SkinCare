"use client";

import * as React from "react";
import { GitCompareArrows } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeforeAfterSlider } from "@/components/photos/before-after-slider";
import { useStore } from "@/lib/store";
import { formatDisplayDate, parseDateKey } from "@/lib/utils/date";
import type { ProgressPhoto } from "@/lib/types";

function photoLabel(photo: ProgressPhoto) {
  return formatDisplayDate(parseDateKey(photo.date));
}

export function ComparePhotosDialog() {
  const photos = useStore((s) => s.photos);
  const sorted = [...photos].sort((a, b) => (a.date < b.date ? -1 : 1));
  const [open, setOpen] = React.useState(false);
  const [beforeId, setBeforeId] = React.useState<string>("");
  const [afterId, setAfterId] = React.useState<string>("");

  // Defaults (oldest/newest photo) are derived at render time rather than
  // synced via an effect — they only need to exist once selects are shown,
  // and this avoids an extra render pass just to seed initial state.
  const effectiveBeforeId = beforeId || sorted[0]?.id || "";
  const effectiveAfterId = afterId || sorted[sorted.length - 1]?.id || "";

  const beforePhoto = sorted.find((p) => p.id === effectiveBeforeId);
  const afterPhoto = sorted.find((p) => p.id === effectiveAfterId);

  if (photos.length < 2) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitCompareArrows className="size-3.5" />
          Vergelijk
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Foto&apos;s vergelijken</DialogTitle>
          <DialogDescription>Sleep de balk om te vergelijken.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-foreground-muted">Voor</Label>
            <Select value={effectiveBeforeId} onValueChange={setBeforeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {photoLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-foreground-muted">Na</Label>
            <Select value={effectiveAfterId} onValueChange={setAfterId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {photoLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {beforePhoto && afterPhoto && (
          <BeforeAfterSlider
            beforeUrl={beforePhoto.imageKey}
            afterUrl={afterPhoto.imageKey}
            beforeLabel={photoLabel(beforePhoto)}
            afterLabel={photoLabel(afterPhoto)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

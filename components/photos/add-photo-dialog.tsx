"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { uploadUserImage } from "@/lib/storage/supabase-storage";
import { todayKey } from "@/lib/utils/date";
import type { ProgressPhotoCategory } from "@/lib/types";

const CATEGORY_LABELS: Record<ProgressPhotoCategory, string> = {
  haarlijn: "Haarlijn",
  haar: "Haar",
  huid: "Huid",
};

export function AddPhotoDialog() {
  const addPhoto = useStore((s) => s.addPhoto);
  const userId = useStore((s) => s.userId);
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<ProgressPhotoCategory>("haar");
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !userId) {
      toast.error("Kies eerst een foto");
      return;
    }
    setSaving(true);
    try {
      const imageKey = await uploadUserImage(createClient(), userId, file);
      addPhoto({ date: todayKey(), category, imageKey, note: note.trim() || undefined });
      toast.success("Foto toegevoegd");
      setOpen(false);
      setFile(null);
      setNote("");
    } catch {
      toast.error("Opslaan van foto is mislukt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Foto toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Progressiefoto toevoegen</DialogTitle>
          <DialogDescription>Voor je eigen vergelijking — geen automatische analyse.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Categorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProgressPhotoCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photo-file">Foto</Label>
            <input
              id="photo-file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <Button asChild type="button" variant="outline" size="sm" className="self-start">
              <label htmlFor="photo-file" className="cursor-pointer">
                <ImagePlus className="size-3.5" />
                {file ? file.name : "Kies foto"}
              </label>
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photo-note">Notitie (optioneel)</Label>
            <Input id="photo-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

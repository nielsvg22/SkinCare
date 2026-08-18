"use client";

import * as React from "react";
import { Library, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_LIBRARY, type LibraryProduct } from "@/lib/data/product-library";

interface LibraryPickerDialogProps {
  onPick: (item: LibraryProduct) => void;
}

export function LibraryPickerDialog({ onPick }: LibraryPickerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCT_LIBRARY;
    return PRODUCT_LIBRARY.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [query]);

  function handlePick(item: LibraryProduct) {
    onPick(item);
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Library className="size-3.5" />
        Kies uit bibliotheek
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Productenbibliotheek</DialogTitle>
          <DialogDescription>Kies een bekend product om de velden vast in te vullen.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op merk, product of categorie"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {results.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-muted">Niets gevonden</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePick(item)}
                className="flex flex-col items-start gap-0.5 rounded-radius border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-surface-2"
              >
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs text-foreground-muted">
                  {item.brand} · {item.category}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

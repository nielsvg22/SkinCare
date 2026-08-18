"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { validateImportedData } from "@/lib/utils/validate";
import { todayKey } from "@/lib/utils/date";
import type { AppState } from "@/lib/types";

export function ExportImport() {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = React.useState<AppState | null>(null);
  const [importing, setImporting] = React.useState(false);

  function handleExport() {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verzorgingsroutine-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Back-up gedownload");
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImporting(false);
      try {
        const raw = JSON.parse(String(reader.result));
        const result = validateImportedData(raw);
        if (!result.success || !result.data) {
          toast.error(result.error ?? "Ongeldig back-upbestand");
          return;
        }
        setPendingImport(result.data);
      } catch {
        toast.error("Kon het bestand niet lezen — is het een geldig JSON-bestand?");
      }
    };
    reader.onerror = () => {
      setImporting(false);
      toast.error("Kon het bestand niet lezen");
    };
    reader.readAsText(file);
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 py-3.5">
        <Button variant="outline" onClick={handleExport} className="justify-start">
          <Download className="size-4" />
          Data exporteren
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Data importeren
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      <ConfirmDialog
        open={!!pendingImport}
        onOpenChange={(open) => !open && setPendingImport(null)}
        title="Data importeren"
        description="Dit overschrijft al je huidige gegevens (routines, voorraad, historie) met de inhoud van dit back-upbestand. Weet je het zeker?"
        confirmLabel="Overschrijven"
        onConfirm={() => {
          if (pendingImport) {
            importData(pendingImport);
            toast.success("Data geïmporteerd");
          }
        }}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { ScanLine, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupBarcode, type BarcodeLookupResult } from "@/lib/utils/barcode";

// Not in the standard TS DOM lib yet — Chrome/Android-only API.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

interface BarcodeScannerDialogProps {
  onFound: (result: BarcodeLookupResult) => void;
}

export function BarcodeScannerDialog({ onFound }: BarcodeScannerDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [manualCode, setManualCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const cameraSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stopCamera = React.useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  async function handleCode(code: string) {
    stopCamera();
    setBusy(true);
    try {
      const result = await lookupBarcode(code);
      if (!result) {
        toast.error("Product niet gevonden in de database — vul de gegevens handmatig aan");
        setOpen(false);
        return;
      }
      onFound(result);
      setOpen(false);
    } catch {
      toast.error("Barcode opzoeken is mislukt — controleer je internetverbinding");
    } finally {
      setBusy(false);
      setManualCode("");
    }
  }

  React.useEffect(() => {
    if (!open || !cameraSupported) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const detector = new window.BarcodeDetector!({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
        });

        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              handleCode(codes[0].rawValue);
              return;
            }
          } catch {
            // ignore transient decode errors, keep scanning
          }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      })
      .catch(() => {
        if (!cancelled) setCameraError("Geen toegang tot de camera — vul de barcode handmatig in.");
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cameraSupported]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    handleCode(trimmed);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) stopCamera();
        setOpen(v);
      }}
    >
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ScanLine className="size-3.5" />
        Scan barcode
      </Button>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Barcode scannen</DialogTitle>
          <DialogDescription>
            {cameraSupported
              ? "Richt de camera op de barcode van de verpakking."
              : "Camera-scannen wordt niet ondersteund in deze browser (o.a. Safari op iPhone) — vul de barcode hieronder handmatig in."}
          </DialogDescription>
        </DialogHeader>

        {cameraSupported && !cameraError && (
          <div className="relative aspect-square w-full overflow-hidden rounded-radius-lg bg-navy-600">
            <video ref={videoRef} muted playsInline className="size-full object-cover" />
            <div className="pointer-events-none absolute inset-8 rounded-radius border-2 border-accent/70" />
          </div>
        )}

        {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Barcode handmatig invoeren"
            inputMode="numeric"
          />
          <Button type="submit" disabled={!manualCode.trim() || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Zoek"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

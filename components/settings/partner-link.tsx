"use client";

import * as React from "react";
import { toast } from "sonner";
import { Copy, Link2, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";

export function PartnerLink() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const hydrate = useStore((s) => s.hydrate);
  const userId = useStore((s) => s.userId);

  const [code, setCode] = React.useState<string | null>(null);
  const [redeemInput, setRedeemInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [confirmUnlink, setConfirmUnlink] = React.useState(false);

  async function handleGenerateCode() {
    setBusy(true);
    try {
      const res = await fetch("/api/partner/invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCode(data.code);
    } catch {
      toast.error("Aanmaken van uitnodigingscode is mislukt");
    } finally {
      setBusy(false);
    }
  }

  async function handleRedeem() {
    if (!redeemInput.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/partner/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Gekoppeld met ${data.partnerName}`);
      if (userId) {
        // Re-fetch this account's data so settings.partnerId/partnerName reflect the new pairing.
        const { createClient } = await import("@/lib/supabase/client");
        const { fetchAllData } = await import("@/lib/supabase/repo");
        const fresh = await fetchAllData(createClient(), userId);
        hydrate(userId, fresh);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Koppelen is mislukt");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlink() {
    setBusy(true);
    try {
      await fetch("/api/partner/unlink", { method: "POST" });
      updateSettings({ partnerId: null, partnerName: null, shareShoppingList: false });
      toast.success("Koppeling verwijderd");
    } catch {
      toast.error("Ontkoppelen is mislukt");
    } finally {
      setBusy(false);
    }
  }

  if (settings.partnerId) {
    return (
      <div className="flex flex-col gap-3 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Link2 className="size-4 text-green-600" />
            Gekoppeld met {settings.partnerName ?? "je partner"}
          </div>
          <Button size="sm" variant="ghost" onClick={() => setConfirmUnlink(true)} disabled={busy}>
            <Unlink className="size-3.5" />
            Ontkoppelen
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-radius border border-border p-3">
          <div>
            <Label htmlFor="share-shopping" className="text-sm">Boodschappenlijst delen</Label>
            <p className="text-xs text-foreground-muted">Je partner kan je lijst zien en afvinken</p>
          </div>
          <Switch
            id="share-shopping"
            checked={settings.shareShoppingList}
            onCheckedChange={(v) => updateSettings({ shareShoppingList: v })}
          />
        </div>

        <ConfirmDialog
          open={confirmUnlink}
          onOpenChange={setConfirmUnlink}
          title="Koppeling verwijderen"
          description="Jullie zien elkaars gezamenlijke streak en gedeelde boodschappenlijst niet meer. Jullie eigen data blijft gewoon bestaan."
          confirmLabel="Ontkoppelen"
          onConfirm={handleUnlink}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-3.5">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground">Nodig uit met een code</p>
        {code ? (
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-radius border border-border-strong bg-surface-2 px-3 py-2 text-center font-mono text-lg tracking-widest text-foreground">
              {code}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(code);
                toast.success("Gekopieerd");
              }}
              aria-label="Kopiëren"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleGenerateCode} disabled={busy} className="self-start">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
            Genereer code
          </Button>
        )}
        <p className="text-xs text-foreground-subtle">Geldig 24 uur. Deel &apos;m alleen met je partner.</p>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-sm text-foreground">Of vul een code in</p>
        <div className="flex gap-2">
          <Input
            value={redeemInput}
            onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
            placeholder="Bijv. A1B2C3D4"
            className="font-mono tracking-widest"
          />
          <Button onClick={handleRedeem} disabled={busy || !redeemInput.trim()}>
            Koppel
          </Button>
        </div>
      </div>
    </div>
  );
}

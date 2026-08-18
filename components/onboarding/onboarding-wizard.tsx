"use client";

import * as React from "react";
import { toast } from "sonner";
import { Flame, Sparkles, Bell, Users, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { subscribeToPush } from "@/lib/push/subscribe";

function storageKey(userId: string) {
  return `onboarding-seen:${userId}`;
}

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="size-6" />,
    title: "Welkom bij je routine",
    description:
      "Je startproducten staan al klaar bij Producten. Vink elke stap af op Vandaag zodra je 'm hebt gedaan.",
  },
  {
    icon: <Flame className="size-6" />,
    title: "Bouw een streak op",
    description:
      "Elke dag dat je je volledige routine afrondt telt mee voor je streak. Gebruik pauzestand op vakantie zonder je streak te breken.",
  },
  {
    icon: <Bell className="size-6" />,
    title: "Herinneringen",
    description: "Zet meldingen aan zodat je rond je ochtendtijd een reminder krijgt, ook als de app dicht staat.",
  },
  {
    icon: <Users className="size-6" />,
    title: "Samen met je partner",
    description:
      "Wil je samen bijhouden? Koppel jullie accounts bij Instellingen voor een gedeelde streak en boodschappenlijst.",
  },
];

export function OnboardingWizard() {
  const userId = useStore((s) => s.userId);
  const name = useStore((s) => s.settings.name);
  const updateSettings = useStore((s) => s.updateSettings);

  // This component only ever mounts client-side, after DataLoader has
  // hydrated the store (see app/(app)/layout.tsx) — so userId/name are
  // already populated on first render and a lazy initializer is safe here,
  // no separate "check once mounted" effect needed.
  const [open, setOpen] = React.useState(() => !!userId && !window.localStorage.getItem(storageKey(userId)));
  const [step, setStep] = React.useState(0);
  const [nameInput, setNameInput] = React.useState(() => (name === "Jij" ? "" : name));
  const [enablingPush, setEnablingPush] = React.useState(false);

  function finish() {
    if (userId) window.localStorage.setItem(storageKey(userId), "1");
    setOpen(false);
  }

  async function handleEnableReminders() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push-meldingen worden niet ondersteund in deze browser");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Geef toestemming voor meldingen om herinneringen te ontvangen");
      return;
    }
    setEnablingPush(true);
    try {
      await subscribeToPush();
      updateSettings({ remindersEnabled: true });
      toast.success("Herinneringen ingeschakeld");
    } catch {
      toast.error("Abonneren op meldingen is mislukt");
    } finally {
      setEnablingPush(false);
    }
  }

  const isFirstStep = step === 0;
  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {isFirstStep && (
          <div className="flex flex-col gap-1.5 pb-2">
            <label className="text-sm text-foreground-muted">Hoe mogen we je noemen?</label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={() => {
                const trimmed = nameInput.trim();
                if (trimmed) updateSettings({ name: trimmed });
              }}
              placeholder="Jouw naam"
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            {current.icon}
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </div>

        {step === 2 && (
          <Button type="button" variant="outline" onClick={handleEnableReminders} disabled={enablingPush}>
            <Bell className="size-3.5" />
            Meldingen inschakelen
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={idx === step ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-border-strong"}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={finish}>
            Overslaan
          </Button>
          <Button type="button" onClick={() => (isLastStep ? finish() : setStep((s) => s + 1))}>
            {isLastStep ? "Aan de slag" : "Volgende"}
            {!isLastStep && <ChevronRight className="size-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

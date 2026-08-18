"use client";

import * as React from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { ScheduleEditor } from "@/components/settings/schedule-editor";
import { ExportImport } from "@/components/settings/export-import";
import { RemindersToggle } from "@/components/settings/reminders-toggle";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { AppLockToggle } from "@/components/settings/app-lock-toggle";
import { PartnerLink } from "@/components/settings/partner-link";
import { BackupList } from "@/components/settings/backup-list";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAllData = useStore((s) => s.resetAllData);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [name, setName] = React.useState(settings.name);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader title="Instellingen" subtitle="Personaliseer je routine-app" />

      <div className="flex flex-col gap-6 px-5">
        <SettingsSection title="Profiel">
          <SettingsRow label="Naam">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => updateSettings({ name: name.trim() || "Jij" })}
              className="w-36 text-right"
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Weergave">
          <SettingsRow label="Thema">
            <ThemeSwitcher />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Tijden" description="Gewenste momenten voor je ochtend- en avondroutine">
          <SettingsRow label="Ochtendroutine">
            <Input
              type="time"
              value={settings.morningTime}
              onChange={(e) => updateSettings({ morningTime: e.target.value })}
              className="w-32"
            />
          </SettingsRow>
          <SettingsRow label="Avondroutine">
            <Input
              type="time"
              value={settings.eveningTime}
              onChange={(e) => updateSettings({ eveningTime: e.target.value })}
              className="w-32"
            />
          </SettingsRow>
          <SettingsRow
            label="Herinneringen"
            description="Melding rond je ochtendtijd, ook als de app niet open staat"
          >
            <RemindersToggle />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Conditioner-schema" description="Op welke dagen gebruik je welke geplande producten">
          <ScheduleEditor />
        </SettingsSection>

        <SettingsSection title="Voorraadwaarschuwingen">
          <SettingsRow label="Waarschuw bij minder dan" description="Standaard aantal dagen voorraad">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={settings.defaultLowStockThresholdDays}
                onChange={(e) =>
                  updateSettings({ defaultLowStockThresholdDays: Math.max(1, Number(e.target.value) || 1) })
                }
                className="w-20 text-right"
              />
              <span className="text-sm text-foreground-muted">dagen</span>
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Data" description="Veilig opgeslagen in je eigen account">
          <ExportImport />
        </SettingsSection>

        <SettingsSection title="Automatische back-ups" description="Wekelijkse momentopname, los van handmatig exporteren">
          <BackupList />
        </SettingsSection>

        <SettingsSection title="Beveiliging" description="Vergrendel de app lokaal met Face ID / Touch ID">
          <SettingsRow label="Appvergrendeling">
            <AppLockToggle />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Partner" description="Optioneel — deel een gecombineerde streak en/of je boodschappenlijst">
          <PartnerLink />
        </SettingsSection>

        <SettingsSection title="Account">
          <div className="px-4 py-3.5">
            <SignOutButton />
          </div>
        </SettingsSection>

        <SettingsSection title="Gevarenzone">
          <div className="px-4 py-3.5">
            <Button
              variant="destructive"
              onClick={() => setConfirmReset(true)}
              className="justify-start"
            >
              <RotateCcw className="size-4" />
              Alle data resetten
            </Button>
          </div>
        </SettingsSection>

        <p className="px-1 text-center text-xs text-foreground-subtle">
          Verzorgingsroutine · jouw eigen account
        </p>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Alle data resetten"
        description="Dit verwijdert al je producten, historie, voorraad en foto's permanent en herstelt de standaardinstellingen. Dit kan niet ongedaan worden gemaakt."
        confirmLabel="Alles resetten"
        onConfirm={async () => {
          await resetAllData();
          toast.success("Alle data is gereset");
        }}
      />
    </div>
  );
}

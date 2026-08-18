import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground-muted">{title}</h2>
        {description && <p className="text-xs text-foreground-subtle">{description}</p>}
      </div>
      <Card>
        <CardContent className="flex flex-col divide-y divide-border p-0">{children}</CardContent>
      </Card>
    </section>
  );
}

export function SettingsRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {description && <p className="text-xs text-foreground-subtle">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

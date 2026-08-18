"use client";

import * as React from "react";
import { Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";

interface BackupFile {
  name: string;
  createdAt: string | null;
}

export function BackupList() {
  const userId = useStore((s) => s.userId);
  const [files, setFiles] = React.useState<BackupFile[] | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("backups")
      .list(userId, { sortBy: { column: "name", order: "desc" } })
      .then(({ data }) => {
        if (!cancelled) {
          setFiles((data ?? []).map((f) => ({ name: f.name, createdAt: f.created_at ?? null })));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleDownload(name: string) {
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("backups").createSignedUrl(`${userId}/${name}`, 60);
    if (error || !data) return;
    window.open(data.signedUrl, "_blank");
  }

  if (files === null) {
    return <p className="px-4 py-3.5 text-sm text-foreground-subtle">Laden…</p>;
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3.5 text-sm text-foreground-subtle">
        <History className="size-4 shrink-0" />
        Nog geen automatische back-up gemaakt — de eerste komt na de wekelijkse cron-run.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-4 py-3.5">
      {files.map((f) => (
        <div key={f.name} className="flex items-center justify-between py-1.5">
          <span className="text-sm text-foreground">{f.name.replace(".json", "")}</span>
          <Button size="icon-sm" variant="ghost" onClick={() => handleDownload(f.name)} aria-label="Downloaden">
            <Download className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

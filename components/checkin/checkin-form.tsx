"use client";

import * as React from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { StarRating } from "@/components/checkin/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getWeekStartKey } from "@/lib/utils/date";

export function CheckInForm() {
  const checkIns = useStore((s) => s.checkIns);
  const addCheckIn = useStore((s) => s.addCheckIn);
  const updateCheckIn = useStore((s) => s.updateCheckIn);

  const weekStart = getWeekStartKey(new Date());
  const existing = checkIns.find((c) => c.weekStart === weekStart);

  const [hair, setHair] = React.useState(existing?.hair ?? 0);
  const [skin, setSkin] = React.useState(existing?.skin ?? 0);
  const [eyes, setEyes] = React.useState(existing?.eyes ?? 0);
  const [note, setNote] = React.useState(existing?.note ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existing) {
      updateCheckIn(existing.id, { hair, skin, eyes, note });
    } else {
      addCheckIn({ weekStart, hair, skin, eyes, note });
    }
    toast.success("Logboek opgeslagen");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoe gaat het?</CardTitle>
        <CardDescription>Een persoonlijk logboek — geen medische conclusies, gewoon je eigen observaties.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <StarRating label="Haar" value={hair} onChange={setHair} />
          <StarRating label="Huid" value={skin} onChange={setSkin} />
          <StarRating label="Ogen" value={eyes} onChange={setEyes} />
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bijv. Mijn haar lijkt deze week voller."
          />
          <Button type="submit" className="self-start">
            {existing ? "Bijwerken" : "Opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

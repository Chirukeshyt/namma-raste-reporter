"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatStatus, type ReportStatus } from "@/lib/reports/status";

import { updateReportStatusAction } from "../actions";

export function ReportStatusUpdater({
  reportId,
  currentStatus,
  allowedStatuses,
}: {
  reportId: string;
  currentStatus: string;
  allowedStatuses: ReportStatus[];
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(currentStatus);
  const [note, setNote] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("reportId", reportId);
      formData.set("status", status);
      formData.set("note", note);
      const result = await updateReportStatusAction(formData);
      if (result && !result.ok) toast.error(result.message);
      else toast.success("Status updated.");
      setNote("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value ?? status)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {allowedStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">Admin note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason, assignment details, ETA..."
          className="min-h-24"
        />
      </div>

      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        Save update
      </Button>
    </form>
  );
}


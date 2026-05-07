"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatStatus } from "@/lib/reports/status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { trackTicketAction } from "../actions";

type Update = { status: string; note: string | null; created_at: string };

type TicketPayload = {
  report_id: string;
  ticket_id: string;
  issue_type: string;
  severity: string;
  status: string;
  address: string | null;
  created_at: string;
  updated_at: string;
  image_signed_url?: string | null;
  updates: Update[];
};

export function TrackTicketForm({ initialTicketId }: { initialTicketId: string }) {
  const [isPending, startTransition] = useTransition();
  const [ticketId, setTicketId] = useState(initialTicketId);
  const [payload, setPayload] = useState<TicketPayload | null>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const normalizedTicketId = useMemo(() => ticketId.trim().toUpperCase(), [ticketId]);

  useEffect(() => {
    if (!payload?.report_id) return;

    const channel = supabase
      .channel(`track-${payload.report_id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${payload.report_id}` },
        (evt) => {
          setPayload((prev) =>
            prev
              ? {
                  ...prev,
                  status: (evt.new as any).status ?? prev.status,
                  severity: (evt.new as any).severity ?? prev.severity,
                  issue_type: (evt.new as any).issue_type ?? prev.issue_type,
                  address: (evt.new as any).address ?? prev.address,
                  updated_at: (evt.new as any).updated_at ?? prev.updated_at,
                }
              : prev,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "report_updates",
          filter: `report_id=eq.${payload.report_id}`,
        },
        (evt) => {
          setPayload((prev) =>
            prev ? { ...prev, updates: [...(prev.updates ?? []), evt.new as any] } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [payload?.report_id, supabase]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", normalizedTicketId);
      const result = await trackTicketAction(formData);
      if (!result.ok) {
        setPayload(null);
        toast.error(result.message);
        return;
      }
      setPayload(result.data as TicketPayload);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket ID</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="ticketId">Enter Ticket ID</Label>
              <Input
                id="ticketId"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="NR-2026-000123"
                className="h-11 font-mono"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={isPending}>
              Track status
            </Button>
          </form>
        </CardContent>
      </Card>

      {payload ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{payload.issue_type}</Badge>
              <Badge variant="outline">{payload.severity}</Badge>
              <Badge>{formatStatus(payload.status)}</Badge>
            </div>

            {payload.image_signed_url ? (
              <div className="overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={payload.image_signed_url}
                  alt="Reported issue"
                  className="h-72 w-full object-contain bg-black/5"
                />
              </div>
            ) : null}

            <div className="text-sm text-muted-foreground">
              Submitted: {new Date(payload.created_at).toLocaleString()}
            </div>
            {payload.address ? (
              <div className="text-sm">
                <span className="font-medium">Location:</span>{" "}
                <span className="text-muted-foreground">{payload.address}</span>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Timeline</div>
              <div className="space-y-3">
                {payload.updates?.length ? (
                  payload.updates.map((u, idx) => (
                    <div key={`${u.created_at}-${idx}`} className="rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{formatStatus(u.status)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleString()}
                        </div>
                      </div>
                      {u.note ? (
                        <div className="mt-1 text-sm text-muted-foreground">{u.note}</div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No updates yet. Please check back later.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatStatus } from "@/lib/reports/status";

import { ReportStatusUpdater } from "./report-status-updater";

type ReportDto = {
  id: string;
  ticket_id: string;
  issue_type: string;
  severity: string;
  sub_type?: string | null;
  road_context?: string | null;
  landmark?: string | null;
  is_hazard?: boolean | null;
  description: string | null;
  image_url: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type UpdateDto = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export function AdminReportRealtime({
  initialReport,
  initialUpdates,
  signedImageUrl,
}: {
  initialReport: ReportDto;
  initialUpdates: UpdateDto[];
  signedImageUrl: string | null;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [report, setReport] = useState<ReportDto>(initialReport);
  const [updates, setUpdates] = useState<UpdateDto[]>(initialUpdates);
  const [imageUrl, setImageUrl] = useState<string | null>(signedImageUrl);

  useEffect(() => {
    const channel = supabase
      .channel(`admin-report-${report.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${report.id}` },
        (payload) => {
          setReport(payload.new as ReportDto);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "report_updates",
          filter: `report_id=eq.${report.id}`,
        },
        (payload) => {
          setUpdates((prev) => [...prev, payload.new as UpdateDto]);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") return;
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [report.id, supabase]);

  useEffect(() => {
    // If report.image_url changes, refresh signed URL.
    async function refresh() {
      if (!report.image_url) {
        setImageUrl(null);
        return;
      }
      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(report.image_url, 60 * 30);
      if (error) {
        toast.error("Could not load image.");
        console.error("[admin] realtime createSignedUrl failed", {
          reportId: report.id,
          imageUrl: report.image_url,
          message: error.message,
        });
        return;
      }
      setImageUrl(data?.signedUrl ?? null);
    }
    void refresh();
  }, [report.image_url, supabase]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{report.issue_type}</Badge>
            <Badge variant="outline">{report.severity}</Badge>
            <Badge>{formatStatus(report.status)}</Badge>
            {report.is_hazard ? <Badge variant="destructive">Hazard</Badge> : null}
          </div>

          {imageUrl ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Reported issue"
                className="h-80 w-full object-contain bg-black/5"
              />
            </div>
          ) : null}

          {report.address ? (
            <div className="text-sm">
              <span className="font-medium">Address:</span>{" "}
              <span className="text-muted-foreground">{report.address}</span>
            </div>
          ) : null}
          {report.landmark ? (
            <div className="text-sm">
              <span className="font-medium">Landmark:</span>{" "}
              <span className="text-muted-foreground">{report.landmark}</span>
            </div>
          ) : null}
          {report.road_context ? (
            <div className="text-sm">
              <span className="font-medium">Road context:</span>{" "}
              <span className="text-muted-foreground">{report.road_context}</span>
            </div>
          ) : null}
          {report.sub_type ? (
            <div className="text-sm">
              <span className="font-medium">Sub-type:</span>{" "}
              <span className="text-muted-foreground">{report.sub_type}</span>
            </div>
          ) : null}
          {report.latitude && report.longitude ? (
            <div className="text-sm text-muted-foreground">
              GPS: {Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}
            </div>
          ) : null}
          {report.description ? (
            <div className="text-sm">
              <span className="font-medium">Description:</span>{" "}
              <span className="text-muted-foreground">{report.description}</span>
            </div>
          ) : null}
          <div className="text-sm text-muted-foreground">
            Created: {new Date(report.created_at).toLocaleString()} · Updated:{" "}
            {new Date(report.updated_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update status</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportStatusUpdater
            reportId={report.id}
            currentStatus={report.status}
            allowedStatuses={[
              "submitted",
              "reviewed",
              "assigned",
              "in_progress",
              "resolved",
              "rejected",
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline (realtime)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates.length ? (
            updates.map((u) => (
              <div key={u.id} className="rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{formatStatus(u.status)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleString()}
                  </div>
                </div>
                {u.note ? <div className="mt-1 text-sm text-muted-foreground">{u.note}</div> : null}
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No updates yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


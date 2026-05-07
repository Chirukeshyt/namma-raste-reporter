"use client";

import dynamic from "next/dynamic";

const AdminMapClient = dynamic(() => import("./admin-map.client"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full overflow-hidden rounded-lg border bg-muted/30" />
  ),
});

type ReportMarker = {
  id: string;
  ticketId: string;
  issueType: string;
  severity: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
};

export function AdminMap({ reports }: { reports: ReportMarker[] }) {
  return <AdminMapClient reports={reports} />;
}


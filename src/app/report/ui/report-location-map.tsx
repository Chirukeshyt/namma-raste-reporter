"use client";

import dynamic from "next/dynamic";

const ReportLocationMapClient = dynamic(() => import("./report-location-map.client"), {
  ssr: false,
  loading: () => <div className="h-44 w-full rounded-lg border bg-muted/30" />,
});

export function ReportLocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return <ReportLocationMapClient latitude={latitude} longitude={longitude} />;
}


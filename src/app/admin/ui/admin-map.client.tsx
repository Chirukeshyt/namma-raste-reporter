"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/reports/status";

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

function FitBounds({ points }: { points: Array<{ position: LatLngExpression }> }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0].position, 16, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => p.position as any));
    map.fitBounds(bounds, { padding: [24, 24], animate: true });
  }, [map, points]);
  return null;
}

export default function AdminMapClient({ reports }: { reports: ReportMarker[] }) {
  const points = useMemo(
    () =>
      reports
        .filter(
          (r) =>
            typeof r.latitude === "number" &&
            typeof r.longitude === "number" &&
            Number.isFinite(r.latitude) &&
            Number.isFinite(r.longitude),
        )
        .map((r) => ({ ...r, position: [r.latitude!, r.longitude!] as LatLngExpression })),
    [reports],
  );

  // Fix Leaflet marker icons in Next.js (otherwise markers are "invisible").
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const center: LatLngExpression = points.length ? points[0].position : [12.9716, 77.5946];

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((r) => (
          <Marker key={r.id} position={r.position}>
            <Popup>
              <div className="space-y-2">
                <div className="font-mono font-semibold">{r.ticketId}</div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{r.issueType}</Badge>
                  <Badge variant="outline">{r.severity}</Badge>
                  <Badge>{formatStatus(r.status)}</Badge>
                </div>
                {r.address ? <div className="text-xs text-muted-foreground">{r.address}</div> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!points.length ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-lg border bg-background/80 px-3 py-2 text-sm text-muted-foreground shadow-sm">
            No GPS points found yet. Submit a report with location enabled.
          </div>
        </div>
      ) : null}
    </div>
  );
}


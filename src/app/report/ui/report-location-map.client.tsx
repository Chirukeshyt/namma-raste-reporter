"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

export default function ReportLocationMapClient({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const position: LatLngExpression = [latitude, longitude];

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="h-44 w-full overflow-hidden rounded-lg border">
      <MapContainer center={position} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}


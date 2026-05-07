import type { LatLngExpression } from "leaflet";

export type GeoPoint = { latitude: number; longitude: number };

export function toLatLng(point: GeoPoint): LatLngExpression {
  return [point.latitude, point.longitude];
}


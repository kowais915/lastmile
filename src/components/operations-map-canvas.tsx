"use client";

import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { Fragment, useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import type { MapNetworkPoint, MapRoute } from "./operations-map";

type OperationsMapCanvasProps = {
  routes: MapRoute[];
  networkPoints: MapNetworkPoint[];
  compact: boolean;
  title: string;
};

type LocatedPoint = {
  latitude: number;
  longitude: number;
};

const defaultCenter: LatLngExpression = [37.7749, -122.4194];

function hasLocation<T extends { latitude: number | null; longitude: number | null }>(point: T): point is T & LocatedPoint {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function toLocation(point: { latitude: number | null; longitude: number | null }): LocatedPoint | null {
  return hasLocation(point) ? { latitude: point.latitude, longitude: point.longitude } : null;
}

function MapViewport({ locations }: { locations: LocatedPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 13, { animate: false });
      return;
    }

    if (locations.length > 1) {
      map.fitBounds(locations.map((point) => [point.latitude, point.longitude]) as LatLngBoundsExpression, {
        padding: [32, 32],
        maxZoom: 14,
        animate: false,
      });
    }
  }, [locations, map]);

  return null;
}

export function OperationsMapCanvas({ routes, networkPoints, compact, title }: OperationsMapCanvasProps) {
  const locations: LocatedPoint[] = [
    ...networkPoints.map(toLocation),
    ...routes.flatMap((route) => [route.pickup, route.destination].map(toLocation)),
  ].filter((point): point is LocatedPoint => point !== null);

  return <div className={compact ? "h-[280px] w-full" : "h-[360px] w-full"} role="region" aria-label={`${title}. Orange markers are pickups and green markers are partners.`}>
    <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} zoomControl={!compact} className="h-full w-full bg-[#dce6d9]">
      <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapViewport locations={locations} />
      {networkPoints.filter(hasLocation).map((partner) => <CircleMarker key={`partner-${partner.id}`} center={[partner.latitude, partner.longitude]} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#287047", fillOpacity: 1 }}>
        <Popup><strong>{partner.name}</strong><p className="mt-1 text-xs text-[#536158]">{partner.detail || "Partner location"}</p></Popup>
      </CircleMarker>)}
      {routes.map((route) => {
        const pickup = hasLocation(route.pickup) ? [route.pickup.latitude, route.pickup.longitude] as LatLngExpression : null;
        const destination = hasLocation(route.destination) ? [route.destination.latitude, route.destination.longitude] as LatLngExpression : null;
        return <Fragment key={route.id}>
          {pickup ? <CircleMarker center={pickup} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#d77832", fillOpacity: 1 }}><Popup><strong>{route.pickup.name}</strong><p className="mt-1 text-xs text-[#536158]">{route.itemName} · {route.portions} meals</p></Popup></CircleMarker> : null}
          {destination ? <CircleMarker center={destination} radius={8} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#287047", fillOpacity: 1 }}><Popup><strong>{route.destination.name}</strong><p className="mt-1 text-xs text-[#536158]">{route.destination.detail || `${route.itemName} · ${route.portions} meals`}</p></Popup></CircleMarker> : null}
          {pickup && destination ? <Polyline positions={[pickup, destination]} pathOptions={{ color: "#285d3c", weight: 3, opacity: 0.82, dashArray: "7 8" }} /> : null}
        </Fragment>;
      })}
    </MapContainer>
  </div>;
}

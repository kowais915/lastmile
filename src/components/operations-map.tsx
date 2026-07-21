"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type MapPoint = {
  latitude: number | null;
  longitude: number | null;
  name: string;
  detail?: string | null;
};

export type MapRoute = {
  id: string;
  itemName: string;
  portions: number;
  status: string;
  pickup: MapPoint;
  destination: MapPoint;
};

type LeafletMap = {
  remove: () => void;
  fitBounds: (bounds: unknown, options?: { padding?: [number, number]; maxZoom?: number }) => void;
  invalidateSize: () => void;
};

type LeafletLayer = { addTo: (map: LeafletMap) => LeafletLayer };

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: HTMLElement) => LeafletMarker;
};

type LeafletNamespace = {
  map: (element: HTMLElement, options: { zoomControl: boolean; attributionControl: boolean }) => LeafletMap;
  tileLayer: (url: string, options: { maxZoom: number; attribution: string }) => LeafletLayer;
  circleMarker: (location: [number, number], options: { radius: number; color: string; weight: number; fillColor: string; fillOpacity: number }) => LeafletMarker;
  polyline: (locations: Array<[number, number]>, options: { color: string; weight: number; opacity: number; dashArray: string }) => LeafletLayer;
  latLngBounds: (locations: Array<[number, number]>) => unknown;
};

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

function hasLocation(point: MapPoint): point is MapPoint & { latitude: number; longitude: number } {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function popup(title: string, detail: string | null | undefined, itemName: string, portions: number) {
  const container = document.createElement("div");
  container.style.minWidth = "150px";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const description = document.createElement("p");
  description.textContent = detail || `${itemName} · ${portions} meals`;
  description.style.margin = "4px 0 0";
  description.style.color = "#536158";
  description.style.fontSize = "12px";
  container.append(heading, description);
  return container;
}

export function OperationsMap({ routes, title = "Live route map" }: { routes: MapRoute[]; title?: string }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [libraryReady, setLibraryReady] = useState(false);
  const mappedRoutes = routes.filter((route) => hasLocation(route.pickup) || hasLocation(route.destination));

  useEffect(() => {
    if (!libraryReady || !mapElement.current || map.current || !window.L) return;

    const leaflet = window.L;
    const locations: Array<[number, number]> = [];
    const instance = leaflet.map(mapElement.current, { zoomControl: false, attributionControl: false });
    leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(instance);

    for (const route of mappedRoutes) {
      const pickupPoint = hasLocation(route.pickup) ? [route.pickup.latitude, route.pickup.longitude] as [number, number] : null;
      const destinationPoint = hasLocation(route.destination) ? [route.destination.latitude, route.destination.longitude] as [number, number] : null;

      if (pickupPoint) {
        locations.push(pickupPoint);
        leaflet.circleMarker(pickupPoint, { radius: 8, color: "#ffffff", weight: 3, fillColor: "#d77832", fillOpacity: 1 })
          .addTo(instance)
          .bindPopup(popup(route.pickup.name, route.itemName, route.itemName, route.portions));
      }
      if (destinationPoint) {
        locations.push(destinationPoint);
        leaflet.circleMarker(destinationPoint, { radius: 8, color: "#ffffff", weight: 3, fillColor: "#287047", fillOpacity: 1 })
          .addTo(instance)
          .bindPopup(popup(route.destination.name, route.destination.detail, route.itemName, route.portions));
      }
      if (pickupPoint && destinationPoint) {
        leaflet.polyline([pickupPoint, destinationPoint], { color: "#285d3c", weight: 3, opacity: 0.8, dashArray: "7 8" }).addTo(instance);
      }
    }

    if (locations.length) instance.fitBounds(leaflet.latLngBounds(locations), { padding: [42, 42], maxZoom: 14 });
    map.current = instance;
    const resizeObserver = new ResizeObserver(() => instance.invalidateSize());
    resizeObserver.observe(mapElement.current);

    return () => {
      resizeObserver.disconnect();
      instance.remove();
      map.current = null;
    };
  }, [libraryReady, mappedRoutes]);

  if (!mappedRoutes.length) {
    return <section className="rounded-[1.75rem] border border-dashed border-[#cfd8d0] bg-[#f8faf6] p-6 text-center"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">ROUTE MAP</p><h2 className="mt-2 text-xl font-semibold">{title}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#68776d]">This workspace has no handoffs with pickup and destination coordinates yet.</p></section>;
  }

  return <section className="overflow-hidden rounded-[1.75rem] border border-[#e2e2d9] bg-white shadow-sm">
    <Script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossOrigin="" strategy="afterInteractive" onLoad={() => setLibraryReady(true)} />
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">LIVE ROUTES</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2></div><div className="flex gap-3 text-xs font-semibold text-[#52675a]"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#d77832] ring-2 ring-[#f4dfd2]" />Pickup</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#287047] ring-2 ring-[#d7eadc]" />Destination</span></div></div>
    <div ref={mapElement} role="region" aria-label={`${title}. Orange markers are pickups and green markers are destinations.`} className="h-[360px] w-full bg-[#dce6d9]" />
    <p className="border-t border-[#eef0eb] px-6 py-3 text-xs text-[#68776d]">Route lines are operational context, not turn-by-turn navigation. Map data © OpenStreetMap contributors.</p>
  </section>;
}

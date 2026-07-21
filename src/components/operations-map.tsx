"use client";

import dynamic from "next/dynamic";

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

export type MapNetworkPoint = MapPoint & {
  id: string;
};

type OperationsMapProps = {
  routes: MapRoute[];
  networkPoints?: MapNetworkPoint[];
  title?: string;
  compact?: boolean;
};

const OperationsMapCanvas = dynamic(
  () => import("./operations-map-canvas").then((module) => module.OperationsMapCanvas),
  {
    ssr: false,
    loading: () => <div className="h-[360px] w-full animate-pulse bg-[#e7eee4]" aria-label="Loading map" />,
  },
);

function hasLocation(point: MapPoint): point is MapPoint & { latitude: number; longitude: number } {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

export function OperationsMap({ routes, networkPoints = [], title = "Live route map", compact = false }: OperationsMapProps) {
  const mappedRoutes = routes.filter((route) => hasLocation(route.pickup) || hasLocation(route.destination));
  const mappedNetworkPoints = networkPoints.filter(hasLocation);

  if (!mappedRoutes.length && !mappedNetworkPoints.length) {
    return <section className="rounded-[1.75rem] border border-dashed border-[#cfd8d0] bg-[#f8faf6] p-5 shadow-sm sm:p-6"><div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e7f0e6] text-xl text-[#285d3c]" aria-hidden="true">⌖</div><div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">ROUTE MAP</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#68776d]">Add pickup and partner locations to reveal the rescue network and active handoffs.</p></div><span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#52675a]">No mapped locations</span></div></section>;
  }

  return <section className="overflow-hidden rounded-[1.75rem] border border-[#e2e2d9] bg-white shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">RESCUE NETWORK</p><h2 className="mt-2 text-2xl font-semibold">{title}</h2></div><div className="flex flex-wrap gap-3 text-xs font-semibold text-[#52675a]"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#d77832] ring-2 ring-[#f4dfd2]" />Pickup</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded-full bg-[#287047] ring-2 ring-[#d7eadc]" />Partner</span></div></div>
    <OperationsMapCanvas routes={mappedRoutes} networkPoints={mappedNetworkPoints} compact={compact} title={title} />
    <p className="border-t border-[#eef0eb] px-6 py-3 text-xs text-[#68776d]">Route lines are operational context, not turn-by-turn navigation. Map data © OpenStreetMap contributors.</p>
  </section>;
}

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface PlanPin {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: string;
  scheduledAt: string;
}

interface MapViewProps {
  plans: PlanPin[];
}

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView({ plans }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [10.1815, 36.8065],
      zoom: 5,
    });

    map.on("load", () => { map.resize(); });
    setTimeout(() => { map.resize(); }, 100);
    map.on("error", (e) => console.error("MapLibre error:", e));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (plans.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    const color = "#3b82f6";

    for (const plan of plans) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:20px;height:20px;background:" +
        color +
        ";border:3px solid #fff;border-radius:50%;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.3);";

      const popup = new maplibregl.Popup({ offset: 35 });
      const container = document.createElement("div");
      container.style.cssText =
        "display:flex;flex-direction:column;gap:6px;font-size:16px;";

      const title = document.createElement("strong");
      title.textContent = plan.title;
      container.appendChild(title);

      const status = document.createElement("span");
      status.textContent = plan.status;
      status.style.cssText = "font-size:14px;color:#666;";
      container.appendChild(status);

      const date = document.createElement("span");
      date.textContent = new Date(plan.scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      date.style.cssText = "font-size:14px;color:#666;";
      container.appendChild(date);

      const link = document.createElement("a");
      link.href = `/plans/${plan.id}`;
      link.textContent = "View details";
      link.style.cssText =
        "font-size:14px;color:#0066cc;text-decoration:underline;margin-top:2px;";
      container.appendChild(link);

      popup.setDOMContent(container);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([plan.longitude, plan.latitude])
        .setPopup(popup)
        .addTo(map);

      bounds.extend([plan.longitude, plan.latitude]);
      markersRef.current.push(marker);
    }

    if (plans.length > 0) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [plans]);

  return <div ref={containerRef} className="flex-1 w-full overflow-hidden" />;
}

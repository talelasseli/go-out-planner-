import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface PlanPin {
  id: string;
  title: string;
  place: string;
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

      const popup = new maplibregl.Popup({ offset: 35, className: "plan-map-popup-shell" });
      const container = document.createElement("div");
      container.className = "plan-map-popup-card";

      const header = document.createElement("div");
      header.className = "plan-map-popup-header";

      const titleEl = document.createElement("span");
      titleEl.className = "plan-map-popup-title";
      titleEl.textContent = plan.title;
      header.appendChild(titleEl);

      const statusClass = plan.status === "ACTIVE" ? "active" : "cancelled";
      const badge = document.createElement("span");
      badge.className = "plan-map-popup-badge " + statusClass;
      badge.textContent = plan.status;
      header.appendChild(badge);

      container.appendChild(header);

      const body = document.createElement("div");
      body.className = "plan-map-popup-body";

      const placeRow = document.createElement("div");
      placeRow.className = "plan-map-popup-row";
      const placeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      placeIcon.setAttribute("viewBox", "0 0 24 24");
      placeIcon.setAttribute("fill", "none");
      placeIcon.setAttribute("stroke", "currentColor");
      placeIcon.setAttribute("stroke-width", "2");
      placeIcon.setAttribute("stroke-linecap", "round");
      placeIcon.setAttribute("stroke-linejoin", "round");
      placeIcon.classList.add("plan-map-popup-icon");
      placeIcon.innerHTML = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
      placeRow.appendChild(placeIcon);
      const placeText = document.createElement("span");
      placeText.textContent = plan.place;
      placeRow.appendChild(placeText);
      body.appendChild(placeRow);

      const dateRow = document.createElement("div");
      dateRow.className = "plan-map-popup-row";
      const calIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      calIcon.setAttribute("viewBox", "0 0 24 24");
      calIcon.setAttribute("fill", "none");
      calIcon.setAttribute("stroke", "currentColor");
      calIcon.setAttribute("stroke-width", "2");
      calIcon.setAttribute("stroke-linecap", "round");
      calIcon.setAttribute("stroke-linejoin", "round");
      calIcon.classList.add("plan-map-popup-icon");
      calIcon.innerHTML = '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>';
      dateRow.appendChild(calIcon);
      const dateText = document.createElement("span");
      dateText.textContent = new Date(plan.scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      dateRow.appendChild(dateText);
      body.appendChild(dateRow);

      container.appendChild(body);

      const link = document.createElement("a");
      link.className = "plan-map-popup-link";
      link.href = "/plans/" + plan.id;
      link.textContent = "View details \u2192";
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

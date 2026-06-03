import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onPick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [10.1815, 36.8065];
const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapPicker({ latitude, longitude, onPick }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: 5,
    });

    map.on("click", (e) => {
      onPickRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude != null && longitude != null) {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = new maplibregl.Marker()
        .setLngLat([longitude, latitude])
        .addTo(map);
      map.flyTo({ center: [longitude, latitude], zoom: 10, duration: 800 });
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [latitude, longitude]);

  return <div ref={containerRef} className="h-64 w-full rounded-lg border" />;
}

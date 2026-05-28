import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function MapView({
  latitude,
  longitude,
  place,
  containerClassName = "h-48 rounded-lg overflow-hidden border",
}: {
  latitude: number | null;
  longitude: number | null;
  place: string;
  containerClassName?: string;
}) {
  if (latitude == null || longitude == null) return null;

  return (
    <div className={containerClassName}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        keyboard={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} title={place} icon={defaultIcon} />
      </MapContainer>
    </div>
  );
}

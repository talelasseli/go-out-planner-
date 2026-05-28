import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
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

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapPickerProps {
  place: string;
  latitude: number | null;
  longitude: number | null;
  onPlaceChange: (place: string) => void;
  onLatLngChange: (lat: number | null, lng: number | null) => void;
}

function SearchBox({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (result: NominatimResult) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = async (q: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GoOutPlanner/1.0",
          },
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      // ignore network errors
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value.trim().length >= 3) search(value.trim());
    }, 400);
  };

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setOpen(false);
    onSelect(result);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search for a place..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && (
        <ul className="absolute z-[9999] w-full bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(r)}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b last:border-0"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable
      icon={defaultIcon}
      eventHandlers={eventHandlers}
    />
  );
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 0.5 });
  }, [lat, lng, map]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

export default function MapPicker({
  place,
  latitude,
  longitude,
  onPlaceChange,
  onLatLngChange,
}: MapPickerProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    latitude != null && longitude != null ? [latitude, longitude] : null,
  );
  const [address, setAddress] = useState(place);
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  useEffect(() => {
    setAddress(place);
  }, [place]);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setMarkerPos([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (!markerPos) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserCenter(loc);
          setFlyTo(loc);
        },
        () => {},
        { timeout: 5000 },
      );
    }
  }, []);

  const handleSearchSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPos([lat, lng]);
    setAddress(result.display_name);
    onPlaceChange(result.display_name);
    onLatLngChange(lat, lng);
    setFlyTo([lat, lng]);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GoOutPlanner/1.0",
          },
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
        onPlaceChange(data.display_name);
      }
    } catch {
      // ignore network errors
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    onLatLngChange(lat, lng);
    reverseGeocode(lat, lng);
  };

  const handleMarkerDragEnd = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    onLatLngChange(lat, lng);
    reverseGeocode(lat, lng);
  };

  const center = markerPos || userCenter || DEFAULT_CENTER;

  return (
    <div className="space-y-2">
      <SearchBox value={address} onSelect={handleSearchSelect} />

      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={markerPos ? 15 : 2}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {markerPos && (
            <DraggableMarker
              position={markerPos}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
          {flyTo && (
            <FlyToLocation
              key={`${flyTo[0]}-${flyTo[1]}`}
              lat={flyTo[0]}
              lng={flyTo[1]}
            />
          )}
        </MapContainer>
      </div>

      {address && (
        <p className="text-xs text-gray-500 px-1">{address}</p>
      )}
    </div>
  );
}

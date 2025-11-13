"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// India center coordinates
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 68.0], // Southwest
  [35.5, 97.5], // Northeast
];

interface CropMapProps {
  onPolygonDrawn: (polygon: Array<[number, number]>) => void;
  initialPolygon?: Array<[number, number]>;
}

// Component to set up drawing controls
function DrawingControls({ onPolygonDrawn }: { onPolygonDrawn: (polygon: Array<[number, number]>) => void }) {
  const map = useMap();
  const drawnLayersRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

  useEffect(() => {
    if (!map) return;

    // Add drawn layers to map
    map.addLayer(drawnLayersRef.current);

    // Create draw control - only allow polygon drawing
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.2,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnLayersRef.current,
        remove: true,
      },
    });

    map.addControl(drawControl);

    // Handle polygon creation
    const handleDrawCreate = (e: L.DrawEvents.Created) => {
      const layer = e.layer;
      drawnLayersRef.current.addLayer(layer);

      // Extract polygon coordinates
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates: Array<[number, number]> = latlngs.map((ll) => [
          ll.lat,
          ll.lng,
        ]);

        // Validate all coordinates are within India
        const allInIndia = coordinates.every(
          ([lat, lng]) => lat >= 6.5 && lat <= 35.5 && lng >= 68.0 && lng <= 97.5
        );

        if (allInIndia && coordinates.length >= 3) {
          onPolygonDrawn(coordinates);
        } else {
          alert("Please draw a polygon entirely within India boundaries with at least 3 points.");
          map.removeLayer(layer);
        }
      }
    };

    // Handle polygon deletion
    const handleDrawDeleted = () => {
      drawnLayersRef.current.clearLayers();
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreate);
    map.on(L.Draw.Event.DELETED, handleDrawDeleted);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreate);
      map.off(L.Draw.Event.DELETED, handleDrawDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnLayersRef.current);
    };
  }, [map, onPolygonDrawn]);

  return null;
}

export function CropMap({ onPolygonDrawn, initialPolygon }: CropMapProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]> | null>(
    initialPolygon || null
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePolygonDrawn = (coords: Array<[number, number]>) => {
    setPolygon(coords);
    onPolygonDrawn(coords);
  };

  if (!isClient) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  // Calculate center from polygon if available
  const mapCenter = polygon
    ? [
        polygon.reduce((sum, [lat]) => sum + lat, 0) / polygon.length,
        polygon.reduce((sum, [, lng]) => sum + lng, 0) / polygon.length,
      ] as [number, number]
    : INDIA_CENTER;

  return (
    <div className="w-full rounded-lg border overflow-hidden">
      <div className="bg-blue-50 border-b p-3">
        <p className="text-sm text-gray-700">
          <strong>Draw a polygon</strong> on the map to select a region in India for crop data analysis.
          <br />
          <span className="text-xs text-gray-600">
            Use the drawing tool (top-right) to create a polygon. Click to add points, double-click to finish.
          </span>
        </p>
      </div>
      <MapContainer
        center={mapCenter}
        zoom={polygon ? 8 : 5}
        style={{ height: "500px", width: "100%" }}
        maxBounds={INDIA_BOUNDS}
        minZoom={4}
        maxZoom={15}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawingControls onPolygonDrawn={handlePolygonDrawn} />
        {polygon && (
          <PolygonDisplay coordinates={polygon} />
        )}
      </MapContainer>
      {polygon && (
        <div className="bg-green-50 border-t p-3">
          <p className="text-sm text-green-700">
            ✓ Polygon drawn with {polygon.length} points. Ready to fetch crop data!
          </p>
        </div>
      )}
    </div>
  );
}

// Component to display the drawn polygon
function PolygonDisplay({ coordinates }: { coordinates: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    const polygon = L.polygon(
      coordinates.map(([lat, lng]) => [lat, lng]),
      {
        color: "#3388ff",
        fillColor: "#3388ff",
        fillOpacity: 0.2,
        weight: 2,
      }
    );

    polygon.addTo(map);
    map.fitBounds(polygon.getBounds());

    return () => {
      map.removeLayer(polygon);
    };
  }, [coordinates, map]);

  return null;
}


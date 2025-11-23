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
  showBoundaries?: boolean;
  showCropNames?: boolean;
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
    const handleDrawCreate = (e: L.LeafletEvent) => {
      const drawEvent = e as L.DrawEvents.Created;
      const layer = drawEvent.layer;
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

export function CropMap({ onPolygonDrawn, initialPolygon, showBoundaries = false, showCropNames = false }: CropMapProps) {
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

  // Calculate center from polygon if available, or use bounding box center if showing boundaries
  const boundingBox: [number, number, number, number] = [
    73.7958302,   // minLng (west)
    20.20577614,  // minLat (south)
    73.8038351,   // maxLng (east)
    20.21390921,  // maxLat (north)
  ];
  
  const boundingBoxCenter: [number, number] = [
    (boundingBox[1] + boundingBox[3]) / 2, // centerLat
    (boundingBox[0] + boundingBox[2]) / 2, // centerLng
  ];
  
  const mapCenter = polygon
    ? [
        polygon.reduce((sum, [lat]) => sum + lat, 0) / polygon.length,
        polygon.reduce((sum, [, lng]) => sum + lng, 0) / polygon.length,
      ] as [number, number]
    : showBoundaries
      ? boundingBoxCenter
      : INDIA_CENTER;
  
  const mapZoom = polygon ? 8 : showBoundaries ? 15 : 5;

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
        zoom={mapZoom}
        style={{ height: "500px", width: "100%" }}
        maxBounds={INDIA_BOUNDS}
        minZoom={4}
        maxZoom={20}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <DrawingControls onPolygonDrawn={handlePolygonDrawn} />
        <GeoJSONBoundaries showBoundaries={showBoundaries} showCropNames={showCropNames} />
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

// Function to get a consistent color for a crop type
function getCropColor(cropName: string): string {
  // Create a simple hash function to get consistent colors
  let hash = 0;
  for (let i = 0; i < cropName.length; i++) {
    hash = cropName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a color from the hash
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Function to get a darker version for borders
function getCropBorderColor(cropName: string): string {
  const color = getCropColor(cropName);
  // Extract HSL values and darken
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const [, h, s, l] = match;
    const darkerL = Math.max(20, parseInt(l) - 20);
    return `hsl(${h}, ${s}%, ${darkerL}%)`;
  }
  return color;
}

// Component to display GeoJSON boundaries with hover effects
function GeoJSONBoundaries({ showBoundaries, showCropNames = false }: { showBoundaries: boolean; showCropNames?: boolean }) {
  const map = useMap();
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hoverLayerRef = useRef<L.Polygon | null>(null);
  const labelMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!map || !showBoundaries) return;

    // Load GeoJSON data
    const loadGeoJSON = async () => {
      try {
        const response = await fetch("/in.geojson");
        const geoJsonData = await response.json();

        // Create GeoJSON layer with custom styling
        const geoJsonLayer = L.geoJSON(geoJsonData, {
          style: (feature) => {
            if (!feature || !feature.properties) {
              return {
                color: "#666",
                fillColor: "#e0e0e0",
                fillOpacity: 0.3,
                weight: 1,
                opacity: 0.6,
              };
            }
            
            const crop = feature.properties.crop || "Unknown";
            const cropColor = getCropColor(crop);
            const borderColor = getCropBorderColor(crop);
            
            return {
              color: borderColor,
              fillColor: cropColor,
              fillOpacity: 0.4,
              weight: 1.5,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            // Store feature reference on layer for later access
            (layer as any).feature = feature;
            
            // Add hover effects
            layer.on({
              mouseover: (e) => {
                const targetLayer = e.target;
                
                // Create highlight layer with crop color
                if (targetLayer instanceof L.Polygon) {
                  const latlngs = targetLayer.getLatLngs();
                  // Handle both single polygon and nested arrays
                  const coordinates = Array.isArray(latlngs[0]) && latlngs[0][0] instanceof L.LatLng
                    ? latlngs[0] as L.LatLng[]
                    : latlngs as L.LatLng[];
                  
                  // Get crop color from the stored feature
                  const storedFeature = (targetLayer as any).feature;
                  if (!storedFeature) return;
                  
                  const crop = storedFeature.properties?.crop || "Unknown";
                  const cropColor = getCropColor(crop);
                  const borderColor = getCropBorderColor(crop);
                  
                  hoverLayerRef.current = L.polygon(coordinates, {
                    color: borderColor,
                    fillColor: cropColor,
                    fillOpacity: 0.7,
                    weight: 3,
                    opacity: 1,
                  });
                  hoverLayerRef.current.addTo(map);
                }

                // Update cursor and style
                targetLayer.setStyle({
                  weight: 2,
                  opacity: 1,
                });
              },
              mouseout: (e) => {
                const targetLayer = e.target;
                
                // Remove blue highlight layer
                if (hoverLayerRef.current) {
                  map.removeLayer(hoverLayerRef.current);
                  hoverLayerRef.current = null;
                }

                // Reset style to original crop color
                const storedFeature = (targetLayer as any).feature;
                if (!storedFeature) return;
                
                const crop = storedFeature.properties?.crop || "Unknown";
                const cropColor = getCropColor(crop);
                const borderColor = getCropBorderColor(crop);
                
                targetLayer.setStyle({
                  color: borderColor,
                  fillColor: cropColor,
                  fillOpacity: 0.4,
                  weight: 1.5,
                  opacity: 0.8,
                });
              },
            });

            // Add popup with crop information if available
            if (feature.properties) {
              const props = feature.properties;
              const crop = props.crop || "Unknown";
              const area = props.area ? `${props.area.toFixed(2)} hectares` : "N/A";
              layer.bindPopup(`<strong>Crop:</strong> ${crop}<br/><strong>Area:</strong> ${area}`);

              // Add crop name label if showCropNames is true
              if (showCropNames && layer instanceof L.Polygon) {
                const latlngs = layer.getLatLngs();
                const coordinates = Array.isArray(latlngs[0]) && latlngs[0][0] instanceof L.LatLng
                  ? latlngs[0] as L.LatLng[]
                  : latlngs as L.LatLng[];

                // Calculate centroid of the polygon
                let sumLat = 0;
                let sumLng = 0;
                coordinates.forEach((ll) => {
                  sumLat += ll.lat;
                  sumLng += ll.lng;
                });
                const centerLat = sumLat / coordinates.length;
                const centerLng = sumLng / coordinates.length;

                // Get crop color for the label
                const cropColor = getCropColor(crop);
                const borderColor = getCropBorderColor(crop);

                // Create a custom icon with the crop name in crop color
                const labelIcon = L.divIcon({
                  className: "crop-label",
                  html: `<div style="
                    background: ${cropColor};
                    border: 2px solid ${borderColor};
                    border-radius: 4px;
                    padding: 3px 8px;
                    font-size: 11px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                    pointer-events: none;
                  ">${crop}</div>`,
                  iconSize: [120, 24],
                  iconAnchor: [60, 12],
                });

                const labelMarker = L.marker([centerLat, centerLng], {
                  icon: labelIcon,
                  interactive: false,
                  zIndexOffset: 1000,
                });

                labelMarker.addTo(map);
                labelMarkersRef.current.push(labelMarker);
              }
            }
          },
        });

        geoJsonLayer.addTo(map);
        geoJsonLayerRef.current = geoJsonLayer;

        // Zoom to specific bounding box: [minLng, minLat, maxLng, maxLat]
        // [73.7958302, 20.20577614, 73.8038351, 20.21390921]
        const boundingBox: [number, number, number, number] = [
          73.7958302,   // minLng (west)
          20.20577614,  // minLat (south)
          73.8038351,   // maxLng (east)
          20.21390921,  // maxLat (north)
        ];

        // Calculate center of bounding box
        const centerLat = (boundingBox[1] + boundingBox[3]) / 2;
        const centerLng = (boundingBox[0] + boundingBox[2]) / 2;

        // Zoom to center of bounding box at zoom level 15
        // Use whenReady to ensure map is fully initialized
        map.whenReady(() => {
          map.setView([centerLat, centerLng], 15, { animate: false });
        });
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadGeoJSON();

    return () => {
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }
      if (hoverLayerRef.current) {
        map.removeLayer(hoverLayerRef.current);
        hoverLayerRef.current = null;
      }
      // Remove all label markers
      labelMarkersRef.current.forEach((marker) => {
        map.removeLayer(marker);
      });
      labelMarkersRef.current = [];
    };
  }, [map, showBoundaries, showCropNames]);

  return null;
}


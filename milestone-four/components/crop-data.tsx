"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const CropMap = dynamic(() => import("./crop-map").then((mod) => ({ default: mod.CropMap })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

type CropDataResponse = {
  crops: Array<{
    name: string;
    area: number;
    percentage: number;
    season?: string;
  }>;
  location: {
    latitude: number;
    longitude: number;
    polygon?: Array<[number, number]>;
  };
  metadata?: {
    year?: string;
    source?: string;
  };
};

type CropDataProps = {
  toolCallId?: string;
  onDataFetched?: (data: CropDataResponse) => void;
  initialData?: CropDataResponse;
};

export function CropData({ toolCallId, onDataFetched, initialData }: CropDataProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]> | null>(
    initialData?.location.polygon || null
  );
  const [cropData, setCropData] = useState<CropDataResponse | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePolygonDrawn = (coords: Array<[number, number]>) => {
    setPolygon(coords);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!polygon || polygon.length < 3) {
      setError("Please draw a polygon with at least 3 points");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/crop-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ polygon }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch crop data" }));
        throw new Error(errorData.error || "Failed to fetch crop data");
      }

      const data = await response.json();
      setCropData(data);
      if (onDataFetched) {
        onDataFetched(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (cropData) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-lg font-semibold mb-4">Crop Data for Selected Region</h3>
          <div className="mb-4 text-sm text-gray-600">
            {cropData.location.polygon ? (
              <p>
                Polygon area with {cropData.location.polygon.length} points
                <br />
                <span className="text-xs">
                  Center: {cropData.location.latitude.toFixed(4)}°, {cropData.location.longitude.toFixed(4)}°
                </span>
              </p>
            ) : (
              <p>
                Location: {cropData.location.latitude.toFixed(4)}°, {cropData.location.longitude.toFixed(4)}°
              </p>
            )}
            {cropData.metadata?.year && (
              <p>Year: {cropData.metadata.year}</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Crops in this region:</h4>
            <div className="grid gap-3">
              {cropData.crops.map((crop, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{crop.name}</p>
                    {crop.season && (
                      <p className="text-sm text-gray-500">Season: {crop.season}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {crop.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {crop.area.toFixed(2)} hectares
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <CropMap
            onPolygonDrawn={handlePolygonDrawn}
            initialPolygon={cropData.location.polygon || polygon || undefined}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setCropData(null);
              setPolygon(null);
              setError(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Draw New Polygon
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <CropMap onPolygonDrawn={handlePolygonDrawn} />
      
      {polygon && polygon.length >= 3 && (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Polygon drawn with {polygon.length} points
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click submit to fetch crop data for this area
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Fetching..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Fetching crop data from Google Earth Engine...</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border bg-red-50 p-4">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      )}
    </div>
  );
}


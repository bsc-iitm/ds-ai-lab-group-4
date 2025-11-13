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

type NDVIDataResponse = {
  ndvi: {
    mean: number;
    min: number;
    max: number;
    stdDev: number;
  };
  vegetationHealth: {
    status: "excellent" | "good" | "moderate" | "poor" | "very_poor";
    description: string;
    percentage: number;
  };
  location: {
    latitude: number;
    longitude: number;
    polygon?: Array<[number, number]>;
  };
  metadata?: {
    dateRange?: {
      start: string;
      end: string;
    };
    source?: string;
    satellite?: string;
    resolution?: string;
  };
};

type NDVIProps = {
  toolCallId?: string;
  onDataFetched?: (data: NDVIDataResponse) => void;
  initialData?: NDVIDataResponse;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return "bg-green-100 text-green-800 border-green-300";
    case "good":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "poor":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "very_poor":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getNDVIColor = (ndvi: number) => {
  if (ndvi >= 0.6) return "text-green-600";
  if (ndvi >= 0.4) return "text-blue-600";
  if (ndvi >= 0.2) return "text-yellow-600";
  if (ndvi >= 0.0) return "text-orange-600";
  return "text-red-600";
};

export function NDVI({ toolCallId, onDataFetched, initialData }: NDVIProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]> | null>(
    initialData?.location.polygon || null
  );
  const [ndviData, setNdviData] = useState<NDVIDataResponse | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
      const body: { polygon: Array<[number, number]>; startDate?: string; endDate?: string } = {
        polygon,
      };
      
      if (startDate) {
        body.startDate = startDate;
      }
      if (endDate) {
        body.endDate = endDate;
      }

      const response = await fetch("/api/ndvi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch NDVI data" }));
        throw new Error(errorData.error || "Failed to fetch NDVI data");
      }

      const data = await response.json();
      setNdviData(data);
      if (onDataFetched) {
        onDataFetched(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (ndviData) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-lg font-semibold mb-4">Vegetation Health Analysis (NDVI)</h3>
          
          <div className="mb-4 text-sm text-gray-600 space-y-1">
            {ndviData.location.polygon ? (
              <p>
                Polygon area with {ndviData.location.polygon.length} points
                <br />
                <span className="text-xs">
                  Center: {ndviData.location.latitude.toFixed(4)}°, {ndviData.location.longitude.toFixed(4)}°
                </span>
              </p>
            ) : (
              <p>
                Location: {ndviData.location.latitude.toFixed(4)}°, {ndviData.location.longitude.toFixed(4)}°
              </p>
            )}
            {ndviData.metadata?.dateRange && (
              <p>
                Date Range: {ndviData.metadata.dateRange.start} to {ndviData.metadata.dateRange.end}
              </p>
            )}
            {ndviData.metadata?.satellite && (
              <p className="text-xs text-gray-500">
                Source: {ndviData.metadata.satellite} ({ndviData.metadata.resolution})
              </p>
            )}
          </div>

          {/* NDVI Statistics */}
          <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
            <h4 className="font-medium text-gray-700 mb-2">NDVI Statistics</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Mean NDVI</p>
                <p className={`text-lg font-semibold ${getNDVIColor(ndviData.ndvi.mean)}`}>
                  {ndviData.ndvi.mean.toFixed(3)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Range</p>
                <p className="text-sm font-medium text-gray-700">
                  {ndviData.ndvi.min.toFixed(3)} - {ndviData.ndvi.max.toFixed(3)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Std Deviation</p>
                <p className="text-sm font-medium text-gray-700">
                  {ndviData.ndvi.stdDev.toFixed(3)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Health Status</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                    ndviData.vegetationHealth.status
                  )}`}
                >
                  {ndviData.vegetationHealth.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Vegetation Health */}
          <div className="mb-4 p-3 rounded-lg border bg-gradient-to-r from-gray-50 to-white">
            <h4 className="font-medium text-gray-700 mb-2">Vegetation Health Assessment</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{ndviData.vegetationHealth.description}</p>
                <p className="text-lg font-bold text-blue-600">
                  {ndviData.vegetationHealth.percentage.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    ndviData.vegetationHealth.status === "excellent"
                      ? "bg-green-500"
                      : ndviData.vegetationHealth.status === "good"
                      ? "bg-blue-500"
                      : ndviData.vegetationHealth.status === "moderate"
                      ? "bg-yellow-500"
                      : ndviData.vegetationHealth.status === "poor"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${ndviData.vegetationHealth.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* NDVI Scale Reference */}
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 text-sm">NDVI Scale Reference</h4>
            <div className="space-y-1 text-xs text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>-1.0 to 0.0: Water, built-up areas, barren</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>0.0 to 0.2: Bare soil, rocks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>0.2 to 0.4: Sparse vegetation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>0.4 to 0.6: Moderate vegetation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>0.6 to 1.0: Dense, healthy vegetation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <CropMap
            onPolygonDrawn={handlePolygonDrawn}
            initialPolygon={ndviData.location.polygon || polygon || undefined}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => {
              setNdviData(null);
              setPolygon(null);
              setError(null);
              setStartDate("");
              setEndDate("");
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
      
      {/* Date Range Selection */}
      <div className="rounded-lg border bg-white p-4">
        <h4 className="font-medium text-gray-700 mb-3">Optional: Date Range</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Leave empty to use default (last 3 months). Dates are optional.
        </p>
      </div>
      
      {polygon && polygon.length >= 3 && (
        <div className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Polygon drawn with {polygon.length} points
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click submit to fetch NDVI data for this area
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Fetching..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-green-50 p-4">
          <p className="text-sm text-green-700">Fetching NDVI data from Google Earth Engine...</p>
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


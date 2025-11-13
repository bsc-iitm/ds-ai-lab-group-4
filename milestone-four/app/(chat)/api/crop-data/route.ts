import { NextResponse } from "next/server";
import { fetchCropDataFromGEE } from "@/lib/gee/client";

// India approximate bounds
const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 35.5,
  minLon: 68.0,
  maxLon: 97.5,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { polygon } = body;

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return NextResponse.json(
        { error: "Polygon with at least 3 points is required" },
        { status: 400 }
      );
    }

    // Validate all coordinates are within India
    const allInIndia = polygon.every(
      ([lat, lng]: [number, number]) =>
        lat >= INDIA_BOUNDS.minLat &&
        lat <= INDIA_BOUNDS.maxLat &&
        lng >= INDIA_BOUNDS.minLon &&
        lng <= INDIA_BOUNDS.maxLon
    );

    if (!allInIndia) {
      return NextResponse.json(
        { error: "Polygon must be entirely within India bounds" },
        { status: 400 }
      );
    }

    // Fetch crop data from Google Earth Engine using polygon
    const cropData = await fetchCropDataFromGEE(polygon);

    return NextResponse.json(cropData);
  } catch (error) {
    console.error("Error fetching crop data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch crop data from Google Earth Engine",
      },
      { status: 500 }
    );
  }
}

// Keep GET for backward compatibility (uses center point of polygon)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "");
    const longitude = parseFloat(searchParams.get("longitude") || "");

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Validate coordinates are within India
    if (
      latitude < INDIA_BOUNDS.minLat ||
      latitude > INDIA_BOUNDS.maxLat ||
      longitude < INDIA_BOUNDS.minLon ||
      longitude > INDIA_BOUNDS.maxLon
    ) {
      return NextResponse.json(
        { error: "Location is outside India bounds" },
        { status: 400 }
      );
    }

    // Create a small polygon around the point for backward compatibility
    const polygon: Array<[number, number]> = [
      [latitude - 0.05, longitude - 0.05],
      [latitude + 0.05, longitude - 0.05],
      [latitude + 0.05, longitude + 0.05],
      [latitude - 0.05, longitude + 0.05],
      [latitude - 0.05, longitude - 0.05],
    ];

    const cropData = await fetchCropDataFromGEE(polygon);

    return NextResponse.json(cropData);
  } catch (error) {
    console.error("Error fetching crop data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch crop data from Google Earth Engine",
      },
      { status: 500 }
    );
  }
}


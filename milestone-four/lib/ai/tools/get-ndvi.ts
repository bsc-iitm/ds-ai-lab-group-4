import { tool } from "ai";
import { z } from "zod";

export const getNDVI = tool({
  description: "Get NDVI (Normalized Difference Vegetation Index) data for vegetation analysis in a region in India. NDVI measures vegetation health and density. When a user asks about vegetation, NDVI, plant health, or crop health in a region, automatically show a map for them to place a pin or draw a polygon. After they place a pin or draw a polygon, fetch NDVI data from Google Earth Engine for that location. Only works for locations within India. Always start with action 'show_map' when user asks about vegetation or NDVI.",
  inputSchema: z.object({
    action: z.enum(["show_map", "fetch_data"]).describe("Action to take: 'show_map' to display the map for polygon drawing (use this when user first asks about vegetation/NDVI), 'fetch_data' to get NDVI data after polygon is drawn"),
    polygon: z.array(z.tuple([z.number(), z.number()])).optional().describe("Array of [latitude, longitude] coordinates forming a polygon (required for fetch_data)"),
    startDate: z.string().optional().describe("Start date for NDVI analysis in YYYY-MM-DD format (optional, defaults to 3 months ago)"),
    endDate: z.string().optional().describe("End date for NDVI analysis in YYYY-MM-DD format (optional, defaults to today)"),
  }),
  execute: async (input) => {
    if (input.action === "show_map") {
      // Return a signal to show the map component
      return {
        action: "show_map",
        message: "I'll show you a map of India. Please draw a polygon on the map to select the region where you'd like to analyze vegetation health using NDVI.",
      };
    }

    if (input.action === "fetch_data") {
      if (!input.polygon || input.polygon.length < 3) {
        return {
          error: "A polygon with at least 3 points is required to fetch NDVI data.",
        };
      }

      // Validate that coordinates are within India bounds
      // India approximate bounds: lat 6.5-35.5, lon 68.0-97.5
      const allInIndia = input.polygon.every(
        ([lat, lng]) =>
          lat >= 6.5 &&
          lat <= 35.5 &&
          lng >= 68.0 &&
          lng <= 97.5
      );

      if (!allInIndia) {
        return {
          error: "The selected polygon is outside India. Please select a region within India.",
        };
      }

      // Fetch NDVI data from Google Earth Engine API
      try {
        // Use relative URL for server-side requests in Next.js
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        
        const response = await fetch(
          `${baseUrl}/api/ndvi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              polygon: input.polygon,
              startDate: input.startDate,
              endDate: input.endDate,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch NDVI data" }));
          return {
            error: errorData.error || "Failed to fetch NDVI data from Google Earth Engine",
          };
        }

        const data = await response.json();
        return {
          action: "fetch_data",
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            polygon: data.location.polygon,
          },
          ndviData: data,
        };
      } catch (error) {
        return {
          error: `Error fetching NDVI data: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }

    return {
      error: "Invalid action. Use 'show_map' or 'fetch_data'",
    };
  },
});


import { tool } from "ai";
import { z } from "zod";

export const getCropData = tool({
  description: "Get crop data for a region in India. When a user asks about crops in a region (e.g., 'I want to know crops of a region', 'show me crops in India', 'what crops are grown in a specific area'), 'show me field boundaries', 'show boundaries', automatically show a map for them to place a pin. When user asks about boundaries or fields, show the field boundaries layer on the map. After they place a pin, fetch crop data from Google Earth Engine for that location. Only works for locations within India. Always start with action 'show_map' when user asks about crops.",
  inputSchema: z.object({
    action: z.enum(["show_map", "fetch_data"]).describe("Action to take: 'show_map' to display the map for pin placement (use this when user first asks about crops), 'fetch_data' to get crop data after pin is placed"),
    latitude: z.number().optional().describe("Latitude of the location (required for fetch_data)"),
    longitude: z.number().optional().describe("Longitude of the location (required for fetch_data)"),
    showBoundaries: z.boolean().optional().describe("Whether to show field boundaries on the map (use true when user asks about boundaries, fields, or field layout)"),
    showCropNames: z.boolean().optional().describe("Whether to show crop names as labels on the map (use true when user asks to show crops, crop names, or what crops are in the area)"),
  }),
  execute: async (input) => {
    if (input.action === "show_map") {
      // Return a signal to show the map component
      const showBoundaries = input.showBoundaries ?? false;
      const showCropNames = input.showCropNames ?? false;
      
      let message = "I'll show you a map of India. Please click on the map to place a pin on the region where you'd like to see crop data.";
      if (showBoundaries && showCropNames) {
        message = "I'll show you a map of India with field boundaries and crop names. Please click on the map to place a pin on the region where you'd like to see crop data.";
      } else if (showBoundaries) {
        message = "I'll show you a map of India with field boundaries. Please click on the map to place a pin on the region where you'd like to see crop data.";
      } else if (showCropNames) {
        message = "I'll show you a map of India with crop names displayed. Please click on the map to place a pin on the region where you'd like to see crop data.";
      }
      
      return {
        action: "show_map",
        showBoundaries,
        showCropNames,
        message,
      };
    }

    if (input.action === "fetch_data") {
      if (input.latitude === undefined || input.longitude === undefined) {
        return {
          error: "Latitude and longitude are required to fetch crop data.",
        };
      }

      // Validate that coordinates are within India bounds
      // India approximate bounds: lat 6.5-35.5, lon 68.0-97.5
      if (
        input.latitude < 6.5 ||
        input.latitude > 35.5 ||
        input.longitude < 68.0 ||
        input.longitude > 97.5
      ) {
        return {
          error: "The selected location is outside India. Please select a location within India.",
        };
      }

      // Fetch crop data from Google Earth Engine API
      try {
        // Use relative URL for server-side requests in Next.js
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const response = await fetch(
          `${baseUrl}/api/crop-data?latitude=${input.latitude}&longitude=${input.longitude}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to fetch crop data" }));
          return {
            error: errorData.error || "Failed to fetch crop data from Google Earth Engine",
          };
        }

        const data = await response.json();
        return {
          action: "fetch_data",
          location: {
            latitude: input.latitude,
            longitude: input.longitude,
          },
          cropData: data,
        };
      } catch (error) {
        return {
          error: `Error fetching crop data: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }

    return {
      error: "Invalid action. Use 'show_map' or 'fetch_data'",
    };
  },
});


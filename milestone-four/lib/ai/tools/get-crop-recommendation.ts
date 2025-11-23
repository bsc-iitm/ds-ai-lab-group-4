import { tool } from "ai";
import { z } from "zod";

// Crop suitability data based on Indian agricultural zones
const CROP_SUITABILITY = {
  wheat: {
    seasons: ["rabi"],
    temperature: { min: 15, max: 25 },
    rainfall: { min: 500, max: 1000 },
    soilTypes: ["loam", "clay loam", "sandy loam"],
    states: ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan"],
  },
  rice: {
    seasons: ["kharif"],
    temperature: { min: 20, max: 35 },
    rainfall: { min: 1000, max: 2000 },
    soilTypes: ["clay", "clay loam"],
    states: ["West Bengal", "Punjab", "Uttar Pradesh", "Andhra Pradesh", "Tamil Nadu"],
  },
  maize: {
    seasons: ["kharif", "rabi"],
    temperature: { min: 18, max: 27 },
    rainfall: { min: 600, max: 1000 },
    soilTypes: ["loam", "sandy loam"],
    states: ["Karnataka", "Madhya Pradesh", "Maharashtra", "Bihar"],
  },
  cotton: {
    seasons: ["kharif"],
    temperature: { min: 21, max: 30 },
    rainfall: { min: 500, max: 1000 },
    soilTypes: ["black soil", "loam"],
    states: ["Gujarat", "Maharashtra", "Telangana", "Punjab"],
  },
  sugarcane: {
    seasons: ["kharif"],
    temperature: { min: 26, max: 32 },
    rainfall: { min: 750, max: 1500 },
    soilTypes: ["loam", "clay loam"],
    states: ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu"],
  },
  soybean: {
    seasons: ["kharif"],
    temperature: { min: 20, max: 30 },
    rainfall: { min: 600, max: 1000 },
    soilTypes: ["black soil", "loam"],
    states: ["Madhya Pradesh", "Maharashtra", "Rajasthan"],
  },
  groundnut: {
    seasons: ["kharif", "rabi"],
    temperature: { min: 25, max: 35 },
    rainfall: { min: 500, max: 1250 },
    soilTypes: ["sandy loam", "loam"],
    states: ["Gujarat", "Andhra Pradesh", "Tamil Nadu", "Karnataka"],
  },
  pulses: {
    seasons: ["kharif", "rabi"],
    temperature: { min: 20, max: 30 },
    rainfall: { min: 400, max: 800 },
    soilTypes: ["loam", "sandy loam"],
    states: ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Karnataka"],
  },
};

export const getCropRecommendation = tool({
  description: "Get crop recommendations for a specific location and season in India. Use this when farmers ask 'Which crop should I plant this season?', 'What crops are suitable for my area?', or similar questions. The tool considers location, season, soil type, and climate conditions.",
  inputSchema: z.object({
    latitude: z.number().describe("Latitude of the location"),
    longitude: z.number().describe("Longitude of the location"),
    season: z.enum(["kharif", "rabi", "zaid", "all"]).optional().describe("Crop season: 'kharif' (monsoon, Jun-Oct), 'rabi' (winter, Nov-Apr), 'zaid' (summer, Mar-Jun), or 'all' for all seasons"),
    soilType: z.string().optional().describe("Soil type (e.g., 'loam', 'clay', 'sandy loam', 'black soil')"),
    hasIrrigation: z.boolean().optional().describe("Whether the farmer has irrigation facilities"),
  }),
  execute: async (input) => {
    // Validate India bounds
    if (
      input.latitude < 6.5 ||
      input.latitude > 35.5 ||
      input.longitude < 68.0 ||
      input.longitude > 97.5
    ) {
      return {
        error: "Location is outside India. This tool only works for locations within India.",
      };
    }

    // Determine current season based on month
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let currentSeason: "kharif" | "rabi" | "zaid" = "kharif";
    if (currentMonth >= 6 && currentMonth <= 10) {
      currentSeason = "kharif";
    } else if (currentMonth >= 11 || currentMonth <= 4) {
      currentSeason = "rabi";
    } else {
      currentSeason = "zaid";
    }

    const targetSeason = input.season || currentSeason;

    // Get weather data to assess climate suitability
    let temperature = 25; // Default
    let rainfall = 800; // Default
    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m&daily=precipitation_sum&forecast_days=7`
      );
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        temperature = weatherData.current?.temperature_2m || temperature;
        // Estimate annual rainfall from forecast (simplified)
        const dailyPrecip = weatherData.daily?.precipitation_sum || [];
        rainfall = dailyPrecip.reduce((sum: number, val: number) => sum + val, 0) * 52; // Rough annual estimate
      }
    } catch (error) {
      // Use defaults if weather API fails
    }

    // Filter crops based on season and conditions
    const suitableCrops = Object.entries(CROP_SUITABILITY)
      .filter(([cropName, data]) => {
        if (targetSeason !== "all" && !data.seasons.includes(targetSeason)) {
          return false;
        }
        if (temperature < data.temperature.min || temperature > data.temperature.max) {
          return false;
        }
        if (rainfall < data.rainfall.min || rainfall > data.rainfall.max) {
          if (!input.hasIrrigation) {
            return false; // Require irrigation if rainfall is insufficient
          }
        }
        return true;
      })
      .map(([cropName, data]) => ({
        crop: cropName,
        suitability: "high",
        seasons: data.seasons,
        optimalTemperature: data.temperature,
        optimalRainfall: data.rainfall,
        recommendedSoilTypes: data.soilTypes,
        majorGrowingStates: data.states,
      }));

    // Sort by suitability (could be enhanced with more sophisticated scoring)
    suitableCrops.sort((a, b) => {
      // Prioritize crops that match soil type if provided
      if (input.soilType) {
        const aMatchesSoil = a.recommendedSoilTypes.some(
          (soil) => soil.toLowerCase().includes(input.soilType!.toLowerCase())
        );
        const bMatchesSoil = b.recommendedSoilTypes.some(
          (soil) => soil.toLowerCase().includes(input.soilType!.toLowerCase())
        );
        if (aMatchesSoil && !bMatchesSoil) return -1;
        if (!aMatchesSoil && bMatchesSoil) return 1;
      }
      return 0;
    });

    return {
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      currentSeason,
      targetSeason,
      climateConditions: {
        temperature,
        estimatedAnnualRainfall: rainfall,
      },
      recommendedCrops: suitableCrops.slice(0, 5), // Top 5 recommendations
      recommendations: suitableCrops.map(
        (crop) =>
          `${crop.crop}: Suitable for ${targetSeason} season. Optimal temperature: ${crop.optimalTemperature.min}-${crop.optimalTemperature.max}°C. ${input.hasIrrigation ? "Irrigation available." : "May require irrigation."}`
      ),
    };
  },
});


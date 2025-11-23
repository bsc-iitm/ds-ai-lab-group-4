import { tool } from "ai";
import { z } from "zod";

// Crop water requirements (mm per day) by growth stage
const CROP_WATER_REQUIREMENTS: Record<
  string,
  {
    germination: number;
    vegetative: number;
    flowering: number;
    maturity: number;
    criticalStages: string[];
  }
> = {
  wheat: {
    germination: 2.0,
    vegetative: 3.5,
    flowering: 5.0,
    maturity: 2.5,
    criticalStages: ["flowering", "grain filling"],
  },
  rice: {
    germination: 4.0,
    vegetative: 6.0,
    flowering: 7.0,
    maturity: 4.0,
    criticalStages: ["flowering", "grain filling"],
  },
  maize: {
    germination: 2.5,
    vegetative: 4.0,
    flowering: 6.0,
    maturity: 3.0,
    criticalStages: ["flowering", "grain filling"],
  },
  cotton: {
    germination: 2.0,
    vegetative: 4.5,
    flowering: 5.5,
    maturity: 3.5,
    criticalStages: ["flowering", "boll development"],
  },
  sugarcane: {
    germination: 3.0,
    vegetative: 5.0,
    flowering: 4.0,
    maturity: 3.5,
    criticalStages: ["tillering", "grand growth"],
  },
  soybean: {
    germination: 2.5,
    vegetative: 4.0,
    flowering: 5.5,
    maturity: 2.5,
    criticalStages: ["flowering", "pod filling"],
  },
  groundnut: {
    germination: 2.0,
    vegetative: 3.5,
    flowering: 4.5,
    maturity: 2.0,
    criticalStages: ["flowering", "peg penetration", "pod development"],
  },
};

export const getIrrigationAdvisory = tool({
  description: "Get irrigation recommendations based on crop, stage, weather, and soil conditions. Use this when farmers ask 'Should I water more?', 'Is the soil too dry?', 'How should I adjust irrigation?', 'When should I irrigate?', or similar questions. Provides specific irrigation timing and quantity recommendations.",
  inputSchema: z.object({
    latitude: z.number().describe("Latitude of the field"),
    longitude: z.number().describe("Longitude of the field"),
    crop: z.string().describe("Name of the crop"),
    cropStage: z.enum(["germination", "vegetative", "flowering", "maturity"]).describe("Current growth stage of the crop"),
    daysSinceLastIrrigation: z.number().optional().describe("Number of days since last irrigation (optional)"),
    irrigationMethod: z.enum(["flood", "drip", "sprinkler", "furrow"]).optional().describe("Irrigation method used (optional)"),
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

    const cropName = input.crop.toLowerCase();
    const cropData = CROP_WATER_REQUIREMENTS[cropName];

    if (!cropData) {
      return {
        error: `Water requirement data not available for '${input.crop}'. Available crops: ${Object.keys(CROP_WATER_REQUIREMENTS).join(", ")}`,
        availableCrops: Object.keys(CROP_WATER_REQUIREMENTS),
      };
    }

    // Get current water requirement for the stage
    const dailyWaterRequirement = cropData[input.cropStage];

    // Get weather data
    let temperature = 0;
    let humidity = 0;
    let recentRainfall = 0;
    let forecastRainfall = 0;
    let evapotranspiration = 0;

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum,temperature_2m_max&forecast_days=7&past_days=3`
      );

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        temperature = weatherData.current?.temperature_2m || 0;
        humidity = weatherData.current?.relative_humidity_2m || 0;

        const pastPrecip = weatherData.daily?.precipitation_sum?.slice(0, 3) || [];
        recentRainfall = pastPrecip.reduce((sum: number, val: number) => sum + val, 0);

        const forecastPrecip = weatherData.daily?.precipitation_sum?.slice(3) || [];
        forecastRainfall = forecastPrecip.reduce((sum: number, val: number) => sum + val, 0);

        // Simple ET estimation (mm/day) - higher temp and lower humidity = higher ET
        evapotranspiration = Math.max(2, (temperature - 10) * 0.2 + (100 - humidity) * 0.05);
      }
    } catch (error) {
      return {
        error: "Failed to fetch weather data for irrigation advisory.",
      };
    }

    // Calculate soil moisture deficit
    const daysSinceIrrigation = input.daysSinceLastIrrigation || 7;
    const cumulativeET = evapotranspiration * daysSinceIrrigation;
    const netWaterDeficit = cumulativeET - recentRainfall;

    // Determine irrigation need
    let irrigationNeeded = false;
    let urgency: "low" | "medium" | "high" | "critical" = "low";
    let recommendation = "";
    let irrigationAmount = 0; // mm

    // Check if current stage is critical
    const isCriticalStage = cropData.criticalStages.includes(input.cropStage);

    if (netWaterDeficit > dailyWaterRequirement * 3) {
      irrigationNeeded = true;
      urgency = isCriticalStage ? "critical" : "high";
      irrigationAmount = Math.max(30, netWaterDeficit * 0.8); // Apply 80% of deficit
      recommendation = `URGENT: Irrigation needed immediately. ${isCriticalStage ? "Crop is in critical growth stage - water stress will significantly impact yield." : "High water deficit detected."}`;
    } else if (netWaterDeficit > dailyWaterRequirement * 2) {
      irrigationNeeded = true;
      urgency = isCriticalStage ? "high" : "medium";
      irrigationAmount = Math.max(25, netWaterDeficit * 0.7);
      recommendation = `Irrigation recommended within 1-2 days. ${isCriticalStage ? "Critical growth stage - ensure adequate moisture." : ""}`;
    } else if (netWaterDeficit > dailyWaterRequirement) {
      irrigationNeeded = true;
      urgency = "low";
      irrigationAmount = Math.max(20, netWaterDeficit * 0.6);
      recommendation = "Irrigation can be scheduled in the next 2-3 days. Monitor soil moisture.";
    } else if (forecastRainfall > 10) {
      irrigationNeeded = false;
      recommendation = "No irrigation needed. Rainfall forecasted in next 7 days.";
    } else {
      irrigationNeeded = false;
      recommendation = "Soil moisture is adequate. Continue monitoring.";
    }

    // Irrigation timing recommendation
    const bestTime = "Early morning (5-8 AM) is optimal for irrigation to minimize evaporation losses.";

    // Method-specific recommendations
    let methodAdvice = "";
    if (input.irrigationMethod) {
      switch (input.irrigationMethod) {
        case "drip":
          methodAdvice = "Drip irrigation: Apply water in smaller, frequent doses. More efficient water use.";
          break;
        case "sprinkler":
          methodAdvice = "Sprinkler irrigation: Avoid during windy conditions. Best in early morning or evening.";
          break;
        case "flood":
          methodAdvice = "Flood irrigation: Ensure proper leveling. Higher water requirement but lower cost.";
          break;
        case "furrow":
          methodAdvice = "Furrow irrigation: Maintain proper spacing and slope. Moderate efficiency.";
          break;
      }
    }

    return {
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      crop: input.crop,
      cropStage: input.cropStage,
      isCriticalStage,
      waterRequirement: {
        dailyRequirement: dailyWaterRequirement,
        cumulativeDeficit: Math.round(netWaterDeficit * 10) / 10,
      },
      weatherConditions: {
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        evapotranspiration: Math.round(evapotranspiration * 10) / 10,
        recentRainfall: Math.round(recentRainfall * 10) / 10,
        forecastRainfall: Math.round(forecastRainfall * 10) / 10,
      },
      irrigationRecommendation: {
        needed: irrigationNeeded,
        urgency,
        amount: irrigationNeeded ? Math.round(irrigationAmount) : 0,
        timing: bestTime,
        recommendation,
      },
      methodAdvice: methodAdvice || undefined,
      summary: `${irrigationNeeded ? `IRRIGATE: ${recommendation} Apply ${Math.round(irrigationAmount)}mm of water. ${bestTime}` : recommendation}`,
    };
  },
});


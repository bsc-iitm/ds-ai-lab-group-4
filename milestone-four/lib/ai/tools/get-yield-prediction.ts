import { tool } from "ai";
import { z } from "zod";

// Base yield data (kg/hectare) and factors
const CROP_YIELD_DATA: Record<
  string,
  {
    averageYield: number; // kg/hectare
    goodYield: number;
    excellentYield: number;
    factors: {
      weather: number; // multiplier
      soil: number;
      management: number;
    };
    notes: string;
  }
> = {
  wheat: {
    averageYield: 3000,
    goodYield: 4000,
    excellentYield: 5000,
    factors: { weather: 0.3, soil: 0.3, management: 0.4 },
    notes: "Yield depends on variety, timely sowing, irrigation, and pest management.",
  },
  rice: {
    averageYield: 4000,
    goodYield: 5500,
    excellentYield: 7000,
    factors: { weather: 0.4, soil: 0.2, management: 0.4 },
    notes: "Water management is critical. Hybrid varieties yield higher.",
  },
  maize: {
    averageYield: 3500,
    goodYield: 5000,
    excellentYield: 7000,
    factors: { weather: 0.35, soil: 0.25, management: 0.4 },
    notes: "High-yielding hybrids available. Proper spacing and nutrient management crucial.",
  },
  cotton: {
    averageYield: 500, // kg lint/hectare
    goodYield: 700,
    excellentYield: 1000,
    factors: { weather: 0.3, soil: 0.3, management: 0.4 },
    notes: "Lint yield. Pest management critical. Bt varieties have higher yield potential.",
  },
  sugarcane: {
    averageYield: 70000,
    goodYield: 90000,
    excellentYield: 120000,
    factors: { weather: 0.25, soil: 0.35, management: 0.4 },
    notes: "Very high yield potential. Ratoon crops yield 70-80% of plant crop.",
  },
  soybean: {
    averageYield: 2000,
    goodYield: 3000,
    excellentYield: 4000,
    factors: { weather: 0.35, soil: 0.25, management: 0.4 },
    notes: "Timely sowing critical. Proper inoculation improves yield.",
  },
  groundnut: {
    averageYield: 2000,
    goodYield: 3000,
    excellentYield: 4000,
    factors: { weather: 0.3, soil: 0.3, management: 0.4 },
    notes: "Pod yield. Proper spacing and calcium application important.",
  },
  pulses: {
    averageYield: 1000,
    goodYield: 1500,
    excellentYield: 2000,
    factors: { weather: 0.35, soil: 0.25, management: 0.4 },
    notes: "Grain yield. Includes pigeon pea, black gram, green gram. Timely sowing crucial.",
  },
};

export const getYieldPrediction = tool({
  description: "Predict expected crop yield based on location, weather, crop type, and management practices. Use this when farmers ask 'What yield can I expect from this field?', 'How much will my crop yield?', or similar questions. Provides yield estimates with confidence levels.",
  inputSchema: z.object({
    crop: z.string().describe("Name of the crop"),
    latitude: z.number().describe("Latitude of the field"),
    longitude: z.number().describe("Longitude of the field"),
    areaHectares: z.number().optional().describe("Area in hectares (optional, defaults to 1 hectare)"),
    variety: z.string().optional().describe("Crop variety (optional, e.g., 'hybrid', 'high-yielding', 'local')"),
    managementLevel: z.enum(["basic", "moderate", "good", "excellent"]).optional().describe("Management level (optional, defaults to 'moderate')"),
    sowingDate: z.string().optional().describe("Sowing date in YYYY-MM-DD format (optional, for growth stage estimation)"),
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
    const cropData = CROP_YIELD_DATA[cropName];

    if (!cropData) {
      return {
        error: `Yield prediction data not available for '${input.crop}'. Available crops: ${Object.keys(CROP_YIELD_DATA).join(", ")}`,
        availableCrops: Object.keys(CROP_YIELD_DATA),
      };
    }

    const area = input.areaHectares || 1;
    const managementLevel = input.managementLevel || "moderate";

    // Get weather data for yield adjustment
    let weatherScore = 1.0; // Multiplier
    let weatherFactors: string[] = [];

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=30&past_days=30`
      );

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        const daily = weatherData.daily;

        if (daily) {
          const avgMaxTemp = daily.temperature_2m_max?.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_max?.length || 25;
          const avgMinTemp = daily.temperature_2m_min?.reduce((a: number, b: number) => a + b, 0) / daily.temperature_2m_min?.length || 15;
          const totalRain = daily.precipitation_sum?.reduce((a: number, b: number) => a + b, 0) || 0;

          // Adjust weather score based on conditions
          if (avgMaxTemp > 35) {
            weatherScore *= 0.9;
            weatherFactors.push("High temperatures may stress crop");
          }
          if (avgMinTemp < 5) {
            weatherScore *= 0.85;
            weatherFactors.push("Low temperatures may affect growth");
          }
          if (totalRain < 200) {
            weatherScore *= 0.9;
            weatherFactors.push("Low rainfall - ensure irrigation");
          } else if (totalRain > 800) {
            weatherScore *= 0.95;
            weatherFactors.push("High rainfall - ensure drainage");
          }
        }
      }
    } catch (error) {
      // Use default weather score if API fails
    }

    // Management level multiplier
    const managementMultipliers = {
      basic: 0.8,
      moderate: 1.0,
      good: 1.15,
      excellent: 1.3,
    };

    // Variety multiplier
    const varietyMultiplier = input.variety?.toLowerCase().includes("hybrid") || input.variety?.toLowerCase().includes("high")
      ? 1.2
      : input.variety?.toLowerCase().includes("local")
      ? 0.9
      : 1.0;

    // Calculate predicted yield
    const baseYield = cropData.averageYield;
    const adjustedYield = baseYield * weatherScore * managementMultipliers[managementLevel] * varietyMultiplier;

    // Yield scenarios
    const yieldScenarios = {
      conservative: adjustedYield * 0.85, // 15% below prediction
      predicted: adjustedYield,
      optimistic: adjustedYield * 1.15, // 15% above prediction
    };

    // Total yield for the area
    const totalYield = {
      conservative: yieldScenarios.conservative * area,
      predicted: yieldScenarios.predicted * area,
      optimistic: yieldScenarios.optimistic * area,
    };

    // Confidence level
    let confidence: "low" | "medium" | "high" = "medium";
    if (weatherFactors.length === 0 && managementLevel !== "basic") {
      confidence = "high";
    } else if (weatherFactors.length > 2 || managementLevel === "basic") {
      confidence = "low";
    }

    return {
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      crop: input.crop,
      areaHectares: area,
      yieldPrediction: {
        perHectare: {
          conservative: Math.round(yieldScenarios.conservative),
          predicted: Math.round(yieldScenarios.predicted),
          optimistic: Math.round(yieldScenarios.optimistic),
        },
        total: {
          conservative: Math.round(totalYield.conservative),
          predicted: Math.round(totalYield.predicted),
          optimistic: Math.round(totalYield.optimistic),
        },
        unit: cropName === "cotton" ? "kg lint" : "kg grain",
      },
      factors: {
        weatherScore: Math.round(weatherScore * 100) / 100,
        weatherFactors: weatherFactors.length > 0 ? weatherFactors : ["Favorable weather conditions"],
        managementLevel,
        variety: input.variety || "standard",
      },
      confidence,
      notes: cropData.notes,
      summary: `Predicted yield for ${input.crop}: ${Math.round(yieldScenarios.predicted)} kg/hectare (${Math.round(totalYield.predicted)} kg total for ${area} ha). Range: ${Math.round(yieldScenarios.conservative)}-${Math.round(yieldScenarios.optimistic)} kg/hectare. Confidence: ${confidence}.`,
    };
  },
});


import { tool } from "ai";
import { z } from "zod";

export const getSoilAnalysis = tool({
  description: "Get soil analysis including moisture, nutrients, and recommendations. Use this when farmers ask about soil conditions, 'Is the soil too dry?', 'Are there nutrient deficiencies?', 'What is the soil moisture?', or similar questions. Combines weather data with soil characteristics for analysis.",
  inputSchema: z.object({
    latitude: z.number().describe("Latitude of the field location"),
    longitude: z.number().describe("Longitude of the field location"),
    crop: z.string().optional().describe("Current or planned crop (optional, for crop-specific recommendations)"),
    cropStage: z.string().optional().describe("Current crop growth stage (optional, e.g., 'germination', 'vegetative', 'flowering', 'maturity')"),
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

    // Get weather data for soil moisture estimation
    let soilMoisture = 0;
    let temperature = 0;
    let recentRainfall = 0;
    let forecastRainfall = 0;

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum&forecast_days=7&past_days=7`
      );

      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        temperature = weatherData.current?.temperature_2m || 0;
        const humidity = weatherData.current?.relative_humidity_2m || 0;

        // Estimate soil moisture based on recent rainfall and humidity
        const pastPrecip = weatherData.daily?.precipitation_sum?.slice(0, 7) || [];
        recentRainfall = pastPrecip.reduce((sum: number, val: number) => sum + val, 0);

        const forecastPrecip = weatherData.daily?.precipitation_sum?.slice(7) || [];
        forecastRainfall = forecastPrecip.reduce((sum: number, val: number) => sum + val, 0);

        // Simple soil moisture estimation (0-100%)
        // Higher humidity and recent rain = higher moisture
        soilMoisture = Math.min(100, Math.max(0, humidity * 0.6 + (recentRainfall > 10 ? 30 : recentRainfall * 2)));
      }
    } catch (error) {
      return {
        error: "Failed to fetch weather data for soil analysis.",
      };
    }

    // Determine soil moisture status
    let moistureStatus: "very_dry" | "dry" | "adequate" | "moist" | "wet" = "adequate";
    let moistureRecommendation = "";

    if (soilMoisture < 30) {
      moistureStatus = "very_dry";
      moistureRecommendation = "Soil is very dry. Immediate irrigation recommended.";
    } else if (soilMoisture < 45) {
      moistureStatus = "dry";
      moistureRecommendation = "Soil is dry. Consider irrigation soon.";
    } else if (soilMoisture < 70) {
      moistureStatus = "adequate";
      moistureRecommendation = "Soil moisture is adequate. Monitor regularly.";
    } else if (soilMoisture < 85) {
      moistureStatus = "moist";
      moistureRecommendation = "Soil is moist. No immediate irrigation needed.";
    } else {
      moistureStatus = "wet";
      moistureRecommendation = "Soil is wet. Avoid irrigation. Ensure proper drainage.";
    }

    // Nutrient recommendations (simplified - would need actual soil test data)
    const nutrientRecommendations = {
      nitrogen: {
        status: "unknown",
        recommendation: "Conduct soil test for accurate nitrogen levels. General recommendation: Apply 80-120 kg N/hectare for most crops.",
      },
      phosphorus: {
        status: "unknown",
        recommendation: "Conduct soil test for accurate phosphorus levels. General recommendation: Apply 40-60 kg P2O5/hectare.",
      },
      potassium: {
        status: "unknown",
        recommendation: "Conduct soil test for accurate potassium levels. General recommendation: Apply 40-60 kg K2O/hectare.",
      },
    };

    // Crop-specific recommendations
    let cropSpecificAdvice = "";
    if (input.crop) {
      const cropLower = input.crop.toLowerCase();
      if (cropLower === "wheat" || cropLower === "rice") {
        cropSpecificAdvice = "For cereals, maintain soil moisture at 50-70% during active growth. Apply split doses of nitrogen.";
      } else if (cropLower === "cotton" || cropLower === "sugarcane") {
        cropSpecificAdvice = "For cash crops, ensure adequate moisture (60-80%) during critical growth stages. Higher nutrient requirements.";
      } else if (cropLower.includes("pulse") || cropLower === "soybean") {
        cropSpecificAdvice = "Pulses fix nitrogen. Lower nitrogen requirement but ensure adequate phosphorus and potassium.";
      }
    }

    return {
      location: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      soilMoisture: {
        percentage: Math.round(soilMoisture),
        status: moistureStatus,
        recommendation: moistureRecommendation,
      },
      weatherConditions: {
        temperature: Math.round(temperature),
        recentRainfall7Days: Math.round(recentRainfall * 10) / 10,
        forecastRainfall7Days: Math.round(forecastRainfall * 10) / 10,
      },
      nutrientAnalysis: nutrientRecommendations,
      cropSpecificAdvice: cropSpecificAdvice || undefined,
      recommendations: [
        moistureRecommendation,
        "For accurate nutrient analysis, conduct a soil test at a local agricultural laboratory.",
        cropSpecificAdvice,
      ].filter(Boolean),
    };
  },
});


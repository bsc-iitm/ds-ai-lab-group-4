import { tool } from "ai";
import { z } from "zod";

// Harvest timing data (days to maturity from sowing)
const HARVEST_TIMING: Record<
  string,
  {
    daysToMaturity: number;
    harvestWindow: number; // days
    indicators: string[];
    notes: string;
  }
> = {
  wheat: {
    daysToMaturity: 120,
    harvestWindow: 10,
    indicators: ["Grain hard, golden yellow", "Moisture content 20-22%", "Straw turns yellow"],
    notes: "Harvest when grain is hard. Delayed harvest leads to shattering and bird damage.",
  },
  rice: {
    daysToMaturity: 120,
    harvestWindow: 7,
    indicators: ["80% grains turn golden yellow", "Grains hard when pressed", "Moisture content 20-25%"],
    notes: "Harvest at 80% grain maturity. Too early = immature grains, too late = grain shattering.",
  },
  maize: {
    daysToMaturity: 90,
    harvestWindow: 10,
    indicators: ["Black layer at kernel base", "Husk turns brown", "Moisture content 25-30%"],
    notes: "Harvest when black layer appears. For grain, harvest at 20-25% moisture.",
  },
  cotton: {
    daysToMaturity: 150,
    harvestWindow: 30,
    indicators: ["Bolls open and fluff visible", "Bolls hard and dry", "Leaves start drying"],
    notes: "Harvest in multiple pickings as bolls mature. Avoid harvesting wet cotton.",
  },
  sugarcane: {
    daysToMaturity: 365,
    harvestWindow: 60,
    indicators: ["Canes stop growing", "Lower leaves dry", "Sugar content 18-20%"],
    notes: "Harvest when sugar content is optimal. Can be ratooned for 2-3 years.",
  },
  soybean: {
    daysToMaturity: 100,
    harvestWindow: 7,
    indicators: ["Pods turn brown", "Leaves yellow and drop", "Moisture content 15-18%"],
    notes: "Harvest when pods are brown and dry. Delayed harvest causes pod shattering.",
  },
  groundnut: {
    daysToMaturity: 120,
    harvestWindow: 10,
    indicators: ["Leaves turn yellow", "Pods have dark veins inside", "Kernels hard"],
    notes: "Harvest when pods are mature. Dig carefully to avoid pod loss.",
  },
  pulses: {
    daysToMaturity: 90,
    harvestWindow: 7,
    indicators: ["Pods turn brown", "Leaves dry", "Grains hard"],
    notes: "Harvest when 80% pods are mature. Early morning harvest reduces shattering.",
  },
};

export const getHarvestTiming = tool({
  description: "Get optimal harvest timing and recommendations. Use this when farmers ask 'When should I begin harvesting?', 'Is it time to harvest?', 'If I delay harvest by a few days, what loss should I expect?', or similar questions. Provides harvest dates, indicators, and impact of delays.",
  inputSchema: z.object({
    crop: z.string().describe("Name of the crop"),
    sowingDate: z.string().describe("Sowing date in YYYY-MM-DD format"),
    latitude: z.number().optional().describe("Latitude of the field (optional, for weather-based adjustments)"),
    longitude: z.number().optional().describe("Longitude of the field (optional, for weather-based adjustments)"),
    delayDays: z.number().optional().describe("Number of days to delay harvest (optional, for loss estimation)"),
  }),
  execute: async (input) => {
    const cropName = input.crop.toLowerCase();
    const cropData = HARVEST_TIMING[cropName];

    if (!cropData) {
      return {
        error: `Harvest timing data not available for '${input.crop}'. Available crops: ${Object.keys(HARVEST_TIMING).join(", ")}`,
        availableCrops: Object.keys(HARVEST_TIMING),
      };
    }

    // Calculate harvest date
    const sowingDate = new Date(input.sowingDate);
    if (isNaN(sowingDate.getTime())) {
      return {
        error: "Invalid sowing date format. Use YYYY-MM-DD format.",
      };
    }

    const harvestDate = new Date(sowingDate);
    harvestDate.setDate(harvestDate.getDate() + cropData.daysToMaturity);

    const harvestWindowStart = new Date(harvestDate);
    harvestWindowStart.setDate(harvestWindowStart.getDate() - Math.floor(cropData.harvestWindow / 2));

    const harvestWindowEnd = new Date(harvestDate);
    harvestWindowEnd.setDate(harvestWindowEnd.getDate() + Math.floor(cropData.harvestWindow / 2));

    const today = new Date();
    const daysUntilHarvest = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Check if harvest time has passed
    let harvestStatus: "upcoming" | "optimal" | "delayed" = "upcoming";
    if (today >= harvestWindowStart && today <= harvestWindowEnd) {
      harvestStatus = "optimal";
    } else if (today > harvestWindowEnd) {
      harvestStatus = "delayed";
    }

    // Calculate delay impact if specified
    let delayImpact = null;
    if (input.delayDays) {
      const delayDays = input.delayDays;
      let yieldLoss = 0;
      let qualityLoss = "";
      const lossReasons: string[] = [];

      if (cropName === "wheat" || cropName === "rice" || cropName === "pulses") {
        yieldLoss = Math.min(5, delayDays * 0.5); // 0.5% per day, max 5%
        qualityLoss = "Grain shattering, bird damage, moisture loss";
        lossReasons.push("Grain shattering increases with delay");
        lossReasons.push("Bird and pest damage increases");
        lossReasons.push("Grain quality deteriorates");
      } else if (cropName === "cotton") {
        yieldLoss = Math.min(3, delayDays * 0.2); // Lower loss for cotton
        qualityLoss = "Fiber quality degradation, color change";
        lossReasons.push("Fiber quality may degrade");
        lossReasons.push("Risk of weather damage");
      } else if (cropName === "maize") {
        yieldLoss = Math.min(4, delayDays * 0.4);
        qualityLoss = "Moisture loss, kernel damage";
        lossReasons.push("Moisture content drops below optimal");
        lossReasons.push("Risk of lodging and pest attack");
      } else {
        yieldLoss = Math.min(5, delayDays * 0.5);
        qualityLoss = "General quality deterioration";
        lossReasons.push("Quality and yield may decrease");
      }

      delayImpact = {
        delayDays,
        estimatedYieldLoss: Math.round(yieldLoss * 10) / 10,
        qualityImpact: qualityLoss,
        reasons: lossReasons,
        recommendation: delayDays > 5
          ? "Significant delay - harvest as soon as possible to minimize losses"
          : delayDays > 2
          ? "Moderate delay - harvest within 2-3 days to avoid losses"
          : "Minor delay - acceptable but harvest soon",
      };
    }

    // Weather-based recommendations
    let weatherAdvice = "";
    if (input.latitude && input.longitude) {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&daily=precipitation_sum&forecast_days=7`
        );
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          const forecastRain = weatherData.daily?.precipitation_sum || [];
          const totalForecastRain = forecastRain.reduce((sum: number, val: number) => sum + val, 0);

          if (totalForecastRain > 20 && harvestStatus === "optimal") {
            weatherAdvice = `WARNING: Rainfall forecasted in next 7 days (${Math.round(totalForecastRain)}mm). Consider harvesting before rain to avoid damage.`;
          } else if (totalForecastRain > 10) {
            weatherAdvice = `Light rain forecasted. Ensure proper drying facilities after harvest.`;
          }
        }
      } catch (error) {
        // Ignore weather API errors
      }
    }

    return {
      crop: input.crop,
      sowingDate: input.sowingDate,
      harvestTiming: {
        optimalHarvestDate: harvestDate.toISOString().split("T")[0],
        harvestWindowStart: harvestWindowStart.toISOString().split("T")[0],
        harvestWindowEnd: harvestWindowEnd.toISOString().split("T")[0],
        daysUntilHarvest: daysUntilHarvest,
        status: harvestStatus,
      },
      harvestIndicators: cropData.indicators,
      delayImpact: delayImpact || undefined,
      weatherAdvice: weatherAdvice || undefined,
      notes: cropData.notes,
      recommendation: harvestStatus === "optimal"
        ? `OPTIMAL HARVEST TIME: Harvest now (${harvestDate.toISOString().split("T")[0]}). ${weatherAdvice || ""}`
        : harvestStatus === "delayed"
        ? `DELAYED: Optimal harvest window has passed. Harvest as soon as possible to minimize losses.`
        : `Harvest window: ${harvestWindowStart.toISOString().split("T")[0]} to ${harvestWindowEnd.toISOString().split("T")[0]} (${daysUntilHarvest} days remaining).`,
    };
  },
});


import { tool } from "ai";
import { z } from "zod";

// Cost and yield data for major crops in India (per hectare, approximate)
const CROP_ECONOMICS: Record<
  string,
  {
    costPerHectare: number; // INR
    averageYield: number; // kg/hectare
    averagePrice: number; // INR per kg
    profitMargin: number; // percentage
    notes: string;
  }
> = {
  wheat: {
    costPerHectare: 35000,
    averageYield: 3000,
    averagePrice: 25,
    profitMargin: 114,
    notes: "Cost includes seeds, fertilizers, pesticides, labor, irrigation. Rabi season crop.",
  },
  rice: {
    costPerHectare: 45000,
    averageYield: 4000,
    averagePrice: 30,
    profitMargin: 167,
    notes: "Higher cost due to water requirements. Kharif and rabi seasons.",
  },
  maize: {
    costPerHectare: 30000,
    averageYield: 3500,
    averagePrice: 22,
    profitMargin: 157,
    notes: "Moderate cost crop. Grown in both kharif and rabi.",
  },
  cotton: {
    costPerHectare: 60000,
    averageYield: 500, // kg of lint
    averagePrice: 80,
    profitMargin: -33,
    notes: "High input cost. Profitability depends on market prices and yield. Risk of pest attacks.",
  },
  sugarcane: {
    costPerHectare: 80000,
    averageYield: 70000, // kg
    averagePrice: 3.5,
    profitMargin: 206,
    notes: "High initial investment but good returns. Long duration crop (12-18 months).",
  },
  soybean: {
    costPerHectare: 25000,
    averageYield: 2000,
    averagePrice: 45,
    profitMargin: 260,
    notes: "Good profit margins. Kharif season crop. Growing demand.",
  },
  groundnut: {
    costPerHectare: 35000,
    averageYield: 2000,
    averagePrice: 60,
    profitMargin: 243,
    notes: "Good returns. Oilseed crop with stable demand.",
  },
  pulses: {
    costPerHectare: 25000,
    averageYield: 1000,
    averagePrice: 80,
    profitMargin: 220,
    notes: "Includes pigeon pea, black gram, green gram. Good for soil health.",
  },
};

export const getCostBenefitAnalysis = tool({
  description: "Get cost vs profit analysis for crops in India. Use this when farmers ask 'What is the estimated cost vs profit for this crop?', 'How much will I spend and earn?', 'Is this crop profitable?', or similar questions. Provides detailed cost breakdown, expected yield, revenue, and profit calculations.",
  inputSchema: z.object({
    crop: z.string().describe("Name of the crop"),
    areaHectares: z.number().optional().describe("Area in hectares (optional, defaults to 1 hectare for per-hectare analysis)"),
    expectedYield: z.number().optional().describe("Expected yield in kg/hectare (optional, uses average if not provided)"),
    expectedPrice: z.number().optional().describe("Expected selling price in INR per kg (optional, uses average if not provided)"),
    location: z.string().optional().describe("Location/state for price reference (optional)"),
  }),
  execute: async (input) => {
    const cropName = input.crop.toLowerCase();
    const cropData = CROP_ECONOMICS[cropName];

    if (!cropData) {
      return {
        error: `Cost-benefit data not available for '${input.crop}'. Available crops: ${Object.keys(CROP_ECONOMICS).join(", ")}`,
        availableCrops: Object.keys(CROP_ECONOMICS),
      };
    }

    const area = input.areaHectares || 1;
    const yieldPerHectare = input.expectedYield || cropData.averageYield;
    const pricePerKg = input.expectedPrice || cropData.averagePrice;

    // Calculate costs
    const totalCost = cropData.costPerHectare * area;

    // Calculate revenue
    const totalYield = yieldPerHectare * area;
    const totalRevenue = totalYield * pricePerKg;

    // Calculate profit
    const profit = totalRevenue - totalCost;
    const profitMargin = (profit / totalCost) * 100;
    const roi = (profit / totalCost) * 100;

    // Cost breakdown (approximate percentages)
    const costBreakdown = {
      seeds: totalCost * 0.15,
      fertilizers: totalCost * 0.25,
      pesticides: totalCost * 0.15,
      labor: totalCost * 0.25,
      irrigation: totalCost * 0.10,
      other: totalCost * 0.10,
    };

    // Get current market price if location provided (using mandi price tool logic)
    let marketPriceInfo = "";
    if (input.location) {
      marketPriceInfo = `Note: Current market prices may vary. Check mandi prices for ${input.location} using getMandiPrice tool.`;
    }

    return {
      crop: input.crop,
      areaHectares: area,
      costAnalysis: {
        totalCost,
        costPerHectare: cropData.costPerHectare,
        costBreakdown,
      },
      yieldAnalysis: {
        expectedYieldPerHectare: yieldPerHectare,
        totalExpectedYield: totalYield,
        averageYield: cropData.averageYield,
      },
      revenueAnalysis: {
        pricePerKg,
        totalRevenue,
        averagePrice: cropData.averagePrice,
      },
      profitAnalysis: {
        profit,
        profitMargin: profitMargin.toFixed(2),
        roi: roi.toFixed(2),
        averageProfitMargin: cropData.profitMargin,
      },
      notes: cropData.notes,
      marketPriceInfo: marketPriceInfo || undefined,
      summary: `For ${area} hectare(s) of ${input.crop}: Total Cost: ₹${totalCost.toLocaleString()}, Expected Revenue: ₹${totalRevenue.toLocaleString()}, Profit: ₹${profit.toLocaleString()} (${profitMargin.toFixed(1)}% margin).`,
    };
  },
});


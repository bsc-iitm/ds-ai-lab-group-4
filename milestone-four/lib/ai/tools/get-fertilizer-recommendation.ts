import { tool } from "ai";
import { z } from "zod";

// Fertilizer recommendations by crop and stage (kg/hectare)
const FERTILIZER_RECOMMENDATIONS: Record<
  string,
  {
    nitrogen: { germination: number; vegetative: number; flowering: number; maturity: number };
    phosphorus: number; // Usually applied at sowing
    potassium: number; // Usually applied at sowing
    micronutrients: string[];
    notes: string;
  }
> = {
  wheat: {
    nitrogen: { germination: 0, vegetative: 60, flowering: 40, maturity: 0 },
    phosphorus: 60,
    potassium: 40,
    micronutrients: ["Zinc", "Boron"],
    notes: "Apply full P and K at sowing. Split N application: 50% at sowing, 25% at tillering, 25% at boot stage.",
  },
  rice: {
    nitrogen: { germination: 0, vegetative: 80, flowering: 60, maturity: 0 },
    phosphorus: 40,
    potassium: 40,
    micronutrients: ["Zinc"],
    notes: "Higher N requirement. Apply zinc sulfate if deficiency observed. Split N: 50% basal, 25% at tillering, 25% at panicle initiation.",
  },
  maize: {
    nitrogen: { germination: 0, vegetative: 100, flowering: 50, maturity: 0 },
    phosphorus: 60,
    potassium: 40,
    micronutrients: ["Zinc"],
    notes: "High N requirement. Apply P and K at sowing. Split N: 50% at sowing, 50% at knee-high stage.",
  },
  cotton: {
    nitrogen: { germination: 0, vegetative: 80, flowering: 100, maturity: 0 },
    phosphorus: 50,
    potassium: 50,
    micronutrients: ["Zinc", "Boron"],
    notes: "High nutrient requirement. Apply P and K at sowing. Split N: 33% at sowing, 33% at square formation, 33% at flowering.",
  },
  sugarcane: {
    nitrogen: { germination: 0, vegetative: 150, flowering: 100, maturity: 0 },
    phosphorus: 60,
    potassium: 80,
    micronutrients: ["Iron", "Zinc"],
    notes: "Very high nutrient requirement. Apply in multiple splits during grand growth phase.",
  },
  soybean: {
    nitrogen: { germination: 0, vegetative: 0, flowering: 0, maturity: 0 }, // Legume - fixes N
    phosphorus: 60,
    potassium: 40,
    micronutrients: ["Molybdenum", "Boron"],
    notes: "Legume crop - fixes atmospheric nitrogen. No N fertilizer needed if proper inoculation. High P requirement.",
  },
  groundnut: {
    nitrogen: { germination: 0, vegetative: 0, flowering: 0, maturity: 0 }, // Legume
    phosphorus: 50,
    potassium: 40,
    micronutrients: ["Calcium", "Boron"],
    notes: "Legume crop. Apply gypsum (calcium) at flowering for better pod development. No N needed if inoculated.",
  },
  pulses: {
    nitrogen: { germination: 0, vegetative: 0, flowering: 0, maturity: 0 }, // Legumes
    phosphorus: 50,
    potassium: 30,
    micronutrients: ["Molybdenum", "Zinc"],
    notes: "Legume crops fix nitrogen. Inoculate seeds with Rhizobium. Focus on P and K.",
  },
};

export const getFertilizerRecommendation = tool({
  description: "Get fertilizer recommendations for crops based on growth stage and soil conditions. Use this when farmers ask 'How much fertilizer should I apply now?', 'Is there a nutrient deficiency?', 'What nutrients does my crop need?', or similar questions. Provides specific NPK recommendations and application schedules.",
  inputSchema: z.object({
    crop: z.string().describe("Name of the crop"),
    cropStage: z.enum(["germination", "vegetative", "flowering", "maturity"]).describe("Current growth stage"),
    areaHectares: z.number().optional().describe("Area in hectares (optional, defaults to 1 hectare)"),
    soilType: z.string().optional().describe("Soil type (optional, for soil-specific adjustments)"),
    hasDeficiencySymptoms: z.string().optional().describe("Observed deficiency symptoms if any (optional, e.g., 'yellowing leaves', 'stunted growth')"),
  }),
  execute: async (input) => {
    const cropName = input.crop.toLowerCase();
    const cropData = FERTILIZER_RECOMMENDATIONS[cropName];

    if (!cropData) {
      return {
        error: `Fertilizer recommendation data not available for '${input.crop}'. Available crops: ${Object.keys(FERTILIZER_RECOMMENDATIONS).join(", ")}`,
        availableCrops: Object.keys(FERTILIZER_RECOMMENDATIONS),
      };
    }

    const area = input.areaHectares || 1;

    // Get N requirement for current stage
    const nitrogenRequired = cropData.nitrogen[input.cropStage];

    // Calculate total fertilizer needed
    const fertilizerNeeds = {
      nitrogen: {
        kgPerHectare: nitrogenRequired,
        totalKg: nitrogenRequired * area,
        source: "Urea (46% N)",
        ureaKg: nitrogenRequired > 0 ? (nitrogenRequired / 0.46) * area : 0,
      },
      phosphorus: {
        kgPerHectare: cropData.phosphorus,
        totalKg: cropData.phosphorus * area,
        source: "DAP (18% N, 46% P2O5) or SSP (16% P2O5)",
        dapKg: cropData.phosphorus > 0 ? (cropData.phosphorus / 0.46) * area : 0,
        sspKg: cropData.phosphorus > 0 ? (cropData.phosphorus / 0.16) * area : 0,
      },
      potassium: {
        kgPerHectare: cropData.potassium,
        totalKg: cropData.potassium * area,
        source: "MOP (60% K2O)",
        mopKg: cropData.potassium > 0 ? (cropData.potassium / 0.60) * area : 0,
      },
    };

    // Deficiency diagnosis
    let deficiencyAdvice = "";
    if (input.hasDeficiencySymptoms) {
      const symptoms = input.hasDeficiencySymptoms.toLowerCase();
      if (symptoms.includes("yellow") || symptoms.includes("chlorosis")) {
        deficiencyAdvice = "Yellowing leaves may indicate nitrogen deficiency. Apply nitrogen fertilizer immediately.";
      } else if (symptoms.includes("purple") || symptoms.includes("dark")) {
        deficiencyAdvice = "Purple or dark leaves may indicate phosphorus deficiency. Apply phosphorus fertilizer.";
      } else if (symptoms.includes("brown") || symptoms.includes("margins")) {
        deficiencyAdvice = "Brown leaf margins may indicate potassium deficiency. Apply potassium fertilizer.";
      } else if (symptoms.includes("stunt") || symptoms.includes("small")) {
        deficiencyAdvice = "Stunted growth may indicate multiple nutrient deficiencies. Conduct soil test and apply balanced fertilizer.";
      }
    }

    // Application timing
    let applicationTiming = "";
    if (input.cropStage === "germination") {
      applicationTiming = "Apply basal dose (P and K) at sowing. Nitrogen can be applied 2-3 weeks after sowing.";
    } else if (input.cropStage === "vegetative") {
      applicationTiming = "Apply top-dressing of nitrogen during active vegetative growth. Best time: early morning or evening.";
    } else if (input.cropStage === "flowering") {
      applicationTiming = "Critical stage - apply nitrogen for better flowering and grain/pod development. Ensure adequate soil moisture.";
    } else {
      applicationTiming = "Maturity stage - minimal fertilizer needed. Focus on maintaining existing nutrients.";
    }

    // Soil-specific adjustments
    let soilAdvice = "";
    if (input.soilType) {
      const soilLower = input.soilType.toLowerCase();
      if (soilLower.includes("sandy") || soilLower.includes("light")) {
        soilAdvice = "Sandy soils: Apply fertilizers in split doses. Higher leaching risk - use slow-release fertilizers if available.";
      } else if (soilLower.includes("clay") || soilLower.includes("heavy")) {
        soilAdvice = "Clay soils: Better nutrient retention. Can apply larger doses but ensure proper incorporation.";
      } else if (soilLower.includes("alkaline") || soilLower.includes("high ph")) {
        soilAdvice = "Alkaline soils: May need micronutrient supplements (zinc, iron). Consider soil pH correction.";
      }
    }

    return {
      crop: input.crop,
      cropStage: input.cropStage,
      areaHectares: area,
      fertilizerRecommendations: fertilizerNeeds,
      micronutrients: cropData.micronutrients,
      applicationTiming,
      notes: cropData.notes,
      deficiencyAdvice: deficiencyAdvice || undefined,
      soilAdvice: soilAdvice || undefined,
      summary: `For ${input.crop} at ${input.cropStage} stage: ${nitrogenRequired > 0 ? `Apply ${Math.round(fertilizerNeeds.nitrogen.ureaKg)} kg Urea` : "No N needed (legume)"}, ${cropData.phosphorus > 0 ? `${Math.round(fertilizerNeeds.phosphorus.dapKg)} kg DAP or ${Math.round(fertilizerNeeds.phosphorus.sspKg)} kg SSP` : "No P needed"}, ${cropData.potassium > 0 ? `${Math.round(fertilizerNeeds.potassium.mopKg)} kg MOP` : "No K needed"}. ${applicationTiming}`,
    };
  },
});


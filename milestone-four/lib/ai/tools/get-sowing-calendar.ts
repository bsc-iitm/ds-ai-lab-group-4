import { tool } from "ai";
import { z } from "zod";

// Sowing calendar data for major crops in India
const SOWING_CALENDAR: Record<
  string,
  {
    kharif?: { start: string; end: string; optimal: string };
    rabi?: { start: string; end: string; optimal: string };
    zaid?: { start: string; end: string; optimal: string };
    daysToMaturity: number;
    notes: string;
  }
> = {
  wheat: {
    rabi: { start: "2024-11-01", end: "2024-12-15", optimal: "2024-11-15" },
    daysToMaturity: 120,
    notes: "Best sown in November for rabi season. Early sowing helps avoid terminal heat stress.",
  },
  rice: {
    kharif: { start: "2024-06-01", end: "2024-07-31", optimal: "2024-06-15" },
    rabi: { start: "2024-11-15", end: "2024-12-31", optimal: "2024-12-01" },
    daysToMaturity: 120,
    notes: "Kharif rice sown with monsoon onset. Rabi rice requires assured irrigation.",
  },
  maize: {
    kharif: { start: "2024-06-01", end: "2024-07-15", optimal: "2024-06-20" },
    rabi: { start: "2024-10-15", end: "2024-11-30", optimal: "2024-11-01" },
    daysToMaturity: 90,
    notes: "Early sowing in kharif avoids waterlogging. Rabi requires irrigation.",
  },
  cotton: {
    kharif: { start: "2024-04-15", end: "2024-06-30", optimal: "2024-05-15" },
    daysToMaturity: 150,
    notes: "Sow after last frost. Early sowing helps avoid bollworm damage.",
  },
  sugarcane: {
    kharif: { start: "2024-02-01", end: "2024-05-31", optimal: "2024-03-15" },
    daysToMaturity: 365,
    notes: "Planting done in spring. Requires 12-18 months to mature.",
  },
  soybean: {
    kharif: { start: "2024-06-15", end: "2024-07-15", optimal: "2024-06-25" },
    daysToMaturity: 100,
    notes: "Sow with onset of monsoon. Delayed sowing reduces yield significantly.",
  },
  groundnut: {
    kharif: { start: "2024-06-01", end: "2024-07-15", optimal: "2024-06-20" },
    rabi: { start: "2024-10-15", end: "2024-11-30", optimal: "2024-11-01" },
    daysToMaturity: 120,
    notes: "Kharif sowing with monsoon. Rabi requires irrigation and warm climate.",
  },
  pulses: {
    kharif: { start: "2024-06-15", end: "2024-07-31", optimal: "2024-07-01" },
    rabi: { start: "2024-10-15", end: "2024-11-30", optimal: "2024-11-01" },
    daysToMaturity: 90,
    notes: "Includes pigeon pea, black gram, green gram. Sow with monsoon for kharif.",
  },
};

export const getSowingCalendar = tool({
  description: "Get optimal sowing dates and calendar for crops in India. Use this when farmers ask 'When is the best time to sow?', 'When should I plant [crop]?', or 'What is the sowing window for [crop]?'. Provides season-specific sowing windows and optimal dates.",
  inputSchema: z.object({
    crop: z.string().describe("Name of the crop (e.g., 'wheat', 'rice', 'maize', 'cotton')"),
    latitude: z.number().optional().describe("Latitude of the location (optional, for location-specific adjustments)"),
    longitude: z.number().optional().describe("Longitude of the location (optional, for location-specific adjustments)"),
    season: z.enum(["kharif", "rabi", "zaid"]).optional().describe("Specific season to check (optional)"),
  }),
  execute: async (input) => {
    const cropName = input.crop.toLowerCase();
    const cropData = SOWING_CALENDAR[cropName];

    if (!cropData) {
      return {
        error: `Sowing calendar data not available for '${input.crop}'. Available crops: ${Object.keys(SOWING_CALENDAR).join(", ")}`,
        availableCrops: Object.keys(SOWING_CALENDAR),
      };
    }

    // Get current date and calculate relative dates
    const today = new Date();
    const currentYear = today.getFullYear();

    // Adjust dates for current year
    const adjustDateForYear = (dateStr: string, year: number) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(year, m - 1, d);
    };

    const seasons = input.season
      ? [input.season]
      : (Object.keys(cropData).filter((k) => k !== "daysToMaturity" && k !== "notes") as Array<"kharif" | "rabi" | "zaid">);

    const sowingWindows = seasons
      .map((season) => {
        const seasonData = cropData[season];
        if (!seasonData) return null;

        const startDate = adjustDateForYear(seasonData.start, currentYear);
        const endDate = adjustDateForYear(seasonData.end, currentYear);
        const optimalDate = adjustDateForYear(seasonData.optimal, currentYear);

        // Check if dates are in the past, adjust to next year if needed
        if (endDate < today) {
          const nextYearStart = adjustDateForYear(seasonData.start, currentYear + 1);
          const nextYearEnd = adjustDateForYear(seasonData.end, currentYear + 1);
          const nextYearOptimal = adjustDateForYear(seasonData.optimal, currentYear + 1);
          return {
            season,
            startDate: nextYearStart.toISOString().split("T")[0],
            endDate: nextYearEnd.toISOString().split("T")[0],
            optimalDate: nextYearOptimal.toISOString().split("T")[0],
            status: today < nextYearStart ? "upcoming" : today >= nextYearStart && today <= nextYearEnd ? "current" : "past",
          };
        }

        return {
          season,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          optimalDate: optimalDate.toISOString().split("T")[0],
          status: today < startDate ? "upcoming" : today >= startDate && today <= endDate ? "current" : "past",
        };
      })
      .filter((w) => w !== null);

    // Get weather forecast if location provided
    let weatherAdvice = "";
    if (input.latitude && input.longitude) {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&forecast_days=14`
        );
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          const daily = weatherData.daily;
          if (daily) {
            const avgTemp = daily.temperature_2m_max?.slice(0, 7).reduce((a: number, b: number) => a + b, 0) / 7 || 0;
            const totalRain = daily.precipitation_sum?.slice(0, 7).reduce((a: number, b: number) => a + b, 0) || 0;
            weatherAdvice = `Current 7-day forecast: Average max temp ${avgTemp.toFixed(1)}°C, Total rainfall ${totalRain.toFixed(1)}mm. `;
          }
        }
      } catch (error) {
        // Ignore weather API errors
      }
    }

    return {
      crop: input.crop,
      daysToMaturity: cropData.daysToMaturity,
      sowingWindows,
      notes: cropData.notes,
      weatherAdvice: weatherAdvice || undefined,
      recommendation: sowingWindows
        .filter((w) => w?.status === "current" || w?.status === "upcoming")
        .map(
          (w) =>
            `${w?.season.toUpperCase()} season: Optimal sowing date is ${w?.optimalDate}. Window: ${w?.startDate} to ${w?.endDate}. ${w?.status === "current" ? "You can sow now!" : "Upcoming window."}`
        )
        .join("\n"),
    };
  },
});


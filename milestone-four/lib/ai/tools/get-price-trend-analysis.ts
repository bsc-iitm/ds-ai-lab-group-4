import { tool } from "ai";
import { z } from "zod";
import { executeSql } from "@/lib/ai/tools/mandi_price/db_util";

export const getPriceTrendAnalysis = tool({
  description: "Analyze price trends and provide market advisory. Use this when farmers ask 'Should I sell now or wait for a better price?', 'Is the price likely to increase?', 'Which market gives me a better return?', or similar questions. Provides price trends, market comparisons, and selling recommendations.",
  inputSchema: z.object({
    commodity: z.string().describe("Name of the commodity/crop"),
    state: z.string().optional().describe("State name (optional, for state-specific analysis)"),
    district: z.string().optional().describe("District name (optional, for district-specific analysis)"),
    days: z.number().optional().describe("Number of days to analyze trend (optional, defaults to 30)"),
    compareMarkets: z.boolean().optional().describe("Whether to compare prices across different markets (optional, defaults to true)"),
  }),
  execute: async (input) => {
    const days = input.days || 30;
    const commodity = input.commodity;

    try {
      // Get recent price data
      const recentPriceQuery = `
        SELECT 
          State_Name,
          District_Name,
          Market_Name,
          Modal_Price,
          Min_Price,
          Max_Price,
          Reported_Date,
          Commodity_Name
        FROM project_data
        WHERE Commodity_Name LIKE '%${commodity}%'
        ${input.state ? `AND State_Name LIKE '%${input.state}%'` : ""}
        ${input.district ? `AND District_Name LIKE '%${input.district}%'` : ""}
        AND Reported_Date >= date('now', '-${days} days')
        ORDER BY Reported_Date DESC
        LIMIT 100
      `;

      const recentPrices = await executeSql(recentPriceQuery);

      if (recentPrices.length === 0) {
        return {
          error: `No price data found for '${commodity}'${input.state ? ` in ${input.state}` : ""}${input.district ? `, ${input.district}` : ""} in the last ${days} days.`,
          suggestion: "Try a different commodity name or check spelling.",
        };
      }

      // Calculate price statistics
      const prices = recentPrices.map((r: any) => parseFloat(r.Modal_Price || r.Min_Price || 0)).filter((p: number) => p > 0);
      const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Get oldest and newest prices for trend
      const sortedByDate = recentPrices.sort(
        (a: any, b: any) => new Date(a.Reported_Date).getTime() - new Date(b.Reported_Date).getTime()
      );
      const oldestPrice = parseFloat(sortedByDate[0]?.Modal_Price || sortedByDate[0]?.Min_Price || 0);
      const newestPrice = parseFloat(
        sortedByDate[sortedByDate.length - 1]?.Modal_Price || sortedByDate[sortedByDate.length - 1]?.Min_Price || 0
      );

      const priceChange = newestPrice - oldestPrice;
      const priceChangePercent = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100) : 0;

      // Determine trend
      let trend: "increasing" | "decreasing" | "stable" = "stable";
      if (priceChangePercent > 5) {
        trend = "increasing";
      } else if (priceChangePercent < -5) {
        trend = "decreasing";
      }

      // Market comparison
      let marketComparison = null;
      if (input.compareMarkets !== false) {
        const marketQuery = `
          SELECT 
            Market_Name,
            District_Name,
            State_Name,
            AVG(Modal_Price) as Avg_Price,
            MAX(Modal_Price) as Max_Price,
            MIN(Modal_Price) as Min_Price,
            COUNT(*) as Data_Points
          FROM project_data
          WHERE Commodity_Name LIKE '%${commodity}%'
          ${input.state ? `AND State_Name LIKE '%${input.state}%'` : ""}
          AND Reported_Date >= date('now', '-${days} days')
          GROUP BY Market_Name, District_Name, State_Name
          HAVING COUNT(*) >= 3
          ORDER BY Avg_Price DESC
          LIMIT 10
        `;

        const marketData = await executeSql(marketQuery);
        marketComparison = marketData.map((m: any) => ({
          market: m.Market_Name,
          district: m.District_Name,
          state: m.State_Name,
          averagePrice: Math.round(parseFloat(m.Avg_Price || 0) * 10) / 10,
          maxPrice: Math.round(parseFloat(m.Max_Price || 0) * 10) / 10,
          minPrice: Math.round(parseFloat(m.Min_Price || 0) * 10) / 10,
          dataPoints: m.Data_Points,
        }));
      }

      // Selling recommendation
      let recommendation = "";
      if (trend === "increasing") {
        recommendation = `Price is INCREASING (${priceChangePercent.toFixed(1)}% in last ${days} days). Consider waiting 1-2 weeks if storage is available, as prices may continue to rise.`;
      } else if (trend === "decreasing") {
        recommendation = `Price is DECREASING (${priceChangePercent.toFixed(1)}% in last ${days} days). Consider selling soon to avoid further price drop.`;
      } else {
        recommendation = `Price is STABLE. Current prices are reasonable. Sell when convenient, but monitor for any sudden changes.`;
      }

      // Best market recommendation
      let bestMarket = "";
      if (marketComparison && marketComparison.length > 0) {
        const topMarket = marketComparison[0];
        bestMarket = `Best market: ${topMarket.market}, ${topMarket.district}, ${topMarket.state} - Average price: ₹${topMarket.averagePrice}/quintal`;
      }

      return {
        commodity,
        location: {
          state: input.state || "All states",
          district: input.district || "All districts",
        },
        priceAnalysis: {
          currentAverage: Math.round(avgPrice * 10) / 10,
          priceRange: {
            min: Math.round(minPrice * 10) / 10,
            max: Math.round(maxPrice * 10) / 10,
          },
          trend,
          priceChange: Math.round(priceChange * 10) / 10,
          priceChangePercent: Math.round(priceChangePercent * 10) / 10,
          period: `${days} days`,
        },
        marketComparison: marketComparison || undefined,
        recommendation,
        bestMarket: bestMarket || undefined,
        summary: `${commodity} price trend: ${trend.toUpperCase()} (${priceChangePercent > 0 ? "+" : ""}${priceChangePercent.toFixed(1)}% in ${days} days). Current average: ₹${Math.round(avgPrice * 10) / 10}/quintal. ${recommendation} ${bestMarket}`,
      };
    } catch (error) {
      return {
        error: `Failed to analyze price trends: ${error instanceof Error ? error.message : "Unknown error"}`,
        suggestion: "Check commodity name spelling or try a different commodity.",
      };
    }
  },
});


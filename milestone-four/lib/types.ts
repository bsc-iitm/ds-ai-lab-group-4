import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { createDocument } from "./ai/tools/create-document";
import type { getCropData } from "./ai/tools/get-crop-data";
import type { getNDVI } from "./ai/tools/get-ndvi";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";
import { getMandiPrice } from "@/lib/ai/tools/mandi_price/get-mandi-price";
import type { getCropRecommendation } from "./ai/tools/get-crop-recommendation";
import type { getSowingCalendar } from "./ai/tools/get-sowing-calendar";
import type { getCostBenefitAnalysis } from "./ai/tools/get-cost-benefit-analysis";
import type { getSoilAnalysis } from "./ai/tools/get-soil-analysis";
import type { getIrrigationAdvisory } from "./ai/tools/get-irrigation-advisory";
import type { getFertilizerRecommendation } from "./ai/tools/get-fertilizer-recommendation";
import type { getYieldPrediction } from "./ai/tools/get-yield-prediction";
import type { getHarvestTiming } from "./ai/tools/get-harvest-timing";
import type { getPriceTrendAnalysis } from "./ai/tools/get-price-trend-analysis";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type getCropDataTool = InferUITool<typeof getCropData>;
type getNDVITool = InferUITool<typeof getNDVI>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type getMandiPriceTool = InferUITool<typeof getMandiPrice>;
type getCropRecommendationTool = InferUITool<typeof getCropRecommendation>;
type getSowingCalendarTool = InferUITool<typeof getSowingCalendar>;
type getCostBenefitAnalysisTool = InferUITool<typeof getCostBenefitAnalysis>;
type getSoilAnalysisTool = InferUITool<typeof getSoilAnalysis>;
type getIrrigationAdvisoryTool = InferUITool<typeof getIrrigationAdvisory>;
type getFertilizerRecommendationTool = InferUITool<typeof getFertilizerRecommendation>;
type getYieldPredictionTool = InferUITool<typeof getYieldPrediction>;
type getHarvestTimingTool = InferUITool<typeof getHarvestTiming>;
type getPriceTrendAnalysisTool = InferUITool<typeof getPriceTrendAnalysis>;

export type ChatTools = {
  getWeather: weatherTool;
  getCropData: getCropDataTool;
  getNDVI: getNDVITool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  getMandiPrice: getMandiPriceTool;
  getCropRecommendation: getCropRecommendationTool;
  getSowingCalendar: getSowingCalendarTool;
  getCostBenefitAnalysis: getCostBenefitAnalysisTool;
  getSoilAnalysis: getSoilAnalysisTool;
  getIrrigationAdvisory: getIrrigationAdvisoryTool;
  getFertilizerRecommendation: getFertilizerRecommendationTool;
  getYieldPrediction: getYieldPredictionTool;
  getHarvestTiming: getHarvestTimingTool;
  getPriceTrendAnalysis: getPriceTrendAnalysisTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

import OpenAI from "openai";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";

export function createAiClient() {
  if (!isAiConfigured()) {
    throw new Error("OpenAI-compatible endpoint is not configured.");
  }

  return new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseUrl
  });
}


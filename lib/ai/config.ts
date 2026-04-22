const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
const openAiBaseUrl = process.env.OPENAI_BASE_URL ?? "";

export const aiConfig = {
  apiKey: openAiApiKey,
  baseUrl: openAiBaseUrl
};

export function isAiConfigured() {
  return Boolean(aiConfig.apiKey && aiConfig.baseUrl);
}


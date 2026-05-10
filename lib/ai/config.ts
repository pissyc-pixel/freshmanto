const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
const openAiBaseUrl = process.env.OPENAI_BASE_URL?.trim() ?? "";
const aiReportTimeoutMs = Number(process.env.AI_REPORT_TIMEOUT_MS ?? 8000);

export const aiConfig = {
  apiKey: openAiApiKey,
  baseUrl: openAiBaseUrl,
  reportTimeoutMs: Number.isFinite(aiReportTimeoutMs) && aiReportTimeoutMs > 0
    ? Math.round(aiReportTimeoutMs)
    : 8000,
};

export function isAiConfigured() {
  return Boolean(aiConfig.apiKey);
}

export function getAiReportTimeoutMs() {
  return aiConfig.reportTimeoutMs;
}

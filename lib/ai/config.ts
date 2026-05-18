function readTrimmedEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeBaseUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    const normalizedPath = parsed.pathname === "/" || parsed.pathname === "" ? "/v1" : parsed.pathname.replace(/\/+$/, "");

    parsed.pathname = normalizedPath;
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/+$/, "");
  }
}

const openAiApiKey = readTrimmedEnv("OPENAI_API_KEY", "MIMO_API_KEY", "XIAOMI_MIMO_API_KEY");
const openAiBaseUrl = normalizeBaseUrl(readTrimmedEnv("OPENAI_BASE_URL", "MIMO_BASE_URL", "XIAOMI_BASE_URL"));
const openAiModel = readTrimmedEnv("OPENAI_MODEL", "MIMO_MODEL", "XIAOMI_MIMO_MODEL");
const aiReportTimeoutMs = Number(process.env.AI_REPORT_TIMEOUT_MS ?? 8000);

export const aiConfig = {
  apiKey: openAiApiKey,
  baseUrl: openAiBaseUrl,
  model: openAiModel,
  reportTimeoutMs:
    Number.isFinite(aiReportTimeoutMs) && aiReportTimeoutMs > 0
      ? Math.round(aiReportTimeoutMs)
      : 8000,
};

export function isAiConfigured() {
  return Boolean(aiConfig.apiKey);
}

export function getAiReportTimeoutMs() {
  return aiConfig.reportTimeoutMs;
}

export function getAiModel() {
  return aiConfig.model || "gpt-4.1-mini";
}

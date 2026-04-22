import { createAiClient } from "@/lib/ai/client";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";
import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import type {
  AiPromptPayload,
  AiReportRequest,
  AiReportResult,
  EndingReportPromptInput,
  MonthlyJournalPromptInput
} from "@/types/ai";

const defaultModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

function getPromptPayload(input: AiReportRequest): AiPromptPayload {
  return input.kind === "monthly_journal"
    ? buildMonthlyJournalPrompt(input)
    : buildEndingReportPrompt(input);
}

export function renderMonthlyJournalFallback(input: MonthlyJournalPromptInput): AiReportResult {
  const { summary, year, month } = input;

  return {
    kind: "monthly_journal",
    usedFallback: true,
    markdown: [
      `# Year ${year} Month ${month} Journal`,
      "",
      `This month focused on ${summary.actions.join(", ")} with an attendance strategy of ${summary.attendanceStrategy}.`,
      `Month-end stats landed at money ${summary.statsAfter.money}, mood ${summary.statsAfter.mood}, stress ${summary.statsAfter.stress}, and academics ${summary.statsAfter.semesterAcademics}.`,
      `Most notable facts: ${summary.notableFacts.join(" ")}`,
      summary.resumeAdditions.length > 0
        ? `New resume items: ${summary.resumeAdditions.map((item) => item.title).join(", ")}.`
        : "No new resume items were added this month."
    ].join("\n")
  };
}

export function renderEndingReportFallback(input: EndingReportPromptInput): AiReportResult {
  const { summary } = input;

  return {
    kind: "ending_report",
    usedFallback: true,
    markdown: [
      "# Graduation Report",
      "",
      `Rule-layer outcome: **${summary.outcome}** in year ${summary.finalYear} with a long-term academic average of ${summary.longTermAcademicAverage}.`,
      `Resume highlights: ${summary.resumeHighlights.map((item) => item.title).join(", ")}.`,
      `Ending facts: ${summary.notableFacts.join(" ")}`,
      "This report rewrites existing facts only and does not perform any rule judgment."
    ].join("\n")
  };
}

function extractTextFromResponse(response: unknown): string | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const candidate = response as {
    output_text?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) {
    return candidate.output_text.trim();
  }

  const firstChoice = candidate.choices?.[0]?.message?.content;
  return typeof firstChoice === "string" && firstChoice.trim() ? firstChoice.trim() : undefined;
}

async function requestModelMarkdown(payload: AiPromptPayload): Promise<{ markdown?: string; model?: string }> {
  const client = createAiClient();
  const response = await client.responses.create({
    model: defaultModel,
    input: payload.messages
  });

  return {
    markdown: extractTextFromResponse(response),
    model: defaultModel
  };
}

export async function generateAiReport(input: AiReportRequest): Promise<AiReportResult> {
  const payload = getPromptPayload(input);

  if (!isAiConfigured()) {
    return input.kind === "monthly_journal"
      ? renderMonthlyJournalFallback(input)
      : renderEndingReportFallback(input);
  }

  try {
    const { markdown, model } = await requestModelMarkdown(payload);

    if (!markdown) {
      return input.kind === "monthly_journal"
        ? renderMonthlyJournalFallback(input)
        : renderEndingReportFallback(input);
    }

    return {
      kind: input.kind,
      markdown,
      model,
      usedFallback: false
    };
  } catch {
    return input.kind === "monthly_journal"
      ? renderMonthlyJournalFallback(input)
      : renderEndingReportFallback(input);
  }
}

export function getAiPresentationDebugInfo(input: AiReportRequest) {
  return {
    configured: isAiConfigured(),
    baseUrl: aiConfig.baseUrl,
    prompt: getPromptPayload(input)
  };
}

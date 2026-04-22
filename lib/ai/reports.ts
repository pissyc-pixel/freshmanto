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
      `# 第 ${year} 学年 第 ${month} 月月记`,
      "",
      `这个月我主要把精力放在：${summary.actions.join("、")}。课程策略选择的是「${summary.attendanceStrategy}」。`,
      `月末状态是：金钱 ${summary.statsAfter.money}，心情 ${summary.statsAfter.mood}，压力 ${summary.statsAfter.stress}，当学期学业值 ${summary.statsAfter.semesterAcademics}。`,
      `本月事实摘要：${summary.notableFacts.join(" ")}`,
      summary.resumeAdditions.length > 0
        ? `新增履历：${summary.resumeAdditions.map((item) => item.title).join("、")}。`
        : "这个月没有新增履历条目。"
    ].join("\n")
  };
}

export function renderEndingReportFallback(input: EndingReportPromptInput): AiReportResult {
  const { summary } = input;

  return {
    kind: "ending_report",
    usedFallback: true,
    markdown: [
      "# 毕业报告",
      "",
      `规则层判定的最终结果是：**${summary.outcome}**。结束学年为第 ${summary.finalYear} 学年，长期学业均值为 ${summary.longTermAcademicAverage}。`,
      `履历亮点：${summary.resumeHighlights.map((item) => item.title).join("、") || "暂无特别亮点"}。`,
      `关键事实：${summary.notableFacts.join(" ")}`,
      "这份报告只整理既有事实，不参与规则判定。"
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
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof candidate.output_text === "string" && candidate.output_text.trim()) {
    return candidate.output_text.trim();
  }

  const fromOutput = candidate.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text" && typeof item.text === "string");

  if (fromOutput?.text?.trim()) {
    return fromOutput.text.trim();
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


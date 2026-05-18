import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import { createAiClient } from "@/lib/ai/client";
import { aiConfig, getAiReportTimeoutMs, isAiConfigured } from "@/lib/ai/config";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import {
  formatAttendanceStrategy,
  formatEndingNotableFact,
  formatGraduationOutcome,
  formatMonthLabel,
} from "@/lib/demo/options";
import type {
  AiPromptPayload,
  AiReportRequest,
  AiReportResult,
  EndingReportPromptInput,
  MonthlyJournalPromptInput,
} from "@/types/ai";
import type { DynamicStats } from "@/types/game";

function getPromptPayload(input: AiReportRequest): AiPromptPayload {
  return input.kind === "monthly_journal"
    ? buildMonthlyJournalPrompt(input)
    : buildEndingReportPrompt(input);
}

function resolveConfiguredModel() {
  return aiConfig.model || "gpt-4.1-mini";
}

function formatMonthlyHeading(year: number, month: number) {
  return `第 ${year} 学年 第 ${month} 月`;
}

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function buildStatDeltaLine(statsDelta: DynamicStats) {
  return [
    `钱 ${formatSignedValue(statsDelta.money)}`,
    `心情 ${formatSignedValue(statsDelta.mood)}`,
    `压力 ${formatSignedValue(statsDelta.stress)}`,
    `学业 ${formatSignedValue(statsDelta.semesterAcademics)}`,
  ].join("，");
}

function emptyStatsDelta(): DynamicStats {
  return {
    money: 0,
    mood: 0,
    stress: 0,
    fulfillment: 0,
    social: 0,
    semesterAcademics: 0,
  };
}

function renderOutcomeSentence(input: EndingReportPromptInput): string {
  switch (input.summary.outcome) {
    case "graduate":
      return "我最后还是顺利毕业了。";
    case "delayed":
      return "我没能按原计划毕业，最后走到了延毕这一步。";
    case "cannot_graduate":
      return "大学这段路最后没停在“正常毕业”上，这件事我得认。";
    case "drop_out":
      return "这段大学路最后没有走到毕业，而是停在了肄业。";
    default:
      return `最后的结果是：${formatGraduationOutcome(input.summary.outcome)}。`;
  }
}

function renderMarkdownFactBlock(lead: string, facts: string[]) {
  return [lead, ...facts.map((fact) => `- ${fact}`)].join("\n");
}

export function buildMonthlyJournalRulesFallback(input: MonthlyJournalPromptInput) {
  const { summary, year, month } = input;
  const digest = buildMonthlyDiaryDigest(summary, year, month);
  const growthLog = buildGrowthJournalEntry(summary, year, month);
  const importantEvents =
    digest.keyMoments.length > 0
      ? digest.keyMoments.slice(0, 3).join("；")
      : "这个月没有额外的大事件，更多是日常安排一点点把状态推到了现在。";

  return {
    monthLabel: formatMonthLabel(year, month),
    heading: formatMonthlyHeading(year, month),
    intro: "这个月的月记暂时没写出来，但本月规则摘要仍然保留。",
    sections: [
      { label: "学业变化", text: digest.academicArc },
      { label: "压力 / 心情变化", text: digest.emotionalArc },
      { label: "金钱变化", text: digest.moneyArc },
      { label: "重要事件", text: importantEvents },
      {
        label: "方向变化",
        text: [digest.directionSignal, ...digest.futureSignals.slice(0, 2)].join(" "),
      },
    ],
    endStateLine: `月底状态：余额 ${digest.endState.money}，心情 ${digest.endState.mood}，压力 ${digest.endState.stress}，学业反馈“${digest.endState.feedback}”。`,
    growthTitle: growthLog.title,
  };
}

export function renderMonthlyJournalFallback(input: MonthlyJournalPromptInput): AiReportResult {
  const { summary, year, month } = input;
  const digest = buildMonthlyDiaryDigest(summary, year, month);
  const rulesFallback = buildMonthlyJournalRulesFallback(input);
  const statsDelta = summary.statsDelta ?? emptyStatsDelta();
  const attendanceStrategy = summary.attendanceStrategy ?? "mixed";

  return {
    kind: "monthly_journal",
    usedFallback: true,
    markdown: [
      `# ${rulesFallback.heading}`,
      "",
      rulesFallback.intro,
      "",
      ...rulesFallback.sections.map((section) => `- ${section.label}：${section.text}`),
      "",
      `课程态度：${formatAttendanceStrategy(attendanceStrategy)}。`,
      `主要行动：${digest.mainActions.join("、") || "这个月更多是在调状态和补节奏。"}。`,
      rulesFallback.endStateLine,
      `和月初比起来，${buildStatDeltaLine(statsDelta)}。`,
      `这条月度记录没有新增规则结果，只保留已经发生的事实。${rulesFallback.growthTitle}。`,
    ].join("\n"),
  };
}

export function renderEndingReportFallback(input: EndingReportPromptInput): AiReportResult {
  const { summary } = input;
  const endingFacts = (summary.notableFacts ?? []).map(formatEndingNotableFact);
  const highlights =
    summary.resumeHighlights.length > 0
      ? `回头看，最拿得出手的履历亮点是：${summary.resumeHighlights.map((item) => item.title).join("、")}。`
      : "回头翻履历，没有哪一页特别耀眼，但每一步都算我自己走出来的。";

  return {
    kind: "ending_report",
    usedFallback: true,
    markdown: [
      "# 毕业回望",
      "",
      renderOutcomeSentence(input),
      `如果把这四年的结果压成一句话，我最后拿到的是“${formatGraduationOutcome(summary.outcome)}”。长期学业表现大概停在 ${summary.longTermAcademicAverage}，写到这里时我已经走到了第 ${summary.finalYear} 学年。`,
      highlights,
      endingFacts.length > 0
        ? renderMarkdownFactBlock(
            "再回头看，最能说明这段路是怎么走过来的，其实是这些已经发生过的事：",
            endingFacts,
          )
        : "这份回望只整理已经存在的事实，不会替我补写不存在的故事。",
      "这份回望只是把已经发生的事重新说一遍，不会替我编出一个更体面或更糟的结局。",
    ].join("\n\n"),
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

  const fromChoice = extractChatMessageContent(candidate.choices?.[0]?.message?.content);
  return fromChoice?.trim() || undefined;
}

function extractChatMessageContent(content: unknown): string | undefined {
  if (typeof content === "string") {
    return content.trim() || undefined;
  }

  if (!Array.isArray(content)) {
    return undefined;
  }

  const joined = content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const part = item as { text?: unknown; type?: unknown };
      return part.type === "text" && typeof part.text === "string" ? part.text : "";
    })
    .join("")
    .trim();

  return joined || undefined;
}

class AiReportTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`AI report request timed out after ${timeoutMs}ms.`);
    this.name = "AiReportTimeoutError";
  }
}

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const withTimeout = async <T>(factory: (signal: AbortSignal) => Promise<T>) => {
    const requestPromise = factory(controller.signal);
    requestPromise.catch(() => undefined);

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new AiReportTimeoutError(timeoutMs));
      }, timeoutMs);
    });

    try {
      return await Promise.race([requestPromise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  return {
    withTimeout,
  };
}

function shouldRetryWithChatCompletions(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    status?: number;
    code?: string;
    message?: string;
  };
  const message = `${candidate.message ?? ""} ${candidate.code ?? ""}`.toLowerCase();

  return (
    candidate.status === 404 ||
    candidate.status === 405 ||
    candidate.status === 501 ||
    message.includes("responses") ||
    message.includes("not supported") ||
    message.includes("unknown request url")
  );
}

function logAiFailure(stage: string, error: unknown) {
  const candidate = error as {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
    type?: string;
  };

  console.error("[monthly-journal-ai]", {
    stage,
    errorName: candidate?.name ?? "UnknownError",
    errorType: candidate?.type ?? null,
    status: candidate?.status ?? null,
    code: candidate?.code ?? null,
    message: candidate?.message ?? "Unknown AI error",
    model: resolveConfiguredModel(),
    hasBaseUrl: Boolean(aiConfig.baseUrl),
    timeoutMs: aiConfig.reportTimeoutMs,
  });
}

async function requestModelMarkdown(payload: AiPromptPayload): Promise<{ markdown?: string; model?: string }> {
  const client = createAiClient();
  const timeoutMs = getAiReportTimeoutMs();
  const model = resolveConfiguredModel();
  const requestRunner = createTimeoutController(timeoutMs);

  try {
    const response = await requestRunner.withTimeout((signal) =>
      client.responses.create(
        {
          model,
          input: payload.messages,
        },
        {
          signal,
        },
      ),
    );

    return {
      markdown: extractTextFromResponse(response),
      model,
    };
  } catch (error) {
    if (!shouldRetryWithChatCompletions(error)) {
      throw error;
    }

    const response = await requestRunner.withTimeout((signal) =>
      client.chat.completions.create(
        {
          model,
          messages: payload.messages,
        },
        {
          signal,
        },
      ),
    );

    return {
      markdown: extractTextFromResponse(response),
      model,
    };
  }
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
      logAiFailure("empty-response", new Error("Model response did not contain text."));
      return input.kind === "monthly_journal"
        ? renderMonthlyJournalFallback(input)
        : renderEndingReportFallback(input);
    }

    return {
      kind: input.kind,
      markdown,
      model,
      usedFallback: false,
    };
  } catch (error) {
    logAiFailure("request-failed", error);
    return input.kind === "monthly_journal"
      ? renderMonthlyJournalFallback(input)
      : renderEndingReportFallback(input);
  }
}

export function getAiPresentationDebugInfo(input: AiReportRequest) {
  const payload = getPromptPayload(input);

  return {
    configured: isAiConfigured(),
    customBaseUrlConfigured: Boolean(aiConfig.baseUrl),
    model: resolveConfiguredModel(),
    timeoutMs: aiConfig.reportTimeoutMs,
    prompt: {
      contract: payload.contract,
      messages: payload.messages,
    },
  };
}

import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import { createAiClient } from "@/lib/ai/client";
import { aiConfig, getAiReportTimeoutMs, isAiConfigured } from "@/lib/ai/config";
import { buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import {
  formatEndingNotableFact,
  formatGraduationOutcome,
  formatMonthLabel,
} from "@/lib/demo/options";
import { sanitizePlayerFacingText } from "@/lib/player-facing-text";
import type {
  AiPromptPayload,
  AiReportRequest,
  AiReportResult,
  EndingReportPromptInput,
  MonthlyJournalPromptInput,
} from "@/types/ai";

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

function renderOutcomeSentence(input: EndingReportPromptInput): string {
  switch (input.summary.outcome) {
    case "graduate":
      return "我最后还是顺利毕业了。";
    case "delayed":
      return "我没能按原计划毕业，最后走到了延毕这一步。";
    case "cannot_graduate":
      return `大学这段路最后没停在"正常毕业"上，这件事我得认。`;
    case "drop_out":
      return "这段大学路最后没有走到毕业，而是停在了肄业。";
    default:
      return `最后的结果是：${formatGraduationOutcome(input.summary.outcome)}。`;
  }
}

function renderMarkdownFactBlock(lead: string, facts: string[]) {
  return [lead, ...facts.map((fact) => `- ${fact}`)].join("\n");
}

const JOURNAL_FORBIDDEN_PATTERNS = [
  /余额\s*\d+/,
  /心情\s*\d+/,
  /压力\s*\d+/,
  /学业\s*[+-]?\d+/,
  /moneyDelta|statsDelta|eventIds|runId|sourceId|artifactId|category|delta|academic|stress|mood/gi,
  /\b(project|internship|scholarship|monthly|fallback|employment|nankai_tianda)\b/gi,
  /整体而言|这个月主要|综上|总体来说|月度状态|本月数据如下/g,
];

function hasUnsafeJournalMarkers(text: string) {
  return JOURNAL_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

function shouldFallbackToSafeJournal(text: string) {
  return hasUnsafeJournalMarkers(text);
}

function monthDetail(month: number) {
  const details = ["宿舍灯关了一半", "手机备忘录停在最后一行", "食堂的汤有点凉", "书桌边还压着一页草稿纸"];
  return details[(Math.max(month, 1) - 1) % details.length]!;
}

function feelingAboutMoney(value: number) {
  if (value <= 250) {
    return "月底翻到余额的时候，心里还是会先紧一下。";
  }
  if (value <= 700) {
    return "手头不算宽松，花钱前还是会先停一下。";
  }
  return "手头还算能转开，但也远没到敢随便花的时候。";
}

function feelingAboutStress(value: number) {
  if (value >= 75) {
    return "这阵子脑子一直绷着，躺下去也没有真的松掉。";
  }
  if (value >= 60) {
    return "整个月都像是拎着一根线，没断，但也不太敢松。";
  }
  return "压力没有彻底退下去，只是终于没再往上顶。";
}

function feelingAboutAcademics(feedback: string) {
  if (feedback === "excellent") {
    return "课业这边终于有点稳住的样子，不用每次都靠临时补回来。";
  }
  if (feedback === "stable") {
    return "课业这边至少没有再往下掉，慢慢能接住自己。";
  }
  return "课业还是会让我反复回头补，可总不能一直装没看见。";
}

function buildJournalTitle(input: MonthlyJournalPromptInput) {
  return `${formatMonthLabel(input.year, input.month)}的月记`;
}

export function buildMonthlyJournalRulesFallback(input: MonthlyJournalPromptInput) {
  const { summary, year, month } = input;
  const digest = buildMonthlyDiaryDigest(summary, year, month);
  const detail = monthDetail(month);
  const actionLine = digest.mainActions.length > 0 ? `这一个月大多时候都在忙${digest.mainActions.slice(0, 2).join("和")}。` : "这一个月像是在先把日子勉强排顺。";
  const keyMoment = digest.keyMoments[0] ? `真要说最记得住的，还是${digest.keyMoments[0]}。` : "真要说最记得住的，也不是哪件大事，就是那种一直往前顶的小疲惫。";
  const futureLine = digest.futureSignals[0] ? `我知道后面还会碰到${digest.futureSignals[0]}，只是现在还没想好要怎么讲得更轻一点。` : "我知道后面还有东西在等着我，可我现在也还没把那口气完全顺下来。";

  return {
    monthLabel: formatMonthLabel(year, month),
    heading: formatMonthlyHeading(year, month),
    title: buildJournalTitle(input),
    diary: [
      `晚上把${detail}的时候，我才想起来这个月其实已经过去了。我没那么会总结，只知道自己一直在往前赶，赶到后来连白天和晚上都快叠在一起了。`,
      `${actionLine}${feelingAboutAcademics(digest.endState.feedback)} ${feelingAboutStress(digest.endState.stress)}`,
      `${feelingAboutMoney(digest.endState.money)} ${keyMoment}有时候也会觉得自己像是一直没彻底坐下过，但是事情又确实被一点点推到了眼前。`,
      futureLine,
    ]
      .map((paragraph) => sanitizePlayerFacingText(paragraph))
      .join("\n\n"),
    endStateLine: sanitizePlayerFacingText("我把这个月记下来，不是因为已经想明白了，只是怕再往后走，会忘了自己是怎么撑到这里的。"),
  };
}

export function renderMonthlyJournalFallback(input: MonthlyJournalPromptInput): AiReportResult {
  const rulesFallback = buildMonthlyJournalRulesFallback(input);
  const markdown = [
    `# ${rulesFallback.monthLabel}`,
    "",
    `## ${rulesFallback.title}`,
    "",
    rulesFallback.diary,
    "",
    rulesFallback.endStateLine,
  ].join("\n");

  return {
    kind: "monthly_journal",
    usedFallback: true,
    markdown: shouldFallbackToSafeJournal(markdown)
      ? [
          `# ${rulesFallback.monthLabel}`,
          "",
          `## ${rulesFallback.title}`,
          "",
          "我把这个月记在手机备忘录里，更多像是怕自己一转身就把这些细小的感受弄丢了。",
          "",
          "有些事其实已经在往前走了，只是我还没学会用很轻松的语气把它们说出来。宿舍灯灭下来之后，我才发现自己还在想着下个月会不会好一点。",
        ].join("\n")
      : markdown,
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
      `如果把这四年的结果压成一句话，我最后拿到的是"${formatGraduationOutcome(summary.outcome)}"。长期学业表现大概停在 ${summary.longTermAcademicAverage}，写到这里时我已经走到了第 ${summary.finalYear} 学年。`,
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

    const safeMarkdown =
      input.kind === "monthly_journal"
        ? shouldFallbackToSafeJournal(markdown)
          ? renderMonthlyJournalFallback(input).markdown
          : sanitizePlayerFacingText(markdown)
        : sanitizePlayerFacingText(markdown);

    return {
      kind: input.kind,
      markdown: safeMarkdown,
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

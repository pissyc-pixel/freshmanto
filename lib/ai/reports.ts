import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import { createAiClient } from "@/lib/ai/client";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import {
  formatAttendanceStrategy,
  formatEndingNotableFact,
  formatGraduationOutcome,
  formatSemesterFeedback,
} from "@/lib/demo/options";
import type {
  AiPromptPayload,
  AiReportRequest,
  AiReportResult,
  EndingReportPromptInput,
  MonthlyJournalPromptInput,
} from "@/types/ai";
import type { DynamicStats } from "@/types/game";

const defaultModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

function getPromptPayload(input: AiReportRequest): AiPromptPayload {
  return input.kind === "monthly_journal"
    ? buildMonthlyJournalPrompt(input)
    : buildEndingReportPrompt(input);
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

export function renderMonthlyJournalFallback(input: MonthlyJournalPromptInput): AiReportResult {
  const { summary, year, month } = input;
  const digest = buildMonthlyDiaryDigest(summary, year, month);
  const growthLog = buildGrowthJournalEntry(summary, year, month);
  const statsDelta = summary.statsDelta ?? emptyStatsDelta();
  const attendanceStrategy = summary.attendanceStrategy ?? "mixed";
  const groundedFacts =
    digest.keyMoments.length > 0
      ? renderMarkdownFactBlock("这个月我还记得的几件事：", digest.keyMoments.slice(0, 5))
      : "这个月没有特别戏剧化的大事，更多还是日常一点点往前挪。";
  const resumeText =
    digest.resumeHighlights.length > 0
      ? `这个月至少还留下了几件以后回头能看见的东西：${digest.resumeHighlights.join("、")}。`
      : "这个月没有新增很硬的履历亮点，但日子本身也不算白过。";

  return {
    kind: "monthly_journal",
    usedFallback: true,
    markdown: [
      `# ${formatMonthlyHeading(year, month)}`,
      "",
      `这个月我主要把时间放在${digest.mainActions.join("、") || "把节奏稳住"}上，上课这边基本按“${formatAttendanceStrategy(attendanceStrategy)}”的节奏往前走。`,
      digest.emotionalArc,
      `月底再看账和状态，我手里还剩 ${digest.endState.money}，心情在 ${digest.endState.mood}，压力到 ${digest.endState.stress}，学业线停在 ${digest.endState.semesterAcademics}。`,
      `和月初比起来，${buildStatDeltaLine(statsDelta)}。如果非要用一句话概括这个月的学业状态，大概就是“${formatSemesterFeedback(summary.academicFeedback ?? "stable")}”。`,
      groundedFacts,
      resumeText,
      `写到这里，这个月差不多也算真的翻过去了一页。${growthLog.title}`,
    ].join("\n\n"),
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
        ? renderMarkdownFactBlock("再回头看，最能说明这段路是怎么走过来的，其实是这些已经发生过的事：", endingFacts)
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

  const firstChoice = candidate.choices?.[0]?.message?.content;
  return typeof firstChoice === "string" && firstChoice.trim() ? firstChoice.trim() : undefined;
}

async function requestModelMarkdown(payload: AiPromptPayload): Promise<{ markdown?: string; model?: string }> {
  const client = createAiClient();
  const response = await client.responses.create({
    model: defaultModel,
    input: payload.messages,
  });

  return {
    markdown: extractTextFromResponse(response),
    model: defaultModel,
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
      usedFallback: false,
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
    prompt: getPromptPayload(input),
  };
}

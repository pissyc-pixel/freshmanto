import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import { createAiClient } from "@/lib/ai/client";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";
import {
  buildPlayerFacingMonthlyLog,
  formatActionType,
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
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function buildStatDeltaLine(statsDelta: DynamicStats) {
  return [
    `钱 ${formatSignedValue(statsDelta.money)} 元`,
    `心情 ${formatSignedValue(statsDelta.mood)}`,
    `压力 ${formatSignedValue(statsDelta.stress)}`,
    `学业 ${formatSignedValue(statsDelta.semesterAcademics)}`,
  ].join("，");
}

function renderMonthlyMoodLine(input: MonthlyJournalPromptInput): string {
  const { summary } = input;

  if (summary.eventIds.includes("academic-scholarship")) {
    return "最直接的感受是，前面那些硬撑着熬过去的日子，这个月终于有了一点看得见的回响。";
  }

  if (summary.statsDelta.semesterAcademics >= 10) {
    return "学业这条线总算被我一点点拉了回来，过程不轻松，但月底回头看还是能感觉到差别。";
  }

  if (summary.statsDelta.stress >= 8) {
    return "整个月都像在赶路，很多事情不是从容安排出来的，而是咬着牙一件件顶过去的。";
  }

  if (summary.statsDelta.fulfillment >= 8 || summary.statsDelta.mood >= 8) {
    return "虽然也忙，但月末回头看，多少还是会觉得自己这段时间没白折腾。";
  }

  return "它不算特别戏剧化，但情绪和生活节奏都确实留在了这个月里。";
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

function renderMarkdownFactBlock(lead: string, facts: string[]): string {
  return [lead, ...facts.map((fact) => `- ${fact}`)].join("\n");
}

export function renderMonthlyJournalFallback(input: MonthlyJournalPromptInput): AiReportResult {
  const { summary, year, month } = input;
  const playerLog = buildPlayerFacingMonthlyLog(summary, year, month);
  const actionText = summary.actions.map(formatActionType).join("、");
  const resumeText =
    summary.resumeAdditions.length > 0
      ? `这个月多少还是留下了一点以后回头能看见的东西：${summary.resumeAdditions
          .map((item) => item.title)
          .join("、")}。`
      : "这个月没有新增履历条目，但生活本身也不是白过。";
  const groundedFacts =
    playerLog.details.length > 0
      ? renderMarkdownFactBlock("我还记得的几件事：", playerLog.details.slice(0, 5))
      : "这个月没有额外被记下来的大事，更多是日常一点点往前挪。";

  return {
    kind: "monthly_journal",
    usedFallback: true,
    markdown: [
      `# ${formatMonthlyHeading(year, month)}`,
      "",
      `这个月我主要把时间放在 ${actionText || "调整状态"} 上，上课这边基本按「${formatAttendanceStrategy(summary.attendanceStrategy)}」的节奏往前走。`,
      renderMonthlyMoodLine(input),
      `月底再看账和状态，我手里还剩 ${summary.statsAfter.money} 块，心情在 ${summary.statsAfter.mood}，压力到了 ${summary.statsAfter.stress}，学业线停在 ${summary.statsAfter.semesterAcademics}。`,
      `和月初比起来，${buildStatDeltaLine(summary.statsDelta)}。`,
      `如果非要用一句话概括这个月的学业状态，那大概就是「${formatSemesterFeedback(summary.academicFeedback)}」。`,
      groundedFacts,
      resumeText,
      "写到这里，这个月也算真的翻过去了一页。",
    ].join("\n\n"),
  };
}

export function renderEndingReportFallback(input: EndingReportPromptInput): AiReportResult {
  const { summary } = input;
  const endingFacts = summary.notableFacts.map(formatEndingNotableFact);
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
      `如果把这四年的结果压成一句话，我最后拿到的是「${formatGraduationOutcome(summary.outcome)}」。长期学业表现大概停在 ${summary.longTermAcademicAverage}，写到这里时我已经走到了第 ${summary.finalYear} 学年。`,
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

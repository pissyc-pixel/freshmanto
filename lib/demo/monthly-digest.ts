import {
  formatActionType,
  formatAttendanceStrategy,
  formatMonthLabel,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatSemesterFeedback,
} from "@/lib/demo/options";
import type { StructuredMonthlySummary } from "@/types/game";

export type GrowthJournalEntry = {
  badge: string;
  periodLabel: string;
  title: string;
  message: string;
  details: string[];
};

export type MonthlyDiaryDigest = {
  monthLabel: string;
  attendanceStrategy: string;
  mainActions: string[];
  coreChanges: string[];
  emotionalArc: string;
  academicArc: string;
  moneyArc: string;
  resumeHighlights: string[];
  keyMoments: string[];
  endState: {
    money: number;
    mood: number;
    stress: number;
    semesterAcademics: number;
    feedback: string;
  };
};

function uniqueStrings(items: Array<string | undefined | null>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function summarizeEmotionalArc(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.stress >= 8) {
    return "这个月明显是在顶着压力往前赶，很多时候不是从容安排，而是硬把事情往下推。";
  }

  if (summary.statsDelta.mood >= 6 || summary.statsDelta.fulfillment >= 6) {
    return "虽然也忙，但月底回头看，心里至少还是有一点“这段时间没白过”的感觉。";
  }

  if (summary.flags.includes("burnout-slump") || summary.flags.includes("state-refused-study")) {
    return "状态波动比想象中大，有些事情不是不想做，而是真的提不起劲。";
  }

  return "情绪上没有特别戏剧化的转折，但整个月的节奏确实留下了痕迹。";
}

function summarizeAcademicArc(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.semesterAcademics >= 10) {
    return "学业线这月是往上走的，至少不是原地打转。";
  }

  if (summary.statsDelta.semesterAcademics <= 0) {
    return "学业这条线没有真正抬起来，还得继续补。";
  }

  return `学业反馈最后落在“${formatSemesterFeedback(summary.academicFeedback)}”，只能算缓慢往前。`;
}

function summarizeMoneyArc(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.money <= -600) {
    return "这个月花销感很明显，钱对选择的影响一直都在。";
  }

  if (summary.statsDelta.money >= 300) {
    return "这个月在钱上稍微缓过来了一点，手头没那么紧。";
  }

  return "钱不是这个月唯一的问题，但它一直在背景里影响节奏。";
}

function buildCoreChanges(summary: StructuredMonthlySummary) {
  return uniqueStrings([
    summary.statsDelta.semesterAcademics !== 0 ? `学业 ${summary.statsDelta.semesterAcademics > 0 ? "+" : ""}${summary.statsDelta.semesterAcademics}` : null,
    summary.statsDelta.money !== 0 ? `钱 ${summary.statsDelta.money > 0 ? "+" : ""}${summary.statsDelta.money}` : null,
    summary.statsDelta.mood !== 0 ? `心情 ${summary.statsDelta.mood > 0 ? "+" : ""}${summary.statsDelta.mood}` : null,
    summary.statsDelta.stress !== 0 ? `压力 ${summary.statsDelta.stress > 0 ? "+" : ""}${summary.statsDelta.stress}` : null,
    summary.statsDelta.social !== 0 ? `社交 ${summary.statsDelta.social > 0 ? "+" : ""}${summary.statsDelta.social}` : null,
    summary.statsDelta.fulfillment !== 0 ? `成就感 ${summary.statsDelta.fulfillment > 0 ? "+" : ""}${summary.statsDelta.fulfillment}` : null,
  ]);
}

function buildKeyMoments(summary: StructuredMonthlySummary) {
  return uniqueStrings([
    ...summary.eventIds.map((eventId) => formatPlayerFacingFact(`event:${eventId}`)),
    ...summary.notableFacts.map((fact) => formatPlayerFacingFact(fact)),
    ...summary.flags.map((flag) => formatPlayerFacingFlag(flag)),
    ...summary.resumeAdditions.map((item) => `这个月留下了“${item.title}”这类能写进履历的经历。`),
  ]).slice(0, 6);
}

function buildTitle(summary: StructuredMonthlySummary) {
  if (summary.eventIds.includes("academic-scholarship")) {
    return "这个月终于感觉到努力开始有回音了";
  }

  if (summary.statsDelta.stress >= 8) {
    return "这个月过得有点赶，也有点硬撑";
  }

  if (summary.resumeAdditions.length > 0) {
    return "这个月不只是忙，多少还留下了一点能回头看的东西";
  }

  return "这个月还在学业、生活和情绪之间找平衡";
}

export function buildMonthlyDiaryDigest(
  summary: StructuredMonthlySummary,
  year: number,
  month: number,
): MonthlyDiaryDigest {
  const mainActions = uniqueStrings(summary.actions.map((action) => formatActionType(action))).slice(0, 4);

  return {
    monthLabel: formatMonthLabel(year, month),
    attendanceStrategy: formatAttendanceStrategy(summary.attendanceStrategy),
    mainActions,
    coreChanges: buildCoreChanges(summary),
    emotionalArc: summarizeEmotionalArc(summary),
    academicArc: summarizeAcademicArc(summary),
    moneyArc: summarizeMoneyArc(summary),
    resumeHighlights: summary.resumeAdditions.map((item) => item.title).slice(0, 3),
    keyMoments: buildKeyMoments(summary),
    endState: {
      money: summary.statsAfter.money,
      mood: summary.statsAfter.mood,
      stress: summary.statsAfter.stress,
      semesterAcademics: summary.statsAfter.semesterAcademics,
      feedback: formatSemesterFeedback(summary.academicFeedback),
    },
  };
}

export function buildGrowthJournalEntry(
  summary: StructuredMonthlySummary,
  year: number,
  month: number,
): GrowthJournalEntry {
  const digest = buildMonthlyDiaryDigest(summary, year, month);
  const actionLead = digest.mainActions.join("、");
  const detailLines = uniqueStrings([
    digest.academicArc,
    digest.moneyArc,
    ...digest.keyMoments,
  ]).slice(0, 5);

  return {
    badge: "成长日志",
    periodLabel: digest.monthLabel,
    title: buildTitle(summary),
    message: `这个月主要围着${actionLead || "把节奏稳住"}在转。课程态度是“${digest.attendanceStrategy}”，最直接的状态变化是${digest.coreChanges.join("、") || "没有特别剧烈的波动"}。${digest.emotionalArc}`,
    details: detailLines,
  };
}

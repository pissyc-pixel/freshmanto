import {
  formatActionType,
  formatAttendanceStrategy,
  formatMonthLabel,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatSemesterFeedback,
} from "@/lib/demo/options";
import type { DirectionKey, StructuredMonthlySummary } from "@/types/game";

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
  directionSignal: string;
  futureSignals: string[];
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

function formatDirectionLabel(direction: DirectionKey) {
  return {
    employment: "就业",
    postgraduate: "考研",
    public_exam: "考公",
    recommendation: "推免",
    undecided: "未定",
  }[direction];
}

function summarizeEmotionalArc(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.stress >= 8) {
    return "这个月明显是在顶着压力往前赶，很多时候不是从容安排，而是硬把事情往下推。";
  }

  if (summary.statsDelta.mood >= 6 || summary.statsDelta.fulfillment >= 6) {
    return "虽然也忙，但月底回头看，心里至少还有一点“这段时间没白过”的感觉。";
  }

  if (summary.flags.includes("burnout-slump") || summary.flags.includes("state-refused-study")) {
    return "状态波动比想象中大，有些事情不是不想做，而是真的提不起劲。";
  }

  return "情绪上没有特别戏剧化的转折，但整个月的节奏确实留下了痕迹。";
}

function summarizeAcademicArc(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.semesterAcademics >= 10) {
    return "学业线这个月是在往上走的，至少不是原地打转。";
  }

  if (summary.statsDelta.semesterAcademics <= 0) {
    return "学业这条线还没真正抬起来，后面还得继续补。";
  }

  return `学业反馈最后落在“${formatSemesterFeedback(summary.academicFeedback)}”，更像是在慢慢往前挪。`;
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

function formatLongTermFact(fact: string): string | null {
  if (fact.startsWith("competition:")) {
    const [, title, result] = fact.split(":");
    if (result === "unfinished") {
      return `这学期手里的“${title}”最后没够到能交成果的投入线。`;
    }
    return `这学期在“${title}”上终于拿到了一次 ${result} 的结果。`;
  }

  if (fact.startsWith("recommendation:")) {
    const status = fact.split(":")[1];
    if (status === "eligible") {
      return "大三下第一次比较明确地看见了推免资格，这条线开始变得很具体。";
    }
    if (status === "borderline") {
      return "大三下已经到了可以争一争推免资格的位置，只是还不算特别稳。";
    }
    return "大三下也做过一次推免资格判断，只是眼下离那条线还有距离。";
  }

  if (fact.startsWith("scholarship:")) {
    const level = fact.split(":")[1];
    if (level === "high") {
      return "新学年一开始就拿到了高等级奖学金，前一年的积累终于有了很具体的回音。";
    }
    if (level === "standard") {
      return "新学年开头拿到了一笔普通奖学金，至少说明前一年的努力不是白做。";
    }
    return "新学年一开始没有等来奖学金，这件事本身也提醒了后面要往哪里补。";
  }

  return null;
}

function buildDirectionSignal(summary: StructuredMonthlySummary) {
  const direction = summary.progression?.dominantDirection ?? "undecided";

  if (direction === "undecided") {
    return "这个月更像是在继续打底子，方向感开始冒头，但还没有真正收束。";
  }

  const label = formatDirectionLabel(direction);
  const publicExamProgress = summary.progression?.publicExam.progress ?? 0;
  const postgraduateProgress = summary.progression?.postgraduateProgress ?? 0;
  const recommendationQualification = summary.progression?.recommendationQualification ?? "pending";

  if (direction === "recommendation") {
    if (recommendationQualification === "eligible") {
      return "这个月会很明显地感觉到，自己已经不只是成绩还行，而是真的开始长成一份推免画像。";
    }
    if (recommendationQualification === "borderline") {
      return "这个月开始像是在往推免那条路靠，只是优势和短板都已经越来越具体。";
    }
  }

  if (direction === "public_exam" && publicExamProgress >= 20) {
    return "这个月之后，考公不再只是嘴上说说，而是开始变成一条有连续投入的路线。";
  }

  if (direction === "postgraduate" && postgraduateProgress >= 20) {
    return "这个月看得出来，你已经在把时间慢慢往考研和继续深造那边压。";
  }

  if (direction === "employment") {
    return "这个月留下来的经历越来越像在给就业铺路，未来方向正在往实践和求职那边偏。";
  }

  return `这个月会隐约意识到，自己正在慢慢往“${label}”这条路靠。`;
}

function buildFutureSignals(summary: StructuredMonthlySummary) {
  return uniqueStrings([
    summary.progression?.recommendationQualification === "eligible"
      ? "学业和履历已经撑起了比较明确的推免竞争力。"
      : summary.progression?.recommendationQualification === "borderline"
        ? "推免已经摸到边缘，后面几次结果会特别关键。"
        : null,
    (summary.progression?.publicExam.progress ?? 0) >= 20
      ? `公考进度已经到 ${summary.progression?.publicExam.progress}，说明这条线开始有连续投入。`
      : null,
    (summary.progression?.postgraduateProgress ?? 0) >= 20
      ? "考研准备已经不是零散尝试，而是有节奏地往前推。"
      : null,
    summary.scholarshipAwarded?.level === "high"
      ? "奖学金结果会直接抬高这学期的信心，也会让深造线更有现实感。"
      : summary.scholarshipAwarded?.level === "standard"
        ? "奖学金至少说明你前一年的表现稳住了，不是白忙。"
        : null,
    ...summary.notableFacts.map((fact) => formatLongTermFact(fact)),
  ]).slice(0, 4);
}

function buildCoreChanges(summary: StructuredMonthlySummary) {
  return uniqueStrings([
    summary.statsDelta.semesterAcademics !== 0 ? `学业 ${summary.statsDelta.semesterAcademics > 0 ? "+" : ""}${summary.statsDelta.semesterAcademics}` : null,
    summary.statsDelta.money !== 0 ? `钱 ${summary.statsDelta.money > 0 ? "+" : ""}${summary.statsDelta.money}` : null,
    summary.statsDelta.mood !== 0 ? `心情 ${summary.statsDelta.mood > 0 ? "+" : ""}${summary.statsDelta.mood}` : null,
    summary.statsDelta.stress !== 0 ? `压力 ${summary.statsDelta.stress > 0 ? "+" : ""}${summary.statsDelta.stress}` : null,
    summary.statsDelta.social !== 0 ? `社交 ${summary.statsDelta.social > 0 ? "+" : ""}${summary.statsDelta.social}` : null,
    summary.statsDelta.fulfillment !== 0 ? `成就感 ${summary.statsDelta.fulfillment > 0 ? "+" : ""}${summary.statsDelta.fulfillment}` : null,
    summary.progression?.publicExam.progress ? `公考进度 ${summary.progression.publicExam.progress}` : null,
  ]);
}

function buildKeyMoments(summary: StructuredMonthlySummary, directionSignal: string) {
  return uniqueStrings([
    directionSignal,
    ...summary.eventIds.map((eventId) => formatPlayerFacingFact(`event:${eventId}`)),
    ...summary.notableFacts.map((fact) => formatLongTermFact(fact) ?? formatPlayerFacingFact(fact)),
    ...summary.flags.map((flag) => formatPlayerFacingFlag(flag)),
    ...summary.resumeAdditions.map((item) => `这个月留下了“${item.title}”这种能写进履历的经历。`),
    summary.scholarshipAwarded && summary.scholarshipAwarded.level !== "none"
      ? `新学年开头拿到了${summary.scholarshipAwarded.title}。`
      : null,
  ]).slice(0, 6);
}

function buildTitle(summary: StructuredMonthlySummary) {
  if (summary.scholarshipAwarded?.level === "high") {
    return "这个月终于尝到一点被回报的感觉";
  }

  if (summary.progression?.dominantDirection === "recommendation") {
    return "这个月开始有点像真的在往推免那条路走";
  }

  if (summary.progression?.dominantDirection === "public_exam") {
    return "这个月之后，未来方向第一次没那么散了";
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
  const directionSignal = buildDirectionSignal(summary);

  return {
    monthLabel: formatMonthLabel(year, month),
    attendanceStrategy: formatAttendanceStrategy(summary.attendanceStrategy),
    mainActions,
    coreChanges: buildCoreChanges(summary),
    emotionalArc: summarizeEmotionalArc(summary),
    academicArc: summarizeAcademicArc(summary),
    moneyArc: summarizeMoneyArc(summary),
    directionSignal,
    futureSignals: buildFutureSignals(summary),
    resumeHighlights: summary.resumeAdditions.map((item) => item.title).slice(0, 3),
    keyMoments: buildKeyMoments(summary, directionSignal),
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
    digest.directionSignal,
    ...digest.futureSignals,
    digest.academicArc,
    digest.moneyArc,
    ...digest.keyMoments,
  ]).slice(0, 6);

  return {
    badge: "成长日志",
    periodLabel: digest.monthLabel,
    title: buildTitle(summary),
    message: `这个月主要围着${actionLead || "把节奏稳住"}在转。课程态度是“${digest.attendanceStrategy}”，最直接的状态变化是${digest.coreChanges.join("、") || "没有特别剧烈的波动"}。这些事也在把未来方向慢慢推出来：${digest.directionSignal}${digest.emotionalArc}`,
    details: detailLines,
  };
}

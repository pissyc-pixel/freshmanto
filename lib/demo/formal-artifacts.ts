import type {
  FutureOffer,
  GameRun,
  GraduationPath,
  RecommendationQualification,
  ResumeItem,
  ScholarshipRecord,
  StructuredEndingSummary,
} from "@/types/game";

export type FormalArtifactKind =
  | "scholarship"
  | "competition"
  | "internship"
  | "recommendation"
  | "postgraduate"
  | "employment"
  | "ending";

export type FormalArtifact = {
  id: string;
  kind: FormalArtifactKind;
  title: string;
  subtitle: string;
  summary: string;
  issuer: string;
  serialNumber: string;
  sealLabel: string;
  badgeLabel: string;
  badgeTone: "academic" | "resume" | "event" | "ending" | "money" | "warning";
  facts: string[];
  periodLabel: string;
  monthIndex: number;
  offerId?: string;
  offerType?: FutureOffer["type"];
  accepted?: boolean;
  rejected?: boolean;
};

function clampMonthIndex(value: number) {
  return Math.max(1, value);
}

function toMonthIndex(year: number, month: number) {
  return clampMonthIndex((year - 1) * 12 + month);
}

function extractYearMonthFromResumeId(item: ResumeItem) {
  const matches = [...item.id.matchAll(/-(\d+)-(\d+)-/g)];
  const lastMatch = matches.at(-1);

  if (!lastMatch) {
    return null;
  }

  const year = Number(lastMatch[1]);
  const month = Number(lastMatch[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return { year, month };
}

function monthLabelFromResumeItem(item: ResumeItem) {
  const parsed = extractYearMonthFromResumeId(item);

  if (!parsed) {
    return `第 ${item.month} 月`;
  }

  return `第 ${toMonthIndex(parsed.year, parsed.month)} 月`;
}

function monthIndexFromResumeItem(item: ResumeItem) {
  const parsed = extractYearMonthFromResumeId(item);

  if (!parsed) {
    return clampMonthIndex(item.month);
  }

  return toMonthIndex(parsed.year, parsed.month);
}

function createSerialNumber(prefix: string, monthIndex: number, suffix: string) {
  return `${prefix}-${String(monthIndex).padStart(2, "0")}-${suffix.slice(-4).toUpperCase()}`;
}

function latest<T extends { monthIndex: number }>(items: T[], limit?: number) {
  const sorted = items.slice().sort((left, right) => right.monthIndex - left.monthIndex);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

function normalizeFactList(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim().length > 0)).slice(0, 4);
}

function recommendationBadge(status: RecommendationQualification) {
  switch (status) {
    case "accepted":
      return {
        label: "已接收",
        tone: "ending" as const,
      };
    case "eligible":
      return {
        label: "资格成立",
        tone: "academic" as const,
      };
    case "borderline":
      return {
        label: "边缘资格",
        tone: "warning" as const,
      };
    default:
      return {
        label: "仍在观察",
        tone: "warning" as const,
      };
  }
}

function buildScholarshipArtifact(record: ScholarshipRecord): FormalArtifact | null {
  if (record.level === "none") {
    return null;
  }

  const monthIndex = record.academicYear * 12 + 1;

  return {
    id: `scholarship-${record.id}`,
    kind: "scholarship",
    title: "奖学金证书",
    subtitle: record.title,
    summary: record.reason,
    issuer: "学生资助与发展中心",
    serialNumber: createSerialNumber("SCH", monthIndex, record.id),
    sealLabel: record.level === "high" ? "重点表彰" : "正式发放",
    badgeLabel: record.level === "high" ? "高等级奖学金" : "奖学金发放",
    badgeTone: "money",
    facts: normalizeFactList([
      `发放金额：¥${record.amount}`,
      `对应学年：第 ${record.academicYear} 学年`,
      record.level === "high" ? "结果级别：高等级" : "结果级别：常规奖学金",
    ]),
    periodLabel: `第 ${monthIndex} 月`,
    monthIndex,
  };
}

function buildCompetitionArtifact(item: ResumeItem): FormalArtifact {
  return {
    id: `competition-${item.id}`,
    kind: "competition",
    title: "竞赛评奖归档",
    subtitle: item.title,
    summary: item.summary,
    issuer: "竞赛与项目成果归档组",
    serialNumber: createSerialNumber("CMP", monthIndexFromResumeItem(item), item.id),
    sealLabel: "已评定",
    badgeLabel: "竞赛成果",
    badgeTone: "event",
    facts: normalizeFactList([
      item.tags.find((tag) => ["national", "provincial", "school"].includes(tag)) ?? null,
      item.tags.find((tag) => ["first", "second", "third"].includes(tag)) ?? null,
      item.tags.at(0) ?? null,
    ]),
    periodLabel: monthLabelFromResumeItem(item),
    monthIndex: monthIndexFromResumeItem(item),
  };
}

function buildInternshipArtifact(item: ResumeItem): FormalArtifact {
  return {
    id: `internship-${item.id}`,
    kind: "internship",
    title: "实习机会函",
    subtitle: item.title,
    summary: item.summary,
    issuer: "实践机会归档中心",
    serialNumber: createSerialNumber("INT", monthIndexFromResumeItem(item), item.id),
    sealLabel: "已收录",
    badgeLabel: "实践机会",
    badgeTone: "resume",
    facts: normalizeFactList([
      item.tags.at(0) ?? null,
      item.tags.at(1) ?? null,
      "来源：真实履历记录",
    ]),
    periodLabel: monthLabelFromResumeItem(item),
    monthIndex: monthIndexFromResumeItem(item),
  };
}

function buildFutureOfferArtifact(offer: FutureOffer): FormalArtifact {
  const kind =
    offer.type === "employment"
      ? "employment"
      : offer.type === "recommendation"
        ? "recommendation"
        : "postgraduate";
  const title =
    offer.type === "employment"
      ? "就业 Offer Letter"
      : offer.type === "recommendation"
        ? "推免接收函"
        : "硕士研究生录取通知书";

  return {
    id: `future-offer-${offer.id}`,
    kind,
    title,
    subtitle: offer.title,
    summary: offer.reasons.join(" ") || "这份机会来自规则层已经形成的学业、履历和路径信号。",
    issuer:
      offer.type === "employment"
        ? "校园招聘结果归档中心"
        : offer.type === "recommendation"
          ? "研究生接收结果归档中心"
          : "研究生招生结果归档中心",
    serialNumber: createSerialNumber(
      offer.type === "employment" ? "OFR" : offer.type === "recommendation" ? "REC" : "PGE",
      offer.monthIndex,
      offer.id,
    ),
    sealLabel: offer.accepted ? "已接受" : offer.rejected ? "已放下" : "待选择",
    badgeLabel:
      offer.type === "employment"
        ? "就业 offer"
        : offer.type === "recommendation"
          ? "推免 offer"
          : "考研录取",
    badgeTone: offer.accepted ? "ending" : offer.rejected ? "warning" : "academic",
    facts: normalizeFactList([
      `层级：${offer.tier}`,
      `质量：${offer.quality}`,
      offer.salaryLevel ? `薪资层级：${offer.salaryLevel}` : null,
      offer.tradeoffs[0],
    ]),
    periodLabel: `第 ${offer.monthIndex} 月`,
    monthIndex: offer.monthIndex,
    offerId: offer.id,
    offerType: offer.type,
    accepted: offer.accepted,
    rejected: offer.rejected,
  };
}

export function buildRecommendationArchiveArtifact(run: GameRun): FormalArtifact | null {
  const status = run.progression?.recommendationQualification;

  if (status !== "eligible" && status !== "accepted" && status !== "borderline") {
    return null;
  }

  const badge = recommendationBadge(status);
  const monthIndex = toMonthIndex(run.currentYear, run.currentMonth);

  return {
    id: `recommendation-${run.id}-${monthIndex}`,
    kind: "recommendation",
    title: status === "borderline" ? "推免资格观察函" : "推免资格确认函",
    subtitle: "基于当前学业与成果快照生成",
    summary:
      status === "borderline"
        ? "你已经摸到推免资格边缘，后续重点在于把排名、竞赛与研究证据继续顶上去。"
        : "当前规则层事实已经支持推免资格成立，后续重点转为选择接收去向和准备正式结果。 ",
    issuer: "升学路径评估归档组",
    serialNumber: createSerialNumber("REC", monthIndex, run.id),
    sealLabel: status === "accepted" ? "已接收" : "资格成立",
    badgeLabel: badge.label,
    badgeTone: badge.tone,
    facts: normalizeFactList([
      `当前方向：${run.progression?.dominantDirection ?? "undecided"}`,
      `推免准备度：${run.progression?.recommendationReadiness ?? 0}`,
      `考研推进度：${run.progression?.postgraduateProgress ?? 0}`,
    ]),
    periodLabel: `第 ${monthIndex} 月`,
    monthIndex,
  };
}

export function buildResumeFormalArtifacts(run: GameRun) {
  const scholarshipArtifacts = (run.scholarships ?? [])
    .map((record) => buildScholarshipArtifact(record))
    .filter((artifact): artifact is FormalArtifact => artifact !== null);
  const competitionArtifacts = run.resume
    .filter((item) => item.category === "competition")
    .map((item) => buildCompetitionArtifact(item));
  const internshipArtifacts = run.resume
    .filter((item) => item.category === "internship")
    .map((item) => buildInternshipArtifact(item));
  const offerArtifacts = (run.futureOffers ?? []).map((offer) => buildFutureOfferArtifact(offer));
  const recommendationArtifact = buildRecommendationArchiveArtifact(run);

  return latest(
    [
      ...scholarshipArtifacts,
      ...competitionArtifacts,
      ...internshipArtifacts,
      ...offerArtifacts,
      ...(recommendationArtifact ? [recommendationArtifact] : []),
    ],
    8,
  );
}

export function buildGameSpotlightArtifacts(run: GameRun) {
  return latest(buildResumeFormalArtifacts(run), 3);
}

function buildEmploymentEndingArtifact(run: GameRun, endingSummary: StructuredEndingSummary): FormalArtifact | null {
  if (endingSummary.pathResult !== "success" && endingSummary.pathResult !== "ordinary") {
    return null;
  }

  const monthIndex = toMonthIndex(endingSummary.finalYear, 12);

  return {
    id: `employment-ending-${run.id}`,
    kind: "employment",
    title: endingSummary.pathResult === "success" ? "就业 Offer Letter" : "录用意向通知",
    subtitle: "基于最终结局结果归档",
    summary:
      endingSummary.pathResult === "success"
        ? "你在毕业前把就业线真正走通了，这份结果来自履历、实践和求职准备共同兑现。"
        : "你已经拿到了明确录用意向，后续落地质量取决于最后的谈薪与定岗结果。",
    issuer: "校园招聘结果归档中心",
    serialNumber: createSerialNumber("OFR", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已录用" : "意向录用",
    badgeLabel: "就业结果",
    badgeTone: "ending",
    facts: normalizeFactList([
      `毕业结果：${endingSummary.outcome}`,
      `最终路径：${endingSummary.graduationPath ?? "employment"}`,
      `长期均分：${endingSummary.longTermAcademicAverage}`,
    ]),
    periodLabel: `第 ${monthIndex} 月`,
    monthIndex,
  };
}

function buildRecommendationEndingArtifact(run: GameRun, endingSummary: StructuredEndingSummary): FormalArtifact | null {
  if (endingSummary.pathResult !== "success" && endingSummary.pathResult !== "ordinary") {
    return null;
  }

  const monthIndex = toMonthIndex(endingSummary.finalYear, 12);

  return {
    id: `recommendation-ending-${run.id}`,
    kind: "recommendation",
    title: endingSummary.pathResult === "success" ? "推免接收函" : "推免拟录取通知",
    subtitle: "基于最终结局结果归档",
    summary:
      endingSummary.pathResult === "success"
        ? "规则层事实表明你在毕业节点完成了推免接收，这份结果是学业、竞赛和研究积累共同支撑出来的。"
        : "你已经进入推免拟录取区间，后续更多取决于最终接收确认。",
    issuer: "研究生接收结果归档中心",
    serialNumber: createSerialNumber("REC", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已接收" : "拟录取",
    badgeLabel: "推免结果",
    badgeTone: "academic",
    facts: normalizeFactList([
      `推免资格：${endingSummary.recommendationQualification ?? "pending"}`,
      `毕业结果：${endingSummary.outcome}`,
      `长期均分：${endingSummary.longTermAcademicAverage}`,
    ]),
    periodLabel: `第 ${monthIndex} 月`,
    monthIndex,
  };
}

function buildPostgraduateEndingArtifact(run: GameRun, endingSummary: StructuredEndingSummary): FormalArtifact | null {
  if (endingSummary.pathResult !== "success" && endingSummary.pathResult !== "ordinary") {
    return null;
  }

  const monthIndex = toMonthIndex(endingSummary.finalYear, 12);

  return {
    id: `postgraduate-ending-${run.id}`,
    kind: "postgraduate",
    title: endingSummary.pathResult === "success" ? "硕士研究生录取通知书" : "硕士调剂录取通知",
    subtitle: "基于最终结局结果归档",
    summary:
      endingSummary.pathResult === "success"
        ? "这份录取结果来自长期学业与备考投入的兑现。"
        : "你已经通过调剂或保底录取守住了升学结果，这仍然是规则层事实支持的正式去向。",
    issuer: "研究生招生结果归档中心",
    serialNumber: createSerialNumber("PGE", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已录取" : "调剂录取",
    badgeLabel: "考研结果",
    badgeTone: "academic",
    facts: normalizeFactList([
      `毕业结果：${endingSummary.outcome}`,
      `长期均分：${endingSummary.longTermAcademicAverage}`,
      `最终路径：${endingSummary.graduationPath ?? "postgraduate_exam"}`,
    ]),
    periodLabel: `第 ${monthIndex} 月`,
    monthIndex,
  };
}

export function buildEndingFormalArtifact(run: GameRun, endingSummary: StructuredEndingSummary): FormalArtifact | null {
  switch (endingSummary.graduationPath as GraduationPath | undefined) {
    case "employment":
      return buildEmploymentEndingArtifact(run, endingSummary);
    case "recommendation":
      return buildRecommendationEndingArtifact(run, endingSummary);
    case "postgraduate_exam":
      return buildPostgraduateEndingArtifact(run, endingSummary);
    default:
      return null;
  }
}

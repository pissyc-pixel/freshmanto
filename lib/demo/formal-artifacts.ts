import {
  formatGraduationOutcome,
} from "@/lib/demo/options";
import {
  formatPlayerFacingMonthIndex,
  sanitizePlayerFacingText,
  sanitizePlayerFacingTextList,
} from "@/lib/player-facing-text";
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
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(48, Math.round(value)));
}

function toMonthIndex(year: number, month: number) {
  return clampMonthIndex((year - 1) * 12 + month);
}

function monthLabelFromResumeItem(item: ResumeItem) {
  return formatPlayerFacingMonthIndex(item.month);
}

function monthIndexFromResumeItem(item: ResumeItem) {
  return clampMonthIndex(item.month);
}

function createSerialNumber(prefix: string, monthIndex: number, suffix: string) {
  return `${prefix}-${String(clampMonthIndex(monthIndex)).padStart(2, "0")}-${suffix.slice(-4).toUpperCase()}`;
}

function latest<T extends { monthIndex: number }>(items: T[], limit?: number) {
  const sorted = items.slice().sort((left, right) => right.monthIndex - left.monthIndex);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

function dedupeFormalArtifacts(items: FormalArtifact[]) {
  const unique = new Map<string, FormalArtifact>();

  for (const item of items) {
    const key = item.id || `${item.kind}-${item.monthIndex}-${item.title}-${item.serialNumber}`;

    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return [...unique.values()];
}

function sanitizeArtifactText(value: string | null | undefined) {
  return sanitizePlayerFacingText(value ?? "");
}

function normalizeFactList(values: Array<string | null | undefined>) {
  return sanitizePlayerFacingTextList(
    values.filter((value): value is string => Boolean(value && value.trim().length > 0)).slice(0, 4),
  );
}

function formatOfferTypeTitle(type: FutureOffer["type"]) {
  switch (type) {
    case "employment":
      return "就业录用通知";
    case "recommendation":
      return "推免资格观察函";
    default:
      return "硕士录取通知";
  }
}

function formatOfferBadge(type: FutureOffer["type"]) {
  switch (type) {
    case "employment":
      return "就业结果";
    case "recommendation":
      return "推免结果";
    default:
      return "考研结果";
  }
}

function recommendationBadge(status: RecommendationQualification) {
  switch (status) {
    case "accepted":
      return {
        label: "已确认",
        tone: "ending" as const,
      };
    case "eligible":
      return {
        label: "资格成立",
        tone: "academic" as const,
      };
    case "borderline":
      return {
        label: "还在观察",
        tone: "warning" as const,
      };
    default:
      return {
        label: "继续观察",
        tone: "warning" as const,
      };
  }
}

function buildScholarshipArtifact(record: ScholarshipRecord): FormalArtifact | null {
  if (record.level === "none") {
    return null;
  }

  const monthIndex = clampMonthIndex(record.academicYear * 12 + 1);

  return {
    id: `scholarship-${record.id}`,
    kind: "scholarship",
    title: "奖学金证书",
    subtitle: sanitizeArtifactText(record.title),
    summary: sanitizeArtifactText(record.reason),
    issuer: "学生资助与发展中心",
    serialNumber: createSerialNumber("SCH", monthIndex, record.id),
    sealLabel: record.level === "high" ? "重点表彰" : "正式发放",
    badgeLabel: record.level === "high" ? "高等级奖学金" : "奖学金归档",
    badgeTone: "money",
    facts: normalizeFactList([
      `对应学年：第 ${record.academicYear} 学年`,
      record.level === "high" ? "结果层级：较高" : "结果层级：较稳",
      "这份结果已经写进正式档案",
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
    monthIndex,
  };
}

function buildCompetitionArtifact(item: ResumeItem): FormalArtifact {
  const monthIndex = monthIndexFromResumeItem(item);

  return {
    id: `competition-${item.id}`,
    kind: "competition",
    title: "竞赛评奖归档",
    subtitle: sanitizeArtifactText(item.title),
    summary: sanitizeArtifactText(item.summary),
    issuer: "竞赛与项目成果归档组",
    serialNumber: createSerialNumber("CMP", monthIndex, item.id),
    sealLabel: "已归档",
    badgeLabel: "竞赛成果",
    badgeTone: "event",
    facts: normalizeFactList([
      item.tags.find((tag) => ["national", "provincial", "school"].includes(tag)) ?? null,
      item.tags.find((tag) => ["first", "second", "third"].includes(tag)) ?? null,
      item.tags.at(0) ?? null,
    ]),
    periodLabel: monthLabelFromResumeItem(item),
    monthIndex,
  };
}

function buildInternshipArtifact(item: ResumeItem): FormalArtifact {
  const monthIndex = monthIndexFromResumeItem(item);

  return {
    id: `internship-${item.id}`,
    kind: "internship",
    title: "实习经历归档",
    subtitle: sanitizeArtifactText(item.title),
    summary: sanitizeArtifactText(item.summary),
    issuer: "实践经历归档中心",
    serialNumber: createSerialNumber("INT", monthIndex, item.id),
    sealLabel: "已收档",
    badgeLabel: "实习经历",
    badgeTone: "resume",
    facts: normalizeFactList([
      item.tags.at(0) ?? null,
      item.tags.at(1) ?? null,
      "来源：真实履历记录",
    ]),
    periodLabel: monthLabelFromResumeItem(item),
    monthIndex,
  };
}

function buildFutureOfferArtifact(offer: FutureOffer): FormalArtifact {
  const kind =
    offer.type === "employment"
      ? "employment"
      : offer.type === "recommendation"
        ? "recommendation"
        : "postgraduate";
  const monthIndex = clampMonthIndex(offer.monthIndex);

  return {
    id: `future-offer-${offer.id}`,
    kind,
    title: formatOfferTypeTitle(offer.type),
    subtitle: sanitizeArtifactText(offer.title),
    summary:
      sanitizeArtifactText(offer.reasons.join(" ")) || "这份机会来自已经落地的学业、经历和方向积累。",
    issuer:
      offer.type === "employment"
        ? "校园招聘结果归档中心"
        : offer.type === "recommendation"
          ? "研究生接收结果归档中心"
          : "研究生招生结果归档中心",
    serialNumber: createSerialNumber(
      offer.type === "employment" ? "OFR" : offer.type === "recommendation" ? "REC" : "PGE",
      monthIndex,
      offer.id,
    ),
    sealLabel: offer.accepted ? "已确认" : offer.rejected ? "已放下" : "待查看",
    badgeLabel: formatOfferBadge(offer.type),
    badgeTone: offer.accepted ? "ending" : offer.rejected ? "warning" : "academic",
    facts: normalizeFactList([
      `目标层级：${sanitizeArtifactText(offer.tier)}`,
      `结果感受：${sanitizeArtifactText(offer.quality)}`,
      offer.salaryLevel ? `薪资感受：${sanitizeArtifactText(offer.salaryLevel)}` : null,
      offer.tradeoffs[0],
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
    monthIndex,
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
        ? "你已经摸到推免边缘，后面更重要的是把排名、竞赛和研究经历继续托稳。"
        : "当前证据已经足够支撑推免资格成立，接下来更像是在决定接不接受这条路。",
    issuer: "升学路径评估归档组",
    serialNumber: createSerialNumber("REC", monthIndex, run.id),
    sealLabel: status === "accepted" ? "已确认" : "资格成立",
    badgeLabel: badge.label,
    badgeTone: badge.tone,
    facts: normalizeFactList([
      `当前方向：${sanitizeArtifactText(run.progression?.dominantDirection ?? "undecided")}`,
      "这条线已经留下了明确证据",
      "后续选择会继续写进正式档案",
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
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
    dedupeFormalArtifacts([
      ...scholarshipArtifacts,
      ...competitionArtifacts,
      ...internshipArtifacts,
      ...offerArtifacts,
      ...(recommendationArtifact ? [recommendationArtifact] : []),
    ]),
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
    title: endingSummary.pathResult === "success" ? "就业录用通知" : "录用意向通知",
    subtitle: "基于最终结局结果归档",
    summary:
      endingSummary.pathResult === "success"
        ? "你在毕业前把就业线真正走通了，这份结果来自履历、实践和求职准备一起兑现。"
        : "你已经拿到了明确录用意向，最后落地成色取决于毕业前的收尾与选择。",
    issuer: "校园招聘结果归档中心",
    serialNumber: createSerialNumber("OFR", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已录用" : "意向录用",
    badgeLabel: "就业结果",
    badgeTone: "ending",
    facts: normalizeFactList([
      `毕业结果：${formatGraduationOutcome(endingSummary.outcome)}`,
      `最终方向：${sanitizeArtifactText(endingSummary.graduationPath ?? "employment")}`,
      "这份结果已经写进正式档案",
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
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
        ? "你在毕业节点完成了推免接收，这份结果是学业、竞赛和研究积累一起托出来的。"
        : "你已经进入推免拟录取区间，后续更多取决于最后确认与归档。",
    issuer: "研究生接收结果归档中心",
    serialNumber: createSerialNumber("REC", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已接收" : "拟录取",
    badgeLabel: "推免结果",
    badgeTone: "academic",
    facts: normalizeFactList([
      `推免资格：${sanitizeArtifactText(endingSummary.recommendationQualification ?? "pending")}`,
      `毕业结果：${formatGraduationOutcome(endingSummary.outcome)}`,
      "这份结果已经写进正式档案",
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
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
    title: endingSummary.pathResult === "success" ? "硕士录取通知" : "硕士调剂录取通知",
    subtitle: "基于最终结局结果归档",
    summary:
      endingSummary.pathResult === "success"
        ? "这份录取结果来自长期学业和备考投入的兑现。"
        : "你通过调剂或保底录取守住了升学结果，这依然是正式落地的去向。",
    issuer: "研究生招生结果归档中心",
    serialNumber: createSerialNumber("PGE", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已录取" : "调剂录取",
    badgeLabel: "考研结果",
    badgeTone: "academic",
    facts: normalizeFactList([
      `毕业结果：${formatGraduationOutcome(endingSummary.outcome)}`,
      `最终方向：${sanitizeArtifactText(endingSummary.graduationPath ?? "postgraduate_exam")}`,
      "这份结果已经写进正式档案",
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
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

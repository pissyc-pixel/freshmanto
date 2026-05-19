import {
  formatCollegeTrack,
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

export type FormalArtifactDetail = {
  label: string;
  value: string;
};

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
  documentHighlights?: FormalArtifactDetail[];
  documentNarrative?: string[];
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

function pickLatestEmploymentOffer(run: GameRun) {
  if (run.acceptedOffer?.type === "employment") {
    return run.acceptedOffer;
  }

  return (run.futureOffers ?? [])
    .filter((offer) => offer.type === "employment")
    .slice()
    .sort((left, right) => {
      const leftScore = (left.accepted ? 100 : 0) + left.monthIndex;
      const rightScore = (right.accepted ? 100 : 0) + right.monthIndex;
      return rightScore - leftScore;
    })[0] ?? null;
}

function inferEmploymentCity(run: GameRun, offer: FutureOffer | null) {
  const title = sanitizeArtifactText(offer?.title);

  if (title.includes("天津")) {
    return "天津";
  }

  if (title.includes("杭州")) {
    return "杭州";
  }

  if (title.includes("上海")) {
    return "上海";
  }

  if (title.includes("深圳")) {
    return "深圳";
  }

  if (title.includes("北京")) {
    return "北京";
  }

  if (title.includes("广州")) {
    return "广州";
  }

  if (title.includes("成都")) {
    return "成都";
  }

  if (offer?.quality === "excellent") {
    return run.profile.collegeTrack === "business" ? "杭州" : "深圳";
  }

  if (run.profile.cityTier === "tier_1") {
    return "上海";
  }

  switch (run.profile.collegeTrack) {
    case "business":
      return "杭州";
    case "engineering":
      return "深圳";
    case "science":
    case "medicine":
      return "北京";
    case "arts":
      return "广州";
    default:
      return "成都";
  }
}

function inferEmploymentEmployer(run: GameRun, offer: FutureOffer | null, city: string) {
  const title = sanitizeArtifactText(offer?.title);

  if (title.includes("稳定")) {
    return `一家${city}本地头部零售企业`;
  }

  switch (run.profile.collegeTrack) {
    case "business":
      if (title.includes("商业分析")) {
        return `一家位于${city}的互联网平台公司`;
      }

      if (offer?.quality === "ordinary") {
        return `一家${city}的消费品企业区域运营中心`;
      }

      return `一家科技公司的商业运营部门`;
    case "engineering":
      return `一家位于${city}的科技公司产品与项目团队`;
    case "science":
    case "medicine":
      return `一家位于${city}的数据与研究支持团队`;
    case "arts":
      return `一家位于${city}的品牌与内容团队`;
    default:
      return `一家位于${city}的企业运营团队`;
  }
}

function inferEmploymentRole(run: GameRun, offer: FutureOffer | null) {
  const title = sanitizeArtifactText(offer?.title);

  if (title.includes("商业分析")) {
    return "商业分析助理";
  }

  if (title.includes("产品运营")) {
    return offer?.quality === "excellent" ? "产品运营管培生" : "产品运营专员";
  }

  if (title.includes("工程项目")) {
    return "工程项目助理";
  }

  if (title.includes("市场")) {
    return "市场运营培训生";
  }

  switch (run.profile.collegeTrack) {
    case "business":
      return offer?.quality === "ordinary" ? "市场运营培训生" : "商业分析助理";
    case "engineering":
      return "工程项目助理";
    case "science":
    case "medicine":
      return "业务分析助理";
    case "arts":
      return "品牌内容运营专员";
    default:
      return "业务分析助理";
  }
}

function inferEmploymentCompensation(offer: FutureOffer | null) {
  switch (offer?.salaryLevel) {
    case "high":
      return "年总包约 18-22 万";
    case "medium":
      return "税前年薪约 14-18 万";
    case "low":
      return "税前年薪约 12-14 万";
    default:
      return "税前年薪约 15-18 万";
  }
}

function collectEmploymentEvidence(run: GameRun, offer: FutureOffer | null) {
  const sourceIds = new Set(offer?.sourceResumeIds ?? []);
  const relevantResume = run.resume
    .filter((item) => {
      if (sourceIds.size > 0) {
        return sourceIds.has(item.id);
      }

      return ["internship", "competition", "project", "research", "job_progress"].includes(item.category);
    })
    .slice()
    .sort((left, right) => right.month - left.month)
    .slice(0, 5);

  const evidence: string[] = [];

  if (relevantResume.some((item) => item.category === "internship")) {
    evidence.push("实习经历");
  }

  if (relevantResume.some((item) => item.category === "competition")) {
    evidence.push("商赛经历");
  }

  if (relevantResume.some((item) => item.category === "project" || item.category === "research")) {
    evidence.push(run.profile.collegeTrack === "business" ? "调研项目" : "项目经历");
  }

  if (
    relevantResume.some((item) => item.category === "job_progress") ||
    (offer?.reasons ?? []).some((reason) => reason.includes("宣讲") || reason.includes("投递"))
  ) {
    evidence.push("宣讲会和投递积累");
  }

  if (evidence.length === 0 && relevantResume.length > 0) {
    evidence.push(sanitizeArtifactText(relevantResume[0]?.title));
  }

  return [...new Set(evidence)].slice(0, 4);
}

function joinEvidenceList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "后期留下的履历证据";
  }

  return `${values.slice(0, -1).join("、")}和${values.at(-1)}`;
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
  const offer = pickLatestEmploymentOffer(run);
  const city = inferEmploymentCity(run, offer);
  const employer = inferEmploymentEmployer(run, offer, city);
  const role = inferEmploymentRole(run, offer);
  const compensation = inferEmploymentCompensation(offer);
  const evidenceList = collectEmploymentEvidence(run, offer);
  const evidenceSummary = joinEvidenceList(evidenceList);
  const leadingParagraph = `你最终收到了一份来自${employer}的录用通知，岗位是${role}，工作城市在${city}，${compensation}。`;
  const overviewParagraph =
    evidenceList.length > 0
      ? `大学后期留下的${evidenceSummary}，让这份 offer 显得不是突然出现的结果。它更像是你把就业这条路一点点走清楚之后，真正落在手里的那份回信。`
      : "这份录用通知并不是凭空落下来的。它更像是你把就业这条路一点点走清楚之后，真正落在手里的那份回信。";
  const reasonsParagraph =
    sanitizeArtifactText(offer?.reasons.join(" ")) ||
    `这份结果和你在${formatCollegeTrack(run.profile.collegeTrack)}方向上慢慢攒下来的履历证据接上了。`;

  return {
    id: `employment-ending-${run.id}`,
    kind: "employment",
    title: endingSummary.pathResult === "success" ? "就业录用通知" : "录用意向通知",
    subtitle: `${city} · ${role}`,
    summary: leadingParagraph,
    issuer: "校园招聘结果归档中心",
    serialNumber: createSerialNumber("OFR", monthIndex, run.id),
    sealLabel: endingSummary.pathResult === "success" ? "已录用" : "意向录用",
    badgeLabel: "就业结果",
    badgeTone: "ending",
    facts: normalizeFactList([
      `毕业结果：${formatGraduationOutcome(endingSummary.outcome)}`,
      `工作城市：${city}`,
      `岗位：${role}`,
      `薪资参考：${compensation}`,
    ]),
    periodLabel: formatPlayerFacingMonthIndex(monthIndex),
    monthIndex,
    documentHighlights: [
      {
        label: "单位类型",
        value: employer,
      },
      {
        label: "岗位",
        value: role,
      },
      {
        label: "工作城市",
        value: city,
      },
      {
        label: "薪资参考",
        value: compensation,
      },
    ],
    documentNarrative: [leadingParagraph, overviewParagraph, reasonsParagraph],
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

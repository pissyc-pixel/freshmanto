import { randomUUID } from "node:crypto";

import { acceptFutureOfferDecision, createDefaultCareerRouteState } from "@/core/resolvers/progression";
import { renderMonthlyJournalFallback } from "@/lib/ai/reports";
import { normalizeSaveState } from "@/lib/demo/save-state";
import { formatPlayerFacingMonthIndex, sanitizePlayerFacingTextList } from "@/lib/player-facing-text";
import type { DemoRepository } from "@/lib/demo/run-service";
import type {
  EndingEvidence,
  FutureOffer,
  GameRun,
  InternshipRecord,
  MonthlyLetter,
  ResumeCategory,
  ResumeItem,
  ScholarshipRecord,
  StructuredMonthlySummary,
  TimelineNode,
} from "@/types/game";

export type DemoSavePresetId =
  | "nankai-business-employment-junior-fall"
  | "nankai-business-employment-final"
  | "tianda-engineering-recommendation-junior-fall"
  | "tianda-engineering-recommendation-final";

export type DemoSavePreset = {
  id: DemoSavePresetId;
  label: string;
  routeLabel: string;
  schoolLabel: string;
  summary: string;
  endingTarget: string;
};

export const demoSavePresetIds = [
  "nankai-business-employment-junior-fall",
  "nankai-business-employment-final",
  "tianda-engineering-recommendation-junior-fall",
  "tianda-engineering-recommendation-final",
] as const satisfies DemoSavePresetId[];

type SeedResumeRecord = {
  year: number;
  month: number;
  category: ResumeCategory;
  title: string;
  summary: string;
  tags: string[];
};

type SeedMonthlyRecord = {
  year: number;
  month: number;
  summary: StructuredMonthlySummary;
};

type PresetSeed = {
  run: GameRun;
  monthlyStates: SeedMonthlyRecord[];
  resumeRecords: SeedResumeRecord[];
};

const defaultCourse = {
  strategy: "mixed" as const,
  attendanceCounted: true,
  directRollCallPenalty: 0,
  rollCallRiskDelta: 0,
  usualScoreRiskDelta: 0,
  proxyCost: 0,
  remedyPressure: 0,
  academicRiskDelta: 0,
  academicGain: 0,
  moodDelta: 0,
  stressDelta: 0,
};

export const demoSavePresets: DemoSavePreset[] = [
  {
    id: "nankai-business-employment-junior-fall",
    label: "南开商科｜就业路线｜大三上",
    routeLabel: "就业路线",
    schoolLabel: "南开大学 · 商科 / 管理类",
    summary: "大三上开局，前面已经有奖学金、商赛、调研项目和第一段实习，后面重点看更高质量实习与就业结果。",
    endingTarget: "较好就业 offer",
  },
  {
    id: "nankai-business-employment-final",
    label: "南开商科｜就业路线｜最后一月",
    routeLabel: "终局前快速查看",
    schoolLabel: "南开大学 · 商科 / 管理类",
    summary: "直接来到第 48 月，已拥有完整履历与就业 offer，可以快速查看正式就业结局和最终报告。",
    endingTarget: "正常毕业 + 较好就业 offer",
  },
  {
    id: "tianda-engineering-recommendation-junior-fall",
    label: "天大工科｜推免路线｜大三上",
    routeLabel: "推免路线",
    schoolLabel: "天津大学 · 工科",
    summary: "大三上开局，前两年已经积累出 GPA、奖学金和竞赛优势，后面重点看推免申请与接受。",
    endingTarget: "推免结局",
  },
  {
    id: "tianda-engineering-recommendation-final",
    label: "天大工科｜推免路线｜最后一月",
    routeLabel: "终局前快速查看",
    schoolLabel: "天津大学 · 工科",
    summary: "直接来到第 48 月，已拥有推免 offer 与完整证据链，可以快速查看推免结局和最终报告。",
    endingTarget: "正常毕业 + 推免结局",
  },
];

function cloneStats(stats: GameRun["stats"]) {
  return {
    money: stats.money,
    mood: stats.mood,
    stress: stats.stress,
    fulfillment: stats.fulfillment,
    social: stats.social,
    semesterAcademics: stats.semesterAcademics,
  };
}

function diffStats(before: GameRun["stats"], after: GameRun["stats"]) {
  return {
    money: after.money - before.money,
    mood: after.mood - before.mood,
    stress: after.stress - before.stress,
    fulfillment: after.fulfillment - before.fulfillment,
    social: after.social - before.social,
    semesterAcademics: after.semesterAcademics - before.semesterAcademics,
  };
}

function makeResumeRecord(input: SeedResumeRecord) {
  return input;
}

function makeResumeItem(runId: string, record: SeedResumeRecord): ResumeItem {
  return {
    id: `${runId}-${record.year}-${record.month}-${record.title}`,
    category: record.category,
    title: record.title,
    summary: record.summary,
    month: record.month,
    tags: record.tags,
  };
}

function globalMonthIndex(record: { year: number; month: number }) {
  return (record.year - 1) * 12 + record.month;
}

function timelineKindForRecord(record: SeedResumeRecord): TimelineNode["kind"] {
  if (record.category === "scholarship") {
    return "scholarship";
  }

  if (record.category === "internship") {
    return "internship";
  }

  if (record.category === "competition") {
    return "competition_award";
  }

  return "monthly";
}

function evidenceKindForRecord(record: SeedResumeRecord): EndingEvidence["kind"] {
  if (record.category === "scholarship") {
    return "scholarship";
  }

  if (record.category === "internship") {
    return "internship";
  }

  if (record.category === "competition" || record.category === "project" || record.category === "research") {
    return "competition";
  }

  return "route";
}

function buildPresetTimeline(runId: string, resumeRecords: SeedResumeRecord[]): TimelineNode[] {
  return resumeRecords.map((record) => ({
    id: `${runId}-timeline-${globalMonthIndex(record)}-${record.category}`,
    monthIndex: globalMonthIndex(record),
    kind: timelineKindForRecord(record),
    title: record.title,
    body: record.summary,
    sourceId: `${runId}-${record.year}-${record.month}-${record.title}`,
    facts: sanitizePlayerFacingTextList(record.tags),
  }));
}

function buildPresetEndingEvidence(runId: string, resumeRecords: SeedResumeRecord[]): EndingEvidence[] {
  return resumeRecords.map((record) => ({
    id: `${runId}-evidence-${globalMonthIndex(record)}-${record.category}`,
    kind: evidenceKindForRecord(record),
    title: record.title,
    body: record.summary,
    monthIndex: globalMonthIndex(record),
    sourceId: `${runId}-${record.year}-${record.month}-${record.title}`,
  }));
}

function buildPresetInternships(runId: string, resumeRecords: SeedResumeRecord[]): InternshipRecord[] {
  return resumeRecords
    .filter((record) => record.category === "internship")
    .map((record, index) => ({
      id: `${runId}-internship-${index + 1}`,
      title: record.title,
      stage: record.year <= 2 ? "first_internship" : "junior_choice",
      companyType: record.tags[1] ?? "campus-referred organization",
      roleType: record.tags[0] ?? "internship",
      cityTier: "tier_2",
      growth: record.year <= 2 ? 16 : 22,
      pressure: record.year <= 2 ? 10 : 14,
      cost: record.year <= 2 ? 180 : 320,
      routeBonus: ["employment"],
      status: "completed",
      openedMonthIndex: globalMonthIndex(record),
      completedMonthIndex: globalMonthIndex(record),
      summary: record.summary,
    }));
}

function buildPresetLetters(runId: string, monthlyStates: SeedMonthlyRecord[]): MonthlyLetter[] {
  return monthlyStates.map((state) => ({
    id: `${runId}-letter-${globalMonthIndex(state)}`,
    monthIndex: globalMonthIndex(state),
    title: `${formatPlayerFacingMonthIndex(globalMonthIndex(state))}来信`,
    body:
      state.summary.notableFacts.length > 0
        ? `这封信记下来的，是这个月真正留下来的几件事：${sanitizePlayerFacingTextList(state.summary.notableFacts).join("、")}。它们会继续跟着这份存档往后走。`
        : "这个月没有什么被夸张放大的桥段，只是把真实发生过的推进和心情留了下来。",
    facts: sanitizePlayerFacingTextList(state.summary.notableFacts),
    fallback: true,
  }));
}

function attachPresetMemory(input: {
  run: GameRun;
  monthlyStates: SeedMonthlyRecord[];
  resumeRecords: SeedResumeRecord[];
  extraEvidence?: EndingEvidence[];
}) {
  const timelineNodes = buildPresetTimeline(input.run.id, input.resumeRecords);
  const monthlyLetters = buildPresetLetters(input.run.id, input.monthlyStates);
  const endingEvidence = [
    ...buildPresetEndingEvidence(input.run.id, input.resumeRecords),
    ...(input.extraEvidence ?? []),
  ];
  const internshipRecords = buildPresetInternships(input.run.id, input.resumeRecords);

  return {
    ...input.run,
    internshipRecords,
    timelineNodes,
    monthlyLetters,
    endingEvidence,
    monthlySummaries: input.monthlyStates.map((item) => ({
      ...item.summary,
      internshipRecords,
      timelineNodes,
      monthlyLetters,
      endingEvidence,
    })),
  };
}

function createFutureOffer(input: {
  id: string;
  type: FutureOffer["type"];
  title: string;
  tier: FutureOffer["tier"];
  quality: FutureOffer["quality"];
  monthIndex: number;
  salaryLevel?: FutureOffer["salaryLevel"];
  reasons: string[];
  tradeoffs: string[];
  sourceResumeIds?: string[];
}): FutureOffer {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    tier: input.tier,
    quality: input.quality,
    reasons: input.reasons,
    tradeoffs: input.tradeoffs,
    accepted: false,
    rejected: false,
    monthIndex: input.monthIndex,
    salaryLevel: input.salaryLevel,
    sourceResumeIds: input.sourceResumeIds,
  };
}

function pushUniqueEvidence(run: GameRun, evidence: EndingEvidence[]): EndingEvidence[] {
  const unique = new Map<string, EndingEvidence>();

  for (const item of [...(run.endingEvidence ?? []), ...evidence]) {
    if (!unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }

  return [...unique.values()].sort((left, right) => left.monthIndex - right.monthIndex);
}

function createMonthlySummary(input: {
  year: number;
  month: number;
  statsBefore: GameRun["stats"];
  statsAfter: GameRun["stats"];
  academicFeedback?: StructuredMonthlySummary["academicFeedback"];
  actions?: StructuredMonthlySummary["actions"];
  notableFacts?: string[];
  resumeAdditions?: ResumeItem[];
  scholarshipAwarded?: ScholarshipRecord;
  progression?: GameRun["progression"];
}) {
  return {
    month: input.month,
    actions: input.actions ?? ["study", "student_activity"],
    attendanceStrategy: "mixed" as const,
    schedule: [],
    weeklyCalendar: [],
    statsBefore: cloneStats(input.statsBefore),
    statsAfter: cloneStats(input.statsAfter),
    statsDelta: diffStats(input.statsBefore, input.statsAfter),
    moneyDelta: input.statsAfter.money - input.statsBefore.money,
    academicFeedback: input.academicFeedback ?? "stable",
    eventIds: [],
    resumeAdditions: input.resumeAdditions ?? [],
    notableFacts: input.notableFacts ?? [],
    resolvedActions: [],
    flags: [],
    cooldowns: { askFamilyMonths: 0 },
    course: defaultCourse,
    turns: [],
    progression: input.progression,
    scholarshipAwarded: input.scholarshipAwarded,
  } satisfies StructuredMonthlySummary;
}

function createBasePresetRun(input: {
  id: string;
  name: string;
  schoolTier: GameRun["profile"]["schoolTier"];
  cityTier: GameRun["profile"]["cityTier"];
  collegeTrack: GameRun["profile"]["collegeTrack"];
  familyBackground: GameRun["profile"]["familyBackground"];
  monthlyAllowance: number;
  luck: number;
  talents: GameRun["profile"]["talents"];
  stats: GameRun["stats"];
  semesterAverage: number;
  semesters: GameRun["semesters"];
  scholarships: ScholarshipRecord[];
  resumeRecords: SeedResumeRecord[];
  progression: GameRun["progression"];
  risk?: GameRun["risk"];
}) {
  const baseRun = normalizeSaveState({
    id: input.id,
    status: "active",
    currentYear: 3,
    currentMonth: 1,
    currentSemester: 5,
    profile: {
      name: input.name,
      talents: input.talents,
      familyBackground: input.familyBackground,
      monthlyAllowance: input.monthlyAllowance,
      luck: input.luck,
      collegeTrack: input.collegeTrack,
      schoolTier: input.schoolTier,
      cityTier: input.cityTier,
    },
    stats: input.stats,
    semesterAverage: input.semesterAverage,
    resume: input.resumeRecords.map((record) => makeResumeItem(input.id, record)),
    logLineIds: [],
    monthlySummaries: [],
    semesters: input.semesters,
    cooldowns: { askFamilyMonths: 0 },
    risk: input.risk ?? { academicRisk: 0, burnout: 0 },
    riskFlags: [],
    activeMonth: undefined,
    progression: input.progression,
    competitionProjects: [],
    scholarships: input.scholarships,
  });

  return {
    ...baseRun,
    monthlySummaries: [],
  };
}

function buildNankaiBusinessSeed(runId: string): PresetSeed {
  const scholarship: ScholarshipRecord = {
    id: `${runId}-scholarship-year-1`,
    academicYear: 1,
    level: "standard",
    amount: 6000,
    title: "市级奖学金",
    reason: "第 1 学年成绩优异、综合表现突出。",
  };
  const resumeRecords = [
    makeResumeRecord({
      year: 1,
      month: 4,
      category: "competition",
      title: "商业案例分析赛｜校级二等奖",
      summary: "第一次完整参与商科案例赛，从资料整理、案例分析到展示汇报都走完了一遍。",
      tags: ["商赛", "案例分析", "校级二等奖"],
    }),
    makeResumeRecord({
      year: 2,
      month: 1,
      category: "scholarship",
      title: "第1学年｜市级奖学金｜6000元",
      summary: "这张证书把课程投入、项目准备和反复修改材料的日子正式记下来了。",
      tags: ["奖学金", "市级奖学金"],
    }),
    makeResumeRecord({
      year: 2,
      month: 6,
      category: "project",
      title: "市场调研项目｜完成项目",
      summary: "负责问卷整理和基础分析，第一次把商科项目经验真正写进履历。",
      tags: ["调研", "项目经历"],
    }),
    makeResumeRecord({
      year: 2,
      month: 10,
      category: "internship",
      title: "本地消费品公司市场运营助理",
      summary: "第一段真正接触校园外工作的经历，让履历第一次接到校园外面的世界。",
      tags: ["实习", "市场运营助理"],
    }),
  ];
  const progression = {
    ...createDefaultCareerRouteState(),
    tendencies: {
      employment: 62,
      postgraduate: 34,
      public_exam: 10,
      recommendation: 22,
      undecided: 6,
    },
    dominantDirection: "employment" as const,
    postgraduateProgress: 18,
    employmentReadiness: 48,
    recommendationReadiness: 22,
    recommendationQualification: "borderline" as const,
    latestHints: [
      "前两年的项目和第一段实习，已经把方向慢慢推向就业。",
      "大三上更适合用更强的实习机会把履历再抬一截。",
    ],
  };
  const run = createBasePresetRun({
    id: runId,
    name: "林舒恒",
    schoolTier: "nankai_tianda",
    cityTier: "tier_2",
    collegeTrack: "business",
    familyBackground: "ordinary",
    monthlyAllowance: 1650,
    luck: 58,
    talents: ["quick-learner", "social-butterfly"],
    stats: {
      money: 1080,
      mood: 57,
      stress: 61,
      fulfillment: 56,
      social: 68,
      semesterAcademics: 72,
    },
    semesterAverage: 73,
    semesters: [
      { semester: 1, academicScore: 70, feedback: "stable", passed: true },
      { semester: 2, academicScore: 72, feedback: "stable", passed: true },
      { semester: 3, academicScore: 74, feedback: "stable", passed: true },
      { semester: 4, academicScore: 76, feedback: "excellent", passed: true },
    ],
    scholarships: [scholarship],
    resumeRecords,
    progression,
    risk: { academicRisk: 6, burnout: 10 },
  });

  const monthlyStates: SeedMonthlyRecord[] = [
    {
      year: 1,
      month: 4,
      summary: createMonthlySummary({
        year: 1,
        month: 4,
        statsBefore: { ...run.stats, money: 1380, stress: 52, semesterAcademics: 58, social: 44, mood: 54, fulfillment: 48 },
        statsAfter: { ...run.stats, money: 1240, stress: 57, semesterAcademics: 64, social: 48, mood: 56, fulfillment: 54 },
        actions: ["study", "student_activity", "competition_project"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[0]!)],
        notableFacts: ["competition:商业案例分析赛:school-second"],
        progression,
      }),
    },
    {
      year: 2,
      month: 1,
      summary: createMonthlySummary({
        year: 2,
        month: 1,
        statsBefore: { ...run.stats, money: 880, stress: 49, semesterAcademics: 66, social: 52, mood: 58, fulfillment: 50 },
        statsAfter: { ...run.stats, money: 1480, stress: 44, semesterAcademics: 68, social: 54, mood: 61, fulfillment: 57 },
        actions: ["study", "writing_research"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[1]!)],
        notableFacts: ["scholarship:standard:1"],
        scholarshipAwarded: scholarship,
        progression,
      }),
    },
    {
      year: 2,
      month: 6,
      summary: createMonthlySummary({
        year: 2,
        month: 6,
        statsBefore: { ...run.stats, money: 1220, stress: 52, semesterAcademics: 70, social: 55, mood: 57, fulfillment: 54 },
        statsAfter: { ...run.stats, money: 1080, stress: 58, semesterAcademics: 74, social: 59, mood: 58, fulfillment: 58 },
        actions: ["writing_research", "student_activity"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[2]!)],
        notableFacts: ["project:market-research:completed"],
        progression,
      }),
    },
    {
      year: 2,
      month: 10,
      summary: createMonthlySummary({
        year: 2,
        month: 10,
        statsBefore: { ...run.stats, money: 1560, stress: 55, semesterAcademics: 72, social: 60, mood: 56, fulfillment: 56 },
        statsAfter: { ...run.stats, money: 1180, stress: 63, semesterAcademics: 75, social: 66, mood: 55, fulfillment: 61 },
        actions: ["job_prep", "student_activity"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[3]!)],
        notableFacts: ["internship:market-ops:first-entry"],
        progression,
      }),
    },
  ];

  return {
    run: attachPresetMemory({ run, monthlyStates, resumeRecords }),
    monthlyStates,
    resumeRecords,
  };
}

function buildTiandaEngineeringSeed(runId: string): PresetSeed {
  const scholarships: ScholarshipRecord[] = [
    {
      id: `${runId}-scholarship-year-1`,
      academicYear: 1,
      level: "high",
      amount: 10000,
      title: "国家奖学金",
      reason: "第 1 学年成绩优异、表现突出。",
    },
    {
      id: `${runId}-scholarship-year-2`,
      academicYear: 2,
      level: "standard",
      amount: 6000,
      title: "市级奖学金",
      reason: "第 2 学年专业课程表现稳定、综合能力突出。",
    },
  ];
  const resumeRecords = [
    makeResumeRecord({
      year: 1,
      month: 4,
      category: "competition",
      title: "电子设计竞赛｜校级一等奖",
      summary: "第一次参与工科竞赛，从方案设计到调试都完整走了一遍。",
      tags: ["电子设计竞赛", "校级一等奖"],
    }),
    makeResumeRecord({
      year: 2,
      month: 1,
      category: "scholarship",
      title: "第1学年｜国家奖学金｜10000元",
      summary: "很多看起来没有被单独记住的日子，最后汇成了这张证书。",
      tags: ["奖学金", "国家奖学金"],
    }),
    makeResumeRecord({
      year: 2,
      month: 4,
      category: "research",
      title: "工程训练综合项目｜项目推进",
      summary: "负责实验记录、数据整理和部分方案验证，让推免材料里不只有成绩。",
      tags: ["工程训练", "项目经历"],
    }),
    makeResumeRecord({
      year: 2,
      month: 8,
      category: "research",
      title: "校内科研助理｜实验室协作",
      summary: "开始跟着老师和学长做基础数据整理与实验协作，这段经历让推免材料第一次有了稳定科研痕迹。",
      tags: ["科研助理", "实验室协作"],
    }),
    makeResumeRecord({
      year: 2,
      month: 10,
      category: "competition",
      title: "工程训练综合项目｜市级三等奖",
      summary: "项目过程不轻松，但它让推免材料里终于有了正式项目结果。",
      tags: ["工程训练综合项目", "市级三等奖"],
    }),
    makeResumeRecord({
      year: 3,
      month: 1,
      category: "scholarship",
      title: "第2学年｜市级奖学金｜6000元",
      summary: "更难的专业课和项目压力下，状态还是被稳稳接住了。",
      tags: ["奖学金", "市级奖学金"],
    }),
  ];
  const progression = {
    ...createDefaultCareerRouteState(),
    tendencies: {
      employment: 18,
      postgraduate: 46,
      public_exam: 6,
      recommendation: 78,
      undecided: 4,
    },
    dominantDirection: "recommendation" as const,
    postgraduateProgress: 28,
    employmentReadiness: 18,
    recommendationReadiness: 82,
    recommendationQualification: "eligible" as const,
    latestHints: [
      "前两年的 GPA、奖学金和竞赛，已经把推免竞争力拉出来了。",
      "大三上更像是在补材料和继续稳住状态，而不是重新找方向。",
    ],
  };
  const run = createBasePresetRun({
    id: runId,
    name: "周明哲",
    schoolTier: "nankai_tianda",
    cityTier: "tier_2",
    collegeTrack: "engineering",
    familyBackground: "stable",
    monthlyAllowance: 1550,
    luck: 66,
    talents: ["self-disciplined", "quick-learner"],
    stats: {
      money: 1260,
      mood: 48,
      stress: 66,
      fulfillment: 58,
      social: 46,
      semesterAcademics: 84,
    },
    semesterAverage: 77.6,
    semesters: [
      { semester: 1, academicScore: 76, feedback: "stable", passed: true },
      { semester: 2, academicScore: 78, feedback: "excellent", passed: true },
      { semester: 3, academicScore: 78, feedback: "excellent", passed: true },
      { semester: 4, academicScore: 79, feedback: "excellent", passed: true },
    ],
    scholarships,
    resumeRecords,
    progression,
    risk: { academicRisk: 4, burnout: 12 },
  });

  const monthlyStates: SeedMonthlyRecord[] = [
    {
      year: 1,
      month: 4,
      summary: createMonthlySummary({
        year: 1,
        month: 4,
        statsBefore: { ...run.stats, money: 1360, stress: 52, semesterAcademics: 64, social: 34, mood: 49, fulfillment: 49 },
        statsAfter: { ...run.stats, money: 1210, stress: 58, semesterAcademics: 72, social: 36, mood: 48, fulfillment: 55 },
        actions: ["study", "competition_project"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[0]!)],
        notableFacts: ["competition:电子设计竞赛:school-first"],
        progression,
      }),
    },
    {
      year: 2,
      month: 1,
      summary: createMonthlySummary({
        year: 2,
        month: 1,
        statsBefore: { ...run.stats, money: 1020, stress: 53, semesterAcademics: 74, social: 38, mood: 50, fulfillment: 54 },
        statsAfter: { ...run.stats, money: 2020, stress: 48, semesterAcademics: 78, social: 40, mood: 53, fulfillment: 60 },
        actions: ["study", "writing_research"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[1]!)],
        notableFacts: ["scholarship:high:1"],
        scholarshipAwarded: scholarships[0],
        progression,
      }),
    },
    {
      year: 2,
      month: 4,
      summary: createMonthlySummary({
        year: 2,
        month: 4,
        statsBefore: { ...run.stats, money: 1580, stress: 57, semesterAcademics: 78, social: 40, mood: 49, fulfillment: 56 },
        statsAfter: { ...run.stats, money: 1390, stress: 62, semesterAcademics: 82, social: 42, mood: 48, fulfillment: 58 },
        actions: ["study", "writing_research", "competition_project"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[2]!)],
        notableFacts: ["project:engineering-training:joined"],
        progression,
      }),
    },
    {
      year: 2,
      month: 10,
      summary: createMonthlySummary({
        year: 2,
        month: 10,
        statsBefore: { ...run.stats, money: 1480, stress: 61, semesterAcademics: 82, social: 43, mood: 47, fulfillment: 58 },
        statsAfter: { ...run.stats, money: 1320, stress: 66, semesterAcademics: 85, social: 45, mood: 48, fulfillment: 63 },
        actions: ["competition_project", "writing_research"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[3]!)],
        notableFacts: ["competition:工程训练综合项目:provincial-third"],
        progression,
      }),
    },
    {
      year: 2,
      month: 8,
      summary: createMonthlySummary({
        year: 2,
        month: 8,
        statsBefore: { ...run.stats, money: 1460, stress: 58, semesterAcademics: 80, social: 42, mood: 49, fulfillment: 57 },
        statsAfter: { ...run.stats, money: 1320, stress: 64, semesterAcademics: 83, social: 43, mood: 48, fulfillment: 60 },
        actions: ["study", "writing_research"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[3]!)],
        notableFacts: ["project:lab-assistant:joined"],
        progression,
      }),
    },
  ];

  return {
    run: attachPresetMemory({
      run,
      monthlyStates,
      resumeRecords,
      extraEvidence: [
        {
          id: `${run.id}-evidence-recommendation-route`,
          kind: "route",
          title: "推免路线已经成形",
          body: "前两年的 GPA、奖学金和工科项目让这条路线不是静态展示，而是能继续推进到第 34 月申请和正式 offer 的真实状态。",
          monthIndex: 25,
        },
      ],
    }),
    monthlyStates,
    resumeRecords,
  };
}

function buildNankaiEmploymentFinalSeed(runId: string): PresetSeed {
  const junior = buildNankaiBusinessSeed(runId);
  const extraResumeRecords = [
    makeResumeRecord({
      year: 3,
      month: 10,
      category: "internship",
      title: "一线城市互联网商业分析实习",
      summary: "真正把前面的商赛、调研和第一段实习接起来了，开始能独立做一部分分析和汇报整理。",
      tags: ["实习", "商业分析"],
    }),
  ];
  const resumeRecords = [...junior.resumeRecords, ...extraResumeRecords];
  const futureOffer = createFutureOffer({
    id: `${runId}-employment-offer-final`,
    type: "employment",
    title: "一线城市互联网商业分析 / 产品运营岗",
    tier: "nankai_tianda",
    quality: "good",
    monthIndex: 46,
    salaryLevel: "high",
    reasons: [
      "前置履历里已经有奖学金、商赛、调研项目和两段实习，投递后更容易拿到较好的业务岗面试与录用。",
      "大三后的实习质量明显抬高了简历说服力。",
    ],
    tradeoffs: ["留在大城市意味着节奏更快、压力也更实在。"],
  });

  const monthlyStates = [
    ...junior.monthlyStates,
    {
      year: 3,
      month: 10,
      summary: createMonthlySummary({
        year: 3,
        month: 10,
        statsBefore: { ...junior.run.stats, money: 1420, stress: 58, semesterAcademics: 76, social: 65, mood: 56, fulfillment: 60 },
        statsAfter: { ...junior.run.stats, money: 1160, stress: 64, semesterAcademics: 79, social: 68, mood: 55, fulfillment: 66 },
        actions: ["job_prep", "student_activity"],
        resumeAdditions: [makeResumeItem(runId, extraResumeRecords[0]!)],
        notableFacts: ["internship:internet-business-analysis:advanced"],
        progression: junior.run.progression,
      }),
    },
    {
      year: 4,
      month: 10,
      summary: createMonthlySummary({
        year: 4,
        month: 10,
        statsBefore: { ...junior.run.stats, money: 930, stress: 63, semesterAcademics: 78, social: 66, mood: 52, fulfillment: 64 },
        statsAfter: { ...junior.run.stats, money: 780, stress: 67, semesterAcademics: 79, social: 67, mood: 51, fulfillment: 68 },
        actions: ["job_prep", "study"],
        notableFacts: ["milestone:employment-offer:46"],
        progression: junior.run.progression,
      }),
    },
    {
      year: 4,
      month: 12,
      summary: createMonthlySummary({
        year: 4,
        month: 12,
        statsBefore: { ...junior.run.stats, money: 760, stress: 66, semesterAcademics: 79, social: 67, mood: 51, fulfillment: 68 },
        statsAfter: { ...junior.run.stats, money: 690, stress: 62, semesterAcademics: 80, social: 69, mood: 55, fulfillment: 73 },
        actions: ["job_prep", "relax"],
        notableFacts: ["employment:offer-accepted:final"],
        progression: junior.run.progression,
      }),
    },
  ];

  const seededRun = attachPresetMemory({
    run: {
      ...junior.run,
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      semesterAverage: 78.5,
      semesters: [
        { semester: 1, academicScore: 70, feedback: "stable", passed: true },
        { semester: 2, academicScore: 72, feedback: "stable", passed: true },
        { semester: 3, academicScore: 74, feedback: "stable", passed: true },
        { semester: 4, academicScore: 76, feedback: "excellent", passed: true },
        { semester: 5, academicScore: 77, feedback: "stable", passed: true },
        { semester: 6, academicScore: 79, feedback: "stable", passed: true },
        { semester: 7, academicScore: 80, feedback: "stable", passed: true },
        { semester: 8, academicScore: 80, feedback: "stable", passed: true },
      ],
      stats: {
        ...junior.run.stats,
        money: 690,
        mood: 55,
        stress: 62,
        fulfillment: 73,
        social: 69,
        semesterAcademics: 80,
      },
      progression: {
        ...junior.run.progression!,
        dominantDirection: "employment",
        employmentReadiness: 86,
        postgraduateProgress: 22,
        recommendationReadiness: 28,
        latestHints: [
          "就业路线已经非常明确，最后阶段更多是在确认去向，而不是重新找方向。",
          "大三的高质量实习把前两年的积累真正接上了。",
        ],
      },
      futureOffers: [futureOffer],
      resume: resumeRecords.map((record) => makeResumeItem(runId, record)),
    },
    monthlyStates,
    resumeRecords,
  });

  const acceptedRun = acceptFutureOfferDecision(seededRun, futureOffer.id, "accept");

  return {
    run: {
      ...acceptedRun,
      status: "completed",
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      timelineNodes: [
        ...(acceptedRun.timelineNodes ?? []),
        {
          id: `${runId}-timeline-employment-offer-final`,
          kind: "offer",
          monthIndex: 46,
          title: "就业 offer 到手",
          body: "大四后段等来了正式 offer，这次前面的竞赛、调研和实习终于被连成了一条完整证据链。",
          facts: ["一线城市互联网商业分析 / 产品运营岗", "就业路线明确下来"],
        },
        {
          id: `${runId}-timeline-employment-choice-final`,
          kind: "final_choice",
          monthIndex: 48,
          title: "最终去向确认",
          body: "最后还是选了就业，把这四年攒下来的履历和证据真正落到了现实去向上。",
          facts: ["正常毕业", "接受较好就业 offer"],
        },
      ],
      endingEvidence: pushUniqueEvidence(acceptedRun, [
        {
          id: `${runId}-ending-money-final`,
          kind: "money",
          title: "毕业前的现金状态",
          body: "手头不算宽裕，但已经不再是会被日常开销立刻压垮的状态。",
          monthIndex: 48,
        },
        {
          id: `${runId}-ending-mood-final`,
          kind: "mood",
          title: "毕业前的心情起伏",
          body: "临近毕业时还是会紧张，但已经能感觉到自己终于被看见了一次。",
          monthIndex: 48,
        },
        {
          id: `${runId}-ending-stress-final`,
          kind: "stress",
          title: "最后阶段的压力",
          body: "后期压力一直在，但它最后没有把路线压垮，反而把选择推到了眼前。",
          monthIndex: 48,
        },
      ]),
    },
    monthlyStates,
    resumeRecords,
  };
}

function buildTiandaRecommendationFinalSeed(runId: string): PresetSeed {
  const junior = buildTiandaEngineeringSeed(runId);
  const futureOffer = createFutureOffer({
    id: `${runId}-recommendation-offer-final`,
    type: "recommendation",
    title: "天津大学｜推免录取通知",
    tier: "nankai_tianda",
    quality: "good",
    monthIndex: 34,
    reasons: [
      "国家奖学金、市级奖学金、竞赛结果和科研助理经历一起把推免竞争力抬到了稳定线以上。",
      "第 28 月已经打开考研准备，所以推免外还有保底路径。",
    ],
    tradeoffs: ["后期状态一直绷得比较紧，但学业线没有断。"],
  });

  const monthlyStates = [
    ...junior.monthlyStates,
    {
      year: 3,
      month: 4,
      summary: createMonthlySummary({
        year: 3,
        month: 4,
        statsBefore: { ...junior.run.stats, money: 1240, stress: 64, semesterAcademics: 84, social: 45, mood: 47, fulfillment: 61 },
        statsAfter: { ...junior.run.stats, money: 1130, stress: 67, semesterAcademics: 86, social: 45, mood: 46, fulfillment: 64 },
        actions: ["study", "postgraduate_prep"],
        notableFacts: ["milestone:postgraduate-open:28"],
        progression: {
          ...junior.run.progression!,
          postgraduateChoiceOpenedAtMonth: 28,
        },
      }),
    },
    {
      year: 3,
      month: 10,
      summary: createMonthlySummary({
        year: 3,
        month: 10,
        statsBefore: { ...junior.run.stats, money: 1170, stress: 66, semesterAcademics: 86, social: 45, mood: 46, fulfillment: 64 },
        statsAfter: { ...junior.run.stats, money: 1080, stress: 68, semesterAcademics: 87, social: 46, mood: 47, fulfillment: 67 },
        actions: ["study", "writing_research"],
        notableFacts: ["milestone:recommendation-apply:34"],
        progression: {
          ...junior.run.progression!,
          recommendationAppliedAtMonth: 34,
          recommendationQualification: "eligible",
        },
      }),
    },
    {
      year: 4,
      month: 12,
      summary: createMonthlySummary({
        year: 4,
        month: 12,
        statsBefore: { ...junior.run.stats, money: 1080, stress: 68, semesterAcademics: 87, social: 46, mood: 47, fulfillment: 67 },
        statsAfter: { ...junior.run.stats, money: 980, stress: 61, semesterAcademics: 88, social: 49, mood: 53, fulfillment: 75 },
        actions: ["study", "relax"],
        notableFacts: ["recommendation:accepted"],
        progression: {
          ...junior.run.progression!,
          recommendationQualification: "accepted",
          postgraduateChoiceOpenedAtMonth: 28,
          recommendationAppliedAtMonth: 34,
          postgraduateResultMonth: 36,
        },
      }),
    },
  ];

  const seededRun = attachPresetMemory({
    run: {
      ...junior.run,
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      semesterAverage: 82.6,
      semesters: [
        { semester: 1, academicScore: 76, feedback: "stable", passed: true },
        { semester: 2, academicScore: 78, feedback: "excellent", passed: true },
        { semester: 3, academicScore: 78, feedback: "excellent", passed: true },
        { semester: 4, academicScore: 79, feedback: "excellent", passed: true },
        { semester: 5, academicScore: 82, feedback: "excellent", passed: true },
        { semester: 6, academicScore: 84, feedback: "excellent", passed: true },
        { semester: 7, academicScore: 84, feedback: "excellent", passed: true },
        { semester: 8, academicScore: 85, feedback: "excellent", passed: true },
      ],
      stats: {
        ...junior.run.stats,
        money: 980,
        mood: 53,
        stress: 61,
        fulfillment: 75,
        social: 49,
        semesterAcademics: 88,
      },
      progression: {
        ...junior.run.progression!,
        dominantDirection: "recommendation",
        recommendationQualification: "eligible",
        recommendationReadiness: 90,
        postgraduateProgress: 52,
        employmentReadiness: 26,
        postgraduateChoiceOpenedAtMonth: 28,
        recommendationAppliedAtMonth: 34,
        postgraduateResultMonth: 36,
        latestHints: [
          "推免线已经落到正式结果，考研只剩保底意义。",
          "前两年的奖学金、竞赛和科研经历在最终材料里都被完整接住了。",
        ],
      },
      futureOffers: [futureOffer],
      resume: junior.resumeRecords.map((record) => makeResumeItem(runId, record)),
    },
    monthlyStates,
    resumeRecords: junior.resumeRecords,
  });

  const acceptedRun = acceptFutureOfferDecision(seededRun, futureOffer.id, "accept");

  return {
    run: {
      ...acceptedRun,
      status: "completed",
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      endingEvidence: pushUniqueEvidence(acceptedRun, [
        {
          id: `${runId}-ending-academic-final`,
          kind: "academic",
          title: "后期学业稳定性",
          body: "后期课程压力一直在，但学业线没有掉下去，最后还是把推免资格稳住了。",
          monthIndex: 48,
        },
        {
          id: `${runId}-ending-stress-final`,
          kind: "stress",
          title: "后期压力",
          body: "大四前后的压力很高，但没有把准备链路打断，更多像是在逼着节奏变得更硬。",
          monthIndex: 48,
        },
      ]),
    },
    monthlyStates,
    resumeRecords: junior.resumeRecords,
  };
}

// Retained temporarily for local preset authoring reference.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildGenericPostgraduateSeed(runId: string): PresetSeed {
  const progression = {
    ...createDefaultCareerRouteState(),
    tendencies: {
      employment: 22,
      postgraduate: 64,
      public_exam: 8,
      recommendation: 30,
      undecided: 10,
    },
    dominantDirection: "postgraduate" as const,
    postgraduateProgress: 42,
    employmentReadiness: 20,
    recommendationReadiness: 28,
    recommendationQualification: "unlikely" as const,
    latestHints: ["这局更像是在给考研线打底。"],
  };
  const resumeRecords = [
    makeResumeRecord({
      year: 1,
      month: 4,
      category: "project",
      title: "数学建模训练｜完成一轮模拟",
      summary: "项目成果一般，但至少让理科路线里有了第一段像样的材料。",
      tags: ["建模", "项目"],
    }),
  ];
  const run = createBasePresetRun({
    id: runId,
    name: "程子维",
    schoolTier: "211",
    cityTier: "tier_2",
    collegeTrack: "science",
    familyBackground: "ordinary",
    monthlyAllowance: 1450,
    luck: 54,
    talents: ["quick-learner", "resourceful"],
    stats: {
      money: 920,
      mood: 52,
      stress: 63,
      fulfillment: 51,
      social: 42,
      semesterAcademics: 76,
    },
    semesterAverage: 71,
    semesters: [
      { semester: 1, academicScore: 69, feedback: "stable", passed: true },
      { semester: 2, academicScore: 72, feedback: "stable", passed: true },
      { semester: 3, academicScore: 71, feedback: "stable", passed: true },
      { semester: 4, academicScore: 72, feedback: "stable", passed: true },
    ],
    scholarships: [],
    resumeRecords,
    progression,
  });

  const monthlyStates: SeedMonthlyRecord[] = [
    {
      year: 2,
      month: 6,
      summary: createMonthlySummary({
        year: 2,
        month: 6,
        statsBefore: { ...run.stats, money: 1100, stress: 56, semesterAcademics: 70, social: 38, mood: 53, fulfillment: 49 },
        statsAfter: { ...run.stats, money: 980, stress: 60, semesterAcademics: 74, social: 40, mood: 52, fulfillment: 52 },
        actions: ["study", "writing_research"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[0]!)],
        notableFacts: ["project:modeling:completed"],
        progression,
      }),
    },
  ];

  return {
    run: attachPresetMemory({ run, monthlyStates, resumeRecords }),
    monthlyStates,
    resumeRecords,
  };
}

// Retained temporarily for local preset authoring reference.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildSecondTierWarningSeed(runId: string): PresetSeed {
  const progression = {
    ...createDefaultCareerRouteState(),
    tendencies: {
      employment: 44,
      postgraduate: 18,
      public_exam: 12,
      recommendation: 8,
      undecided: 24,
    },
    dominantDirection: "employment" as const,
    postgraduateProgress: 8,
    employmentReadiness: 24,
    recommendationReadiness: 6,
    recommendationQualification: "unlikely" as const,
    latestHints: ["这局更适合拿来展示风险预警和普通就业收束。"],
  };
  const resumeRecords = [
    makeResumeRecord({
      year: 2,
      month: 10,
      category: "campus_activity",
      title: "校园活动执行｜留下一段基础经历",
      summary: "没有特别强的奖项，但至少让履历不再完全是空白。",
      tags: ["校园活动", "基础经历"],
    }),
  ];
  const run = createBasePresetRun({
    id: runId,
    name: "许清禾",
    schoolTier: "second_tier",
    cityTier: "tier_3",
    collegeTrack: "arts",
    familyBackground: "struggling",
    monthlyAllowance: 980,
    luck: 46,
    talents: ["stress-resistant", "resourceful"],
    stats: {
      money: 320,
      mood: 41,
      stress: 74,
      fulfillment: 39,
      social: 34,
      semesterAcademics: 58,
    },
    semesterAverage: 62,
    semesters: [
      { semester: 1, academicScore: 60, feedback: "strained", passed: true },
      { semester: 2, academicScore: 63, feedback: "strained", passed: true },
      { semester: 3, academicScore: 62, feedback: "strained", passed: true },
      { semester: 4, academicScore: 63, feedback: "warning", passed: true },
    ],
    scholarships: [],
    resumeRecords,
    progression,
    risk: { academicRisk: 18, burnout: 24 },
  });

  const monthlyStates: SeedMonthlyRecord[] = [
    {
      year: 2,
      month: 10,
      summary: createMonthlySummary({
        year: 2,
        month: 10,
        statsBefore: { ...run.stats, money: 540, stress: 68, semesterAcademics: 55, social: 30, mood: 42, fulfillment: 36 },
        statsAfter: cloneStats(run.stats),
        actions: ["part_time", "student_activity"],
        resumeAdditions: [makeResumeItem(runId, resumeRecords[0]!)],
        notableFacts: ["cash-warning:ongoing"],
        progression,
      }),
    },
  ];

  return {
    run: attachPresetMemory({ run, monthlyStates, resumeRecords }),
    monthlyStates,
    resumeRecords,
  };
}

function buildPresetSeed(presetId: DemoSavePresetId, runId: string): PresetSeed {
  switch (presetId) {
    case "nankai-business-employment-junior-fall":
      return buildNankaiBusinessSeed(runId);
    case "nankai-business-employment-final":
      return buildNankaiEmploymentFinalSeed(runId);
    case "tianda-engineering-recommendation-junior-fall":
      return buildTiandaEngineeringSeed(runId);
    case "tianda-engineering-recommendation-final":
      return buildTiandaRecommendationFinalSeed(runId);
    default:
      return buildNankaiBusinessSeed(runId);
  }
}

export async function createDemoPresetRun(input: {
  repository: DemoRepository;
  presetId: DemoSavePresetId;
  runId?: string;
}) {
  const runId = input.runId ?? randomUUID();
  const seed = buildPresetSeed(input.presetId, runId);

  try {
  await input.repository.createRun({
    id: seed.run.id,
    currentYear: seed.run.currentYear,
    currentMonth: seed.run.currentMonth,
    profile: seed.run.profile,
    currentState: seed.run,
  });

  for (const state of seed.monthlyStates) {
    await input.repository.saveMonthlyState({
      runId: seed.run.id,
      year: state.year,
      month: state.month,
      snapshot: state.summary,
    });

    const report = renderMonthlyJournalFallback({
      kind: "monthly_journal",
      runId: seed.run.id,
      year: state.year,
      month: state.month,
      summary: state.summary,
    });

    await input.repository.saveAiReport({
      runId: seed.run.id,
      year: state.year,
      month: state.month,
      reportType: "monthly_journal",
      inputSummary: state.summary,
      outputMarkdown: report.markdown,
      model: report.model ?? null,
    });
  }

  await input.repository.saveResumeItems(
    seed.resumeRecords.map((record) => ({
      runId: seed.run.id,
      year: record.year,
      month: record.month,
      category: record.category,
      title: record.title,
      summary: record.summary,
      sourceItemId: `${seed.run.id}-${record.year}-${record.month}-${record.title}`,
      metadata: {
        tags: record.tags,
      },
    })),
  );

  await input.repository.writeEventLogs([
    {
      runId: seed.run.id,
      year: seed.run.currentYear,
      month: seed.run.currentMonth,
      logType: "settlement",
      message: "已载入演示存档",
      metadata: {
        presetId: input.presetId,
      },
    },
  ]);
  } catch (error) {
    await input.repository.deleteRun?.(seed.run.id);
    throw error;
  }

  return {
    preset: demoSavePresets.find((preset) => preset.id === input.presetId)!,
    run: seed.run,
  };
}

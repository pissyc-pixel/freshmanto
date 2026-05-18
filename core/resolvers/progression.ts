import type {
  AcademicProfileSnapshot,
  ActionType,
  CareerRouteState,
  CompetitionProject,
  CompetitionAward,
  DirectionKey,
  DirectionTendencyMap,
  GraduationPath,
  GraduationPathResult,
  GameRun,
  RecommendationQualification,
  ResumeItem,
  ScholarshipRecord,
  StarterProfile,
  StructuredMonthlySummary,
} from "@/types/game";

const DIRECTION_KEYS: DirectionKey[] = [
  "employment",
  "postgraduate",
  "public_exam",
  "recommendation",
  "undecided",
];

const TRACK_PROJECT_CATALOG: Record<StarterProfile["collegeTrack"], Array<{ title: string; category: string; routeBias: DirectionKey[] }>> = {
  engineering: [
    { title: "电子设计训练项目", category: "工程实践", routeBias: ["employment", "recommendation"] },
    { title: "工程设计项目赛", category: "项目竞赛", routeBias: ["employment", "postgraduate"] },
    { title: "实验室工程小项目", category: "科研实践", routeBias: ["recommendation", "postgraduate"] },
  ],
  business: [
    { title: "案例分析商赛", category: "案例赛", routeBias: ["employment", "public_exam"] },
    { title: "品牌策划项目赛", category: "项目竞赛", routeBias: ["employment", "postgraduate"] },
    { title: "校企咨询项目", category: "实践项目", routeBias: ["employment", "recommendation"] },
  ],
  science: [
    { title: "数学建模项目", category: "建模竞赛", routeBias: ["postgraduate", "recommendation"] },
    { title: "科研训练小项目", category: "科研实践", routeBias: ["recommendation", "postgraduate"] },
    { title: "学科挑战赛", category: "学科竞赛", routeBias: ["postgraduate", "employment"] },
  ],
  arts: [
    { title: "调研写作项目", category: "写作调研", routeBias: ["public_exam", "postgraduate"] },
    { title: "演讲表达比赛", category: "表达竞赛", routeBias: ["employment", "public_exam"] },
    { title: "城市文化观察计划", category: "调研项目", routeBias: ["postgraduate", "employment"] },
  ],
  medicine: [
    { title: "临床观察实践项目", category: "实践项目", routeBias: ["recommendation", "postgraduate"] },
    { title: "医学调研训练", category: "科研实践", routeBias: ["recommendation", "public_exam"] },
    { title: "实验技能竞赛", category: "技能竞赛", routeBias: ["recommendation", "employment"] },
  ],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultDirectionTendencies(): DirectionTendencyMap {
  return {
    employment: 0,
    postgraduate: 0,
    public_exam: 0,
    recommendation: 0,
    undecided: 8,
  };
}

export function createDefaultCareerRouteState(): CareerRouteState {
  return {
    tendencies: createDefaultDirectionTendencies(),
    dominantDirection: "undecided",
    publicExam: {
      progress: 0,
      aptitudePrep: 0,
      essayPrep: 0,
    },
    postgraduateProgress: 0,
    employmentReadiness: 0,
    recommendationReadiness: 0,
    recommendationQualification: "pending",
    latestHints: [],
  };
}

function schoolTierScore(profile: StarterProfile): number {
  switch (profile.schoolTier) {
    case "qingbei":
      return 10;
    case "nankai_tianda":
      return 8;
    case "985":
      return 7;
    case "211":
      return 5;
    case "first_tier":
      return 3;
    default:
      return 1;
  }
}

function resumeScore(run: GameRun, keywordSets: string[][]): number {
  return run.resume.reduce((score, item) => {
    const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
    return score + (keywordSets.some((keywords) => keywords.some((keyword) => haystack.includes(keyword))) ? 1 : 0);
  }, 0);
}

function buildSemesterKey(year: number, month: number): string {
  return `${year}-${month <= 6 ? "spring" : "fall"}`;
}

function createSeededProject(run: GameRun, slot: number): CompetitionProject {
  const semesterKey = buildSemesterKey(run.currentYear, run.currentMonth);
  const trackCatalog = TRACK_PROJECT_CATALOG[run.profile.collegeTrack];
  const template = trackCatalog[(run.currentYear + run.currentMonth + slot) % trackCatalog.length]!;
  const openedMonth = run.currentMonth <= 6 ? 1 : 7;
  const deadlineMonth = run.currentMonth <= 6 ? 6 : 12;

  return {
    id: `${run.id}-${semesterKey}-competition-${slot}`,
    title: template.title,
    category: template.category,
    track: run.profile.collegeTrack,
    routeBias: template.routeBias,
    semesterKey,
    openedYear: run.currentYear,
    openedMonth,
    deadlineYear: run.currentYear,
    deadlineMonth,
    minimumEffortDays: 3 + slot,
    investedDays: 0,
    status: "open",
    awardPool: slot === 0 ? ["school", "provincial"] : ["school", "provincial", "national"],
    result: null,
  };
}

export function deriveAcademicProfile(run: GameRun): AcademicProfileSnapshot {
  const semesters = run.semesters ?? [];
  const schoolTier = run.profile ? schoolTierScore(run.profile) : 1;
  const semesterAcademics = run.stats?.semesterAcademics ?? 0;
  const academicRisk = run.risk?.academicRisk ?? 0;
  const resumeStrength = run.resume?.length
    ? resumeScore(run, [["科研", "研究", "实验室"], ["竞赛", "比赛"]])
    : 0;
  const hasSettledSemester = semesters.length > 0 && run.semesterAverage > 0;
  const academicBase = hasSettledSemester ? run.semesterAverage : null;
  const gpa = academicBase === null ? null : Number(clamp(academicBase / 20, 1.8, 4.0).toFixed(2));
  const competitionCount = (run.competitionProjects ?? []).filter((project) => project.result).length;
  const scholarshipBonus = (run.scholarships ?? []).reduce((sum, item) => sum + (item.level === "high" ? 3 : item.level === "standard" ? 1 : 0), 0);
  const rank = academicBase === null
    ? null
    : clamp(
      Math.round(65 - academicBase * 0.4 - schoolTier * 1.3 - competitionCount * 1.8 - scholarshipBonus * 2),
      1,
      95,
    );
  const percentile = rank === null ? null : clamp(100 - rank, 1, 99);
  const recommendationScore = clamp(
    Math.round(
      (academicBase ?? clamp(60 + semesterAcademics - academicRisk * 0.7, 45, 92)) * 0.55 +
        competitionCount * 6 +
        scholarshipBonus * 5 +
        schoolTier * 2 +
        resumeStrength * 3,
    ),
    0,
    100,
  );

  return {
    gpa,
    rank,
    percentile,
    recommendationScore,
  };
}

function hasSettledAcademicProfile(profile: AcademicProfileSnapshot): boolean {
  return profile.gpa !== null && profile.rank !== null && profile.percentile !== null;
}

export function determineDominantDirection(tendencies: DirectionTendencyMap): DirectionKey {
  return DIRECTION_KEYS.reduce((best, key) => (tendencies[key] > tendencies[best] ? key : best), "undecided");
}

export function ensureProgressionState(run: GameRun): GameRun {
  const baseProgression = {
    ...createDefaultCareerRouteState(),
    ...(run.progression ?? {}),
    tendencies: {
      ...createDefaultDirectionTendencies(),
      ...(run.progression?.tendencies ?? {}),
    },
    publicExam: {
      ...createDefaultCareerRouteState().publicExam,
      ...(run.progression?.publicExam ?? {}),
    },
    latestHints: run.progression?.latestHints ?? [],
  };
  const dominantDirection = determineDominantDirection(baseProgression.tendencies);
  const competitionProjects = [...(run.competitionProjects ?? [])];
  const semesterKey = buildSemesterKey(run.currentYear, run.currentMonth);
  const existingProjects = competitionProjects.filter((project) => project.semesterKey === semesterKey);

  for (let slot = existingProjects.length; slot < 2; slot += 1) {
    competitionProjects.push(createSeededProject(run, slot));
  }

  return {
    ...run,
    progression: {
      ...baseProgression,
      dominantDirection,
    },
    competitionProjects,
    scholarships: run.scholarships ?? [],
  };
}

export function withTendencyShift(
  run: GameRun,
  shifts: Partial<Record<DirectionKey, number>>,
  hints: string[] = [],
): GameRun {
  const nextRun = ensureProgressionState(run);
  const tendencies = { ...nextRun.progression!.tendencies };

  for (const key of DIRECTION_KEYS) {
    tendencies[key] = clamp(tendencies[key] + (shifts[key] ?? 0), 0, 100);
  }

  return {
    ...nextRun,
    progression: {
      ...nextRun.progression!,
      tendencies,
      dominantDirection: determineDominantDirection(tendencies),
      latestHints: [...new Set([...hints, ...nextRun.progression!.latestHints])].slice(0, 6),
    },
  };
}

export function withProgressMetric(run: GameRun, input: {
  publicExamProgress?: number;
  aptitudePrep?: number;
  essayPrep?: number;
  postgraduateProgress?: number;
  employmentReadiness?: number;
  recommendationReadiness?: number;
}) {
  const nextRun = ensureProgressionState(run);

  return {
    ...nextRun,
    progression: {
      ...nextRun.progression!,
      publicExam: {
        progress: clamp(nextRun.progression!.publicExam.progress + (input.publicExamProgress ?? 0), 0, 100),
        aptitudePrep: clamp(nextRun.progression!.publicExam.aptitudePrep + (input.aptitudePrep ?? 0), 0, 100),
        essayPrep: clamp(nextRun.progression!.publicExam.essayPrep + (input.essayPrep ?? 0), 0, 100),
      },
      postgraduateProgress: clamp(nextRun.progression!.postgraduateProgress + (input.postgraduateProgress ?? 0), 0, 100),
      employmentReadiness: clamp(nextRun.progression!.employmentReadiness + (input.employmentReadiness ?? 0), 0, 100),
      recommendationReadiness: clamp(nextRun.progression!.recommendationReadiness + (input.recommendationReadiness ?? 0), 0, 100),
    },
  };
}

export function countScholarshipRecords(
  records: ScholarshipRecord[] | undefined,
  level?: ScholarshipRecord["level"],
): number {
  if (!records) {
    return 0;
  }

  if (!level) {
    return records.length;
  }

  return records.filter((record) => record.level === level).length;
}

export function countResumeEntriesByCategory(run: GameRun, category: string): number {
  return run.resume.filter((item) => item.category === category).length;
}

export function getLeadCompetitionProject(run: GameRun): CompetitionProject | null {
  const ensuredRun = ensureProgressionState(run);
  return ensuredRun.competitionProjects!.find((project) => project.status === "active") ?? null;
}

export function getOpenCompetitionProjects(run: GameRun): CompetitionProject[] {
  return ensureProgressionState(run).competitionProjects!.filter((project) => project.status === "open");
}

function touchCompetitionProject(run: GameRun, projectId: string, effortDays: number): GameRun {
  const ensuredRun = ensureProgressionState(run);
  const projects = ensuredRun.competitionProjects!.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    return {
      ...project,
      investedDays: project.investedDays + effortDays,
      status: "active" as const,
    };
  });

  return {
    ...ensuredRun,
    competitionProjects: projects,
  };
}

export function activateCompetitionProject(run: GameRun, projectId: string): GameRun {
  const ensuredRun = ensureProgressionState(run);

  return {
    ...ensuredRun,
    competitionProjects: ensuredRun.competitionProjects!.map((project) => {
      if (project.id !== projectId || project.status !== "open") {
        return project;
      }

      return {
        ...project,
        status: "active" as const,
      };
    }),
  };
}

export function closeCompetitionProject(run: GameRun, projectId: string): GameRun {
  const ensuredRun = ensureProgressionState(run);

  return {
    ...ensuredRun,
    competitionProjects: ensuredRun.competitionProjects!.map((project) => {
      if (
        project.id !== projectId ||
        (project.status !== "open" && project.status !== "active")
      ) {
        return project;
      }

      return {
        ...project,
        status: "expired" as const,
      };
    }),
  };
}

export function applyAcceptedActionProgression(run: GameRun, action: ActionType): GameRun {
  let nextRun = ensureProgressionState(run);

  switch (action) {
    case "job_prep":
      nextRun = withTendencyShift(nextRun, {
        employment: 5,
        undecided: -2,
      }, ["开始更频繁地把时间投向履历、投递和面试准备。"]);
      return withProgressMetric(nextRun, {
        employmentReadiness: 4,
      });
    case "postgraduate_prep":
      nextRun = withTendencyShift(nextRun, {
        postgraduate: 5,
        recommendation: 2,
        undecided: -2,
      }, ["这段时间的安排明显在往考研或继续深造靠。"]);
      return withProgressMetric(nextRun, {
        postgraduateProgress: 5,
        recommendationReadiness: 3,
      });
    case "public_exam_prep":
      nextRun = withTendencyShift(nextRun, {
        public_exam: 6,
        undecided: -2,
      }, ["你开始给公考留出稳定投入，方向感会变得更明确。"]);
      return withProgressMetric(nextRun, {
        publicExamProgress: 6,
        aptitudePrep: 4,
        essayPrep: 3,
      });
    case "competition_project": {
      const leadProject = getLeadCompetitionProject(nextRun);

      nextRun = withTendencyShift(nextRun, {
        recommendation: 3,
        postgraduate: 2,
        employment: 2,
        undecided: -2,
      }, ["竞赛和项目投入开始在履历上留下更长线的痕迹。"]);
      nextRun = withProgressMetric(nextRun, {
        recommendationReadiness: 3,
        employmentReadiness: 2,
      });

      if (!leadProject) {
        return nextRun;
      }

      return touchCompetitionProject(nextRun, leadProject.id, 1);
    }
    case "study":
    case "remedy":
      nextRun = withTendencyShift(nextRun, {
        postgraduate: 2,
        recommendation: 2,
        undecided: -1,
      });
      return withProgressMetric(nextRun, {
        postgraduateProgress: action === "study" ? 2 : 1,
        recommendationReadiness: 1,
      });
    case "writing_research":
      nextRun = withTendencyShift(nextRun, {
        postgraduate: 2,
        public_exam: 2,
        recommendation: run.profile.collegeTrack === "science" || run.profile.collegeTrack === "medicine" ? 2 : 1,
        employment: run.profile.collegeTrack === "business" ? 1 : 0,
        undecided: -2,
      }, ["你开始把时间投进写作、资料整理或调研，这会慢慢把表达、深造和项目线都抬出来。"]);
      return withProgressMetric(nextRun, {
        postgraduateProgress: 2,
        recommendationReadiness: run.profile.collegeTrack === "science" || run.profile.collegeTrack === "medicine" ? 2 : 1,
        publicExamProgress: run.profile.collegeTrack === "arts" || run.profile.collegeTrack === "business" ? 2 : 1,
        employmentReadiness: run.profile.collegeTrack === "business" ? 1 : 0,
      });
    case "student_activity":
      return withTendencyShift(nextRun, {
        employment: 1,
        public_exam: 1,
        undecided: -1,
      });
    case "social":
      return withProgressMetric(
        withTendencyShift(nextRun, {
          employment: 1,
        }),
        { employmentReadiness: 1 },
      );
    default:
      return nextRun;
  }
}

export function summarizeDirectionSignals(run: GameRun): string[] {
  const ensuredRun = ensureProgressionState(run);
  const profile = deriveAcademicProfile(ensuredRun);
  const lines: string[] = [];

  if (ensuredRun.currentYear >= 3 && ensuredRun.progression!.dominantDirection !== "undecided") {
    lines.push(`大三以后，你的重心已经更像在往“${formatDirectionLabel(ensuredRun.progression!.dominantDirection)}”这条路走。`);
  }

  if (ensuredRun.progression!.publicExam.progress >= 20) {
    lines.push(`公考进度已经到 ${ensuredRun.progression!.publicExam.progress}，这条线开始有连续性了。`);
  }

  if (profile.gpa !== null && profile.gpa >= 3.5) {
    lines.push(`当前 GPA 约 ${profile.gpa}，如果后续履历再补强，推免线会更有讨论空间。`);
  } else if (!hasSettledAcademicProfile(profile)) {
    lines.push("本学期尚未完成正式结算，GPA 和排名还没真正形成。");
  }

  const leadProject = getLeadCompetitionProject(ensuredRun);
  if (leadProject) {
    lines.push(`这学期手里还有“${leadProject.title}”这样的长期项目入口。`);
  }

  return lines.slice(0, 3);
}

type DirectionScoreCard = {
  key: DirectionKey;
  label: string;
  score: number;
};

export type DirectionPerception = {
  stage: "undecided" | "forming" | "clear";
  primary: DirectionScoreCard;
  secondary: DirectionScoreCard | null;
  summary: string;
  reasons: string[];
  blockers: string[];
};

export type RecommendationExplanation = {
  status: RecommendationQualification;
  summary: string;
  strengths: string[];
  gaps: string[];
};

export type ScholarshipExplanation = {
  level: ScholarshipRecord["level"];
  title: string;
  summary: string;
  reasons: string[];
};

export type PublicExamExplanation = {
  progress: number;
  summary: string;
  signals: string[];
};

export type ResumeEvidenceSummary = {
  academic: string[];
  practice: string[];
  opportunities: string[];
};

function formatDirectionLabel(direction: DirectionKey): string {
  return {
    employment: "就业",
    postgraduate: "考研",
    public_exam: "考公",
    recommendation: "推免",
    undecided: "未定",
  }[direction];
}

function getDirectionScoreCards(run: GameRun): DirectionScoreCard[] {
  const ensuredRun = ensureProgressionState(run);

  return DIRECTION_KEYS.map((key) => ({
    key,
    label: formatDirectionLabel(key),
    score: ensuredRun.progression!.tendencies[key],
  })).sort((left, right) => right.score - left.score);
}

function getDirectionReasons(run: GameRun, direction: DirectionKey): string[] {
  const ensuredRun = ensureProgressionState(run);
  const profile = deriveAcademicProfile(ensuredRun);
  const scholarshipCount = countScholarshipRecords(ensuredRun.scholarships, undefined);
  const competitionCount = (ensuredRun.competitionProjects ?? []).filter((project) => project.result).length;
  const internshipCount = ensuredRun.resume.filter((item) => item.category === "internship").length;
  const projectCount = ensuredRun.resume.filter((item) => ["project", "competition", "research"].includes(item.category)).length;
  const reasons: string[] = [];

  switch (direction) {
    case "employment":
      if ((ensuredRun.progression?.employmentReadiness ?? 0) >= 25) {
        reasons.push("履历和求职准备开始连成线了，不再只是零散尝试。");
      }
      if (internshipCount > 0) {
        reasons.push("已经有实习或实践经历在托住这条线，简历更像在往求职方向长。");
      }
      if (projectCount >= 2) {
        reasons.push("项目和竞赛经历正在补实践证明，让就业方向更有抓手。");
      }
      break;
    case "postgraduate":
      if ((ensuredRun.progression?.postgraduateProgress ?? 0) >= 20) {
        reasons.push("复习和备考投入开始稳定下来，考研已经不是一句口头想法。");
      }
      if (profile.gpa !== null && profile.gpa >= 3.2) {
        reasons.push(`当前 GPA 约 ${profile.gpa}，学业底子能支撑继续往深造方向发力。`);
      }
      if (competitionCount > 0) {
        reasons.push("竞赛和项目积累会让后续继续深造时更有底气。");
      }
      break;
    case "public_exam":
      if ((ensuredRun.progression?.publicExam.progress ?? 0) >= 15) {
        reasons.push(`公考进度已经推进到 ${ensuredRun.progression?.publicExam.progress}，这条线开始有持续投入。`);
      }
      if ((ensuredRun.progression?.publicExam.aptitudePrep ?? 0) >= 12 || (ensuredRun.progression?.publicExam.essayPrep ?? 0) >= 12) {
        reasons.push("你不是只看过讲座，而是真的开始在行测和申论上做准备。");
      }
      break;
    case "recommendation":
      if ((profile.gpa !== null && profile.gpa >= 3.5) || (profile.rank ?? 99) <= 20) {
        reasons.push("成绩和排名已经开始提供推免竞争力，不只是单次发挥。");
      }
      if (scholarshipCount > 0) {
        reasons.push("奖学金和长期稳定表现会直接抬高推免画像。");
      }
      if (competitionCount > 0 || projectCount > 0) {
        reasons.push("竞赛、项目和履历成果在给推免这条线补证据。");
      }
      break;
    default:
      if (projectCount > 0 || internshipCount > 0) {
        reasons.push("虽然还没完全定型，但你已经开始累积一些会影响未来方向的东西。");
      }
      if (reasons.length === 0) {
        reasons.push("现在更像是在打底子，方向感还没有真正收束。");
      }
      break;
  }

  return reasons.slice(0, 3);
}

export function buildDirectionPerception(run: GameRun): DirectionPerception {
  const ensuredRun = ensureProgressionState(run);
  const scoreCards = getDirectionScoreCards(ensuredRun).filter((item) => item.key !== "undecided");
  const primary = scoreCards[0] ?? { key: "undecided" as const, label: "未定", score: ensuredRun.progression!.tendencies.undecided };
  const secondary = scoreCards[1] ?? null;
  const gap = secondary ? primary.score - secondary.score : primary.score;
  const stage: DirectionPerception["stage"] =
    primary.score < 12
      ? "undecided"
      : primary.score >= 28 || gap >= 12
        ? "clear"
        : "forming";
  const reasons = getDirectionReasons(ensuredRun, primary.key);
  const blockers: string[] = [];

  if (primary.key === "recommendation") {
    const profile = deriveAcademicProfile(ensuredRun);
    if (profile.gpa === null || profile.gpa < 3.4) {
      blockers.push("学业还需要再稳一点，推免更看长期成绩的上限。");
    }
    if ((ensuredRun.competitionProjects ?? []).filter((project) => project.result).length === 0) {
      blockers.push("高质量竞赛和项目成果还偏少，画像会显得不够完整。");
    }
  }

  if (primary.key === "public_exam" && (ensuredRun.progression?.publicExam.progress ?? 0) < 35) {
    blockers.push("公考这条线已经起步了，但还没到足够稳的积累段。");
  }

  if (primary.key === "employment" && (ensuredRun.progression?.employmentReadiness ?? 0) < 30) {
    blockers.push("方向更像已经偏向就业，但高质量履历还需要继续补。");
  }

  if (primary.key === "postgraduate" && (ensuredRun.progression?.postgraduateProgress ?? 0) < 28) {
    blockers.push("备考节奏在形成，但还需要更稳定的投入才能真正坐实。");
  }

  const summary =
    stage === "undecided"
      ? "最近还在打底子，未来方向开始有苗头，但还没有明显定型。"
      : stage === "forming"
        ? `你最近已经明显在往“${primary.label}”这条路靠，${secondary ? `同时也还保留一点“${secondary.label}”的可能。` : "只是还没有完全坐实。"}`
        : `现在最像在往“${primary.label}”这条路走，方向感已经比前面清楚很多。`;

  return {
    stage,
    primary,
    secondary,
    summary,
    reasons,
    blockers: blockers.slice(0, 2),
  };
}

export function buildRecommendationExplanation(run: GameRun): RecommendationExplanation {
  const ensuredRun = ensureProgressionState(run);
  const profile = deriveAcademicProfile(ensuredRun);
  const competitionCount = (ensuredRun.competitionProjects ?? []).filter((project) => project.result).length;
  const scholarshipCount = countScholarshipRecords(ensuredRun.scholarships, undefined);
  const status = ensuredRun.progression?.recommendationQualification ?? evaluateRecommendationQualification(ensuredRun);
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (profile.gpa !== null && profile.gpa >= 3.5) {
    strengths.push(`GPA 约 ${profile.gpa}，学业基础已经在推免竞争线附近。`);
  } else if (profile.gpa !== null) {
    gaps.push(`GPA 目前约 ${profile.gpa}，学业上限还可以继续往上抬。`);
  } else {
    gaps.push("本学期 GPA 还没结算出来，推免画像暂时还缺学业硬指标。");
  }

  if ((profile.rank ?? 99) <= 20 || (profile.percentile ?? 0) >= 80) {
    strengths.push(`当前排名和百分比大致落在比较有竞争力的位置。`);
  } else {
    gaps.push("排名还不够稳，推免看的是持续性的前排表现。");
  }

  if (competitionCount > 0) {
    strengths.push("已经有竞赛或项目成果在替你补综合画像。");
  } else {
    gaps.push("高质量竞赛和项目成果还偏少，综合支撑感不够。");
  }

  if (scholarshipCount > 0) {
    strengths.push("奖学金会让老师和评审更容易看到你前期积累的稳定性。");
  }

  const summaryMap: Record<RecommendationQualification, string> = {
    pending: "推免资格还没到正式判断的时候，当前更像是在继续积累画像。",
    eligible: "现在这份画像已经具备比较明确的推免竞争力，后面更像是在决定接不接受这条路。",
    borderline: "你已经摸到推免边缘了，优势有了，但还需要补齐短板才能更稳。",
    unlikely: "眼下离推免线还有距离，主要问题不是某一次发挥，而是整体画像还不够硬。",
    accepted: "推免这条线已经落定，前期积累最后变成了明确结果。",
    declined_to_postgraduate: "你本来有推免机会，但最后选择把方向转向考研。",
    declined_to_employment: "你本来有推免机会，但最后选择把方向转向就业。",
  };

  return {
    status,
    summary: summaryMap[status],
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
  };
}

function countSnapshotCompetitionResults(summary: StructuredMonthlySummary): number {
  if (summary.competitionProjects) {
    return summary.competitionProjects.filter((project) => project.result).length;
  }

  return summary.resumeAdditions.filter((item) => item.category === "competition").length;
}

export function buildRecommendationExplanationFromSummary(
  summary: StructuredMonthlySummary,
): RecommendationExplanation {
  const profile = summary.academicProfile;
  const competitionCount = countSnapshotCompetitionResults(summary);
  const scholarshipAwarded = summary.scholarshipAwarded;
  const status = summary.progression?.recommendationQualification ?? "pending";
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (profile?.gpa !== null && profile?.gpa !== undefined) {
    if (profile.gpa >= 3.5) {
      strengths.push(`这份月结算快照里的 GPA 约 ${profile.gpa}，学业基础已经在推免竞争线附近。`);
    } else {
      gaps.push(`这份月结算快照里的 GPA 约 ${profile.gpa}，学业上限还可以继续往上抬。`);
    }
  } else {
    gaps.push("这份月结算快照里还没有已结算 GPA，推免画像暂时不能按绩点判断。");
  }

  if ((profile?.rank ?? 99) <= 20 || (profile?.percentile ?? 0) >= 80) {
    strengths.push("这份月结算快照里的排名已经比较接近推免会重点看的区间。");
  } else if (profile) {
    gaps.push("这份月结算快照里的排名还不算稳，推免更看持续性的前排表现。");
  }

  if (competitionCount > 0) {
    strengths.push("这份月结算快照里已经有竞赛或项目结果，在给推免画像补综合证明。");
  } else {
    gaps.push("这份月结算快照里还看不到足够的竞赛或项目结果，综合支撑感偏弱。");
  }

  if (scholarshipAwarded && scholarshipAwarded.level !== "none") {
    strengths.push("这个月结算快照里已经出现奖学金结果，说明阶段性稳定表现被看见了。");
  }

  const summaryMap: Record<RecommendationQualification, string> = {
    pending: "这份月结算快照里，推免资格还没到正式判断的时候，当前更像是在继续积累画像。",
    eligible: "按这份月结算快照看，你已经具备比较明确的推免竞争力，后面更像是在决定接不接受这条路。",
    borderline: "按这份月结算快照看，你已经摸到推免边缘了，优势有了，但还需要补齐短板。",
    unlikely: "按这份月结算快照看，离推免线还有距离，问题更像是整体画像还不够硬。",
    accepted: "按这份月结算快照看，推免这条线已经落定，前期积累最终变成了明确结果。",
    declined_to_postgraduate: "按这份月结算快照看，你本来有推免机会，但最后把方向转向了考研。",
    declined_to_employment: "按这份月结算快照看，你本来有推免机会，但最后把方向转向了就业。",
  };

  return {
    status,
    summary: summaryMap[status],
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
  };
}

export function buildScholarshipExplanation(run: GameRun): ScholarshipExplanation | null {
  const ensuredRun = ensureProgressionState(run);
  const latestScholarship = [...(ensuredRun.scholarships ?? [])].sort((left, right) => right.academicYear - left.academicYear)[0];

  if (!latestScholarship) {
    return null;
  }

  const profile = deriveAcademicProfile(ensuredRun);
  const competitionCount = (ensuredRun.competitionProjects ?? []).filter((project) => project.result).length;
  const hasFailure = ensuredRun.semesters.some((item) => !item.passed);
  const reasons: string[] = [];

  if (profile.gpa !== null && profile.gpa >= 3.3) {
    reasons.push(`学业表现比较稳，当前 GPA 大约在 ${profile.gpa} 左右。`);
  } else if (profile.gpa !== null) {
    reasons.push("学业基础还不算特别突出，奖学金更多取决于整体稳定度。");
  } else {
    reasons.push("这学期还没完成正式结算，奖学金线暂时看不到已落地的 GPA。");
  }

  if ((profile.rank ?? 99) <= 30) {
    reasons.push("排名和百分比没有掉出前排，这是奖学金最硬的一层底子。");
  }

  if (competitionCount > 0) {
    reasons.push("竞赛和项目成果帮你把这份结果往上托了一截。");
  }

  if (hasFailure) {
    reasons.push("挂科或学业波动会明显拉低奖学金竞争力。");
  }

  const summary =
    latestScholarship.level === "high"
      ? "这次奖学金更像是上一学年整体积累被看见了，学业、排名和额外成果都在加分。"
      : latestScholarship.level === "standard"
        ? "能拿到这笔奖学金，说明你上一学年的整体表现至少是稳住了的。"
        : "这次没等来奖学金，通常不是单个动作失误，而是学业和成果的综合竞争力还没到线。";

  return {
    level: latestScholarship.level,
    title: latestScholarship.title,
    summary,
    reasons: reasons.slice(0, 3),
  };
}

export function buildScholarshipExplanationFromSummary(
  summary: StructuredMonthlySummary,
): ScholarshipExplanation | null {
  const scholarship = summary.scholarshipAwarded;

  if (!scholarship) {
    return null;
  }

  const competitionCount = countSnapshotCompetitionResults(summary);
  const reasons: string[] = [];

  if (summary.academicProfile?.gpa !== null && summary.academicProfile?.gpa !== undefined) {
    if (summary.academicProfile.gpa >= 3.3) {
      reasons.push(`这份月结算快照里的 GPA 约 ${summary.academicProfile.gpa}，学业表现整体比较稳。`);
    } else {
      reasons.push(`这份月结算快照里的 GPA 约 ${summary.academicProfile.gpa}，学业基础还不算特别突出。`);
    }
  } else {
    reasons.push("这份月结算快照里还没有已结算 GPA，所以奖学金判断更偏阶段过程。");
  }

  if ((summary.academicProfile?.rank ?? 99) <= 30) {
    reasons.push("这份月结算快照里的排名没有掉出前排，这是奖学金最硬的一层底子。");
  }

  if (competitionCount > 0) {
    reasons.push("这份月结算快照里已经有竞赛或项目结果，在帮你把这份结果往上托。");
  }

  if (scholarship.reason) {
    reasons.push(scholarship.reason);
  }

  const explanationSummary =
    scholarship.level === "high"
      ? "这次奖学金更像是上一学年整体积累被看见了，学业、排名和额外成果都在加分。"
      : scholarship.level === "standard"
        ? "能拿到这笔奖学金，说明上一学年的整体表现至少是稳住了。"
        : "这次没有等来奖学金，通常不是单个动作失误，而是学业和成果的综合竞争力还没到线。";

  return {
    level: scholarship.level,
    title: scholarship.title,
    summary: explanationSummary,
    reasons: reasons.slice(0, 3),
  };
}

export function buildPublicExamExplanation(run: GameRun): PublicExamExplanation {
  const ensuredRun = ensureProgressionState(run);
  const publicExam = ensuredRun.progression?.publicExam ?? createDefaultCareerRouteState().publicExam;
  const signals: string[] = [];

  if (publicExam.progress >= 15) {
    signals.push("你已经不只是偶尔看看信息，而是开始有持续准备。");
  }
  if (publicExam.aptitudePrep >= 12) {
    signals.push("行测准备已经动起来了，这说明公考线不是一句空话。");
  }
  if (publicExam.essayPrep >= 12) {
    signals.push("申论也开始跟上，说明这条线的投入正在变完整。");
  }
  if (signals.length === 0) {
    signals.push("现在更像是在试探这条线，离真正稳定准备还有一点距离。");
  }

  const summary =
    publicExam.progress >= 55
      ? "公考已经从兴趣项变成比较实在的后期路线，接下来更看能不能持续顶住节奏。"
      : publicExam.progress >= 25
        ? "公考准备已经形成连续性，这个数值代表你在慢慢把它从想法变成路径。"
        : "公考进度刚起步，它意味着你已经开始把时间切给这条未来路线。";

  return {
    progress: publicExam.progress,
    summary,
    signals: signals.slice(0, 3),
  };
}

export function buildPublicExamExplanationFromSummary(
  summary: StructuredMonthlySummary,
): PublicExamExplanation {
  const publicExam = summary.progression?.publicExam ?? createDefaultCareerRouteState().publicExam;
  const signals: string[] = [];

  if (publicExam.progress >= 15) {
    signals.push("按这份月结算快照看，你已经不只是偶尔看看信息，而是开始有持续准备。");
  }
  if (publicExam.aptitudePrep >= 12) {
    signals.push("按这份月结算快照看，行测准备已经动起来了，这说明公考线不是一句空话。");
  }
  if (publicExam.essayPrep >= 12) {
    signals.push("按这份月结算快照看，申论也开始跟上，这条线的投入正在变完整。");
  }
  if (signals.length === 0) {
    signals.push("按这份月结算快照看，现在更像是在试探这条线，离稳定准备还有距离。");
  }

  const summaryText =
    publicExam.progress >= 55
      ? "按这份月结算快照看，公考已经从兴趣项变成比较实在的后期路线。"
      : publicExam.progress >= 25
        ? "按这份月结算快照看，公考准备已经形成连续性，正在从想法变成路径。"
        : "按这份月结算快照看，公考进度刚起步，你已经开始把时间切给这条未来路线。";

  return {
    progress: publicExam.progress,
    summary: summaryText,
    signals: signals.slice(0, 3),
  };
}

export function buildResumeEvidenceSummary(run: GameRun): ResumeEvidenceSummary {
  const ensuredRun = ensureProgressionState(run);
  const profile = deriveAcademicProfile(ensuredRun);
  const competitionCount = (ensuredRun.competitionProjects ?? []).filter((project) => project.result).length;
  const internshipCount = ensuredRun.resume.filter((item) => item.category === "internship").length;
  const scholarshipCount = countScholarshipRecords(ensuredRun.scholarships, undefined);

  const academic = [
    hasSettledAcademicProfile(profile)
      ? `GPA 约 ${profile.gpa}，当前排名大约在前 ${profile.percentile ?? 0}% 的位置附近。`
      : "GPA、排名和百分位都还没到正式结算的时候，学业线暂时只能先看阶段积累。",
    scholarshipCount > 0 ? `已经累计 ${scholarshipCount} 次奖学金结果，说明前期成绩不只是偶尔冒尖。` : "奖学金还比较空，说明学业竞争力还在继续补。",
  ];
  const practice = [
    internshipCount > 0 ? `已经有 ${internshipCount} 段实习 / 实践经历在托住就业线。` : "实习和实践经历还偏少，就业线更像刚起步。",
    competitionCount > 0 ? `竞赛和项目成果已经开始成为履历里的硬证据。` : "竞赛和项目成果还不够多，综合画像会显得薄一点。",
  ];
  const opportunities = [
    ensuredRun.progression?.recommendationQualification === "eligible"
      ? "推免资格已经打开，后面要考虑的是接受还是转向。"
      : ensuredRun.progression?.recommendationQualification === "borderline"
        ? "推免已经摸到边缘，说明努力开始换来现实机会。"
        : "推免机会暂时还没完全打开，后面更看学业和成果能不能继续往上顶。",
    (ensuredRun.progression?.publicExam.progress ?? 0) >= 20
      ? "公考线已经从信息收集变成了有准备痕迹的备选路径。"
      : "公考目前还只是比较早期的线索，没有真正站稳。",
  ];

  return {
    academic,
    practice,
    opportunities,
  };
}

function createResumeItem(run: GameRun, title: string, summary: string, category: ResumeItem["category"], tags: string[] = []): ResumeItem {
  return {
    id: `${run.id}-${run.currentYear}-${run.currentMonth}-${title}`,
    category,
    title,
    summary,
    month: run.currentMonth,
    tags,
  };
}

function competitionScore(run: GameRun, project: CompetitionProject): number {
  const academic = deriveAcademicProfile(run).recommendationScore;
  const effort = project.investedDays * 8;
  const school = schoolTierScore(run.profile) * 4;

  return clamp(academic + effort + school + run.profile.luck / 4, 0, 100);
}

function decideCompetitionAward(run: GameRun, project: CompetitionProject): CompetitionAward | null {
  if (project.investedDays < project.minimumEffortDays) {
    return null;
  }

  const score = competitionScore(run, project);

  if (project.awardPool.includes("national") && score >= 90) {
    return { level: "national", rank: score >= 96 ? "first" : score >= 93 ? "second" : "third" };
  }
  if (project.awardPool.includes("provincial") && score >= 72) {
    return { level: "provincial", rank: score >= 86 ? "first" : score >= 79 ? "second" : "third" };
  }
  if (score >= 55) {
    return { level: "school", rank: score >= 68 ? "first" : score >= 61 ? "second" : "third" };
  }

  return null;
}

function formatCompetitionAward(award: CompetitionAward): string {
  const levelLabel = {
    school: "校级",
    provincial: "省级",
    national: "国家级",
  }[award.level];
  const rankLabel = {
    first: "一等奖",
    second: "二等奖",
    third: "三等奖",
  }[award.rank];

  return `${levelLabel}${rankLabel}`;
}

function evaluateScholarshipLevel(run: GameRun, academicYear: number): ScholarshipRecord | null {
  if (academicYear <= 1) {
    return null;
  }

  const existing = run.scholarships?.some((record) => record.academicYear === academicYear);
  if (existing) {
    return null;
  }

  const semesterStart = (academicYear - 2) * 2;
  const yearSemesters = (run.semesters ?? []).slice(semesterStart, semesterStart + 2);
  if (yearSemesters.length === 0) {
    return null;
  }

  const average = yearSemesters.reduce((sum, item) => sum + item.academicScore, 0) / yearSemesters.length;
  const hasFailure = yearSemesters.some((item) => !item.passed);
  const competitionBonus = (run.competitionProjects ?? []).filter((project) => project.result).length;
  const resumeBonus = run.resume.filter((item) => item.category === "competition" || item.category === "research").length;
  const schoolBonus = schoolTierScore(run.profile);
  const score = average + competitionBonus * 5 + resumeBonus * 2 + schoolBonus * 1.5 - (hasFailure ? 20 : 0);

  if (score >= 92) {
    return {
      id: `${run.id}-scholarship-${academicYear}`,
      academicYear,
      level: "high",
      amount: 5000,
      title: "高等级奖学金",
      reason: "上一学年的学业表现、竞赛和履历积累都比较强。",
    };
  }

  if (score >= 78) {
    return {
      id: `${run.id}-scholarship-${academicYear}`,
      academicYear,
      level: "standard",
      amount: 2000,
      title: "普通奖学金",
      reason: "上一学年的整体表现比较稳，拿到了基础奖学金。",
    };
  }

  return {
    id: `${run.id}-scholarship-${academicYear}`,
    academicYear,
    level: "none",
    amount: 0,
    title: "未获得奖学金",
    reason: "上一学年的表现还没有到奖学金线。",
  };
}

export function evaluateRecommendationQualification(run: GameRun): RecommendationQualification {
  const profile = deriveAcademicProfile(run);
  const competitionCount = (run.competitionProjects ?? []).filter((project) => project.result).length;
  const scholarshipCount = (run.scholarships ?? []).filter((record) => record.level !== "none").length;
  const score =
    (profile.gpa ?? 0) * 20 +
    (100 - (profile.rank ?? 90)) * 0.4 +
    (profile.percentile ?? 0) * 0.2 +
    competitionCount * 6 +
    scholarshipCount * 6 +
    schoolTierScore(run.profile) * 3;

  if (score >= 88) {
    return "eligible";
  }
  if (score >= 72) {
    return "borderline";
  }
  return "unlikely";
}

export function settleLongTermProgression(run: GameRun, input: {
  playedYear: number;
  playedMonth: number;
}) {
  let nextRun = ensureProgressionState(run);
  const resumeAdditions: ResumeItem[] = [];
  const notableFacts: string[] = [];
  let scholarshipAwarded: ScholarshipRecord | undefined;

  if (input.playedMonth % 6 === 0) {
    const semesterKey = `${input.playedYear}-${input.playedMonth <= 6 ? "spring" : "fall"}`;
    const updatedProjects = nextRun.competitionProjects!.map((project) => {
      if (project.semesterKey !== semesterKey || (project.status !== "open" && project.status !== "active")) {
        return project;
      }

      const award = decideCompetitionAward(nextRun, project);
      if (!award) {
        notableFacts.push(`competition:${project.title}:unfinished`);
        return {
          ...project,
          status: "expired" as const,
          result: null,
        };
      }

      const awardLabel = formatCompetitionAward(award);
      notableFacts.push(`competition:${project.title}:${award.level}-${award.rank}`);
      resumeAdditions.push(
        createResumeItem(
          nextRun,
          `${project.title} ${awardLabel}`,
          `在 ${project.title} 中拿到了 ${awardLabel}，属于这一学期比较扎实的一条长期成果。`,
          "competition",
          [project.category, award.level, award.rank],
        ),
      );
      return {
        ...project,
        status: "completed" as const,
        result: award,
      };
    });

    nextRun = {
      ...nextRun,
      competitionProjects: updatedProjects,
      resume: [...nextRun.resume, ...resumeAdditions],
    };
  }

  if (input.playedMonth === 12) {
    const scholarship = evaluateScholarshipLevel(nextRun, nextRun.currentYear);
    if (scholarship) {
      scholarshipAwarded = scholarship;
      notableFacts.push(`scholarship:${scholarship.level}:${scholarship.academicYear}`);
      nextRun = {
        ...nextRun,
        stats: {
          ...nextRun.stats,
          money: nextRun.stats.money + scholarship.amount,
          fulfillment: clamp(nextRun.stats.fulfillment + (scholarship.level === "high" ? 8 : scholarship.level === "standard" ? 4 : 0), 0, 100),
        },
        scholarships: [...(nextRun.scholarships ?? []), scholarship],
      };

      if (scholarship.level !== "none") {
        const scholarshipResume = createResumeItem(
          nextRun,
          scholarship.title,
          scholarship.reason,
          "scholarship",
          ["scholarship", scholarship.level],
        );
        nextRun = {
          ...nextRun,
          resume: [...nextRun.resume, scholarshipResume],
        };
        resumeAdditions.push(scholarshipResume);
      }
    }
  }

  if (
    nextRun.currentYear === 3 &&
    nextRun.currentMonth >= 7 &&
    nextRun.progression?.recommendationQualification === "pending"
  ) {
    const qualification = evaluateRecommendationQualification(nextRun);
    nextRun = {
      ...nextRun,
      progression: {
        ...nextRun.progression!,
        recommendationQualification: qualification,
        recommendationEvaluatedAtYear: nextRun.currentYear,
        recommendationEvaluatedAtMonth: nextRun.currentMonth,
        latestHints: [
          `大三下已经出现了一次较明确的推免资格判断：${qualification}。`,
          ...nextRun.progression!.latestHints,
        ].slice(0, 6),
      },
    };
    notableFacts.push(`recommendation:${qualification}`);
  }

  return {
    run: nextRun,
    resumeAdditions,
    notableFacts,
    scholarshipAwarded,
  };
}

export function inferGraduationPath(run: GameRun): GraduationPath {
  const ensuredRun = ensureProgressionState(run);

  if (ensuredRun.progression?.recommendationQualification === "eligible" && ensuredRun.progression.dominantDirection === "recommendation") {
    return "recommendation";
  }
  if ((ensuredRun.progression?.publicExam.progress ?? 0) >= 55 && ensuredRun.progression?.dominantDirection === "public_exam") {
    return "public_exam";
  }
  if ((ensuredRun.progression?.postgraduateProgress ?? 0) >= 45 && ["postgraduate", "recommendation"].includes(ensuredRun.progression?.dominantDirection ?? "")) {
    return "postgraduate_exam";
  }
  if ((ensuredRun.progression?.employmentReadiness ?? 0) >= 35 || ensuredRun.progression?.dominantDirection === "employment") {
    return "employment";
  }

  return "undecided";
}

export function inferGraduationPathResult(run: GameRun, path: GraduationPath): GraduationPathResult {
  const profile = deriveAcademicProfile(run);

  switch (path) {
    case "recommendation":
      if (run.progression?.recommendationQualification === "eligible") {
        return "success";
      }
      return run.progression?.recommendationQualification === "borderline" ? "ordinary" : "pivot";
    case "public_exam":
      return (run.progression?.publicExam.progress ?? 0) >= 75 ? "success" : (run.progression?.publicExam.progress ?? 0) >= 45 ? "ordinary" : "failure";
    case "postgraduate_exam":
      return (run.progression?.postgraduateProgress ?? 0) + (profile.gpa ?? 0) * 10 >= 78 ? "success" : (run.progression?.postgraduateProgress ?? 0) >= 38 ? "ordinary" : "failure";
    case "employment":
      return (run.progression?.employmentReadiness ?? 0) + schoolTierScore(run.profile) * 4 >= 65 ? "success" : (run.progression?.employmentReadiness ?? 0) >= 28 ? "ordinary" : "failure";
    default:
      return "pivot";
  }
}

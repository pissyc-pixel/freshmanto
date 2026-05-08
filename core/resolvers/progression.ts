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
  const academicBase =
    run.semesterAverage > 0
      ? run.semesterAverage
      : clamp(60 + run.stats.semesterAcademics - run.risk.academicRisk * 0.7, 45, 92);
  const gpa = Number(clamp(academicBase / 20, 1.8, 4.0).toFixed(2));
  const competitionCount = (run.competitionProjects ?? []).filter((project) => project.result).length;
  const scholarshipBonus = (run.scholarships ?? []).reduce((sum, item) => sum + (item.level === "high" ? 3 : item.level === "standard" ? 1 : 0), 0);
  const rank = clamp(
    Math.round(65 - academicBase * 0.4 - schoolTierScore(run.profile) * 1.3 - competitionCount * 1.8 - scholarshipBonus * 2),
    1,
    95,
  );
  const percentile = clamp(100 - rank, 1, 99);
  const recommendationScore = clamp(
    Math.round(
      academicBase * 0.55 +
        competitionCount * 6 +
        scholarshipBonus * 5 +
        schoolTierScore(run.profile) * 2 +
        resumeScore(run, [["科研", "研究", "实验室"], ["竞赛", "比赛"]]) * 3,
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
  return ensuredRun.competitionProjects!.find((project) => project.status === "active")
    ?? ensuredRun.competitionProjects!.find((project) => project.status === "open")
    ?? null;
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
    lines.push(`大三以后，你的重心已经更像在往“${ensuredRun.progression!.dominantDirection}”这条路走。`);
  }

  if (ensuredRun.progression!.publicExam.progress >= 20) {
    lines.push(`公考进度已经到 ${ensuredRun.progression!.publicExam.progress}，这条线开始有连续性了。`);
  }

  if (profile.gpa >= 3.5) {
    lines.push(`当前 GPA 约 ${profile.gpa}，如果后续履历再补强，推免线会更有讨论空间。`);
  }

  const leadProject = getLeadCompetitionProject(ensuredRun);
  if (leadProject) {
    lines.push(`这学期手里还有“${leadProject.title}”这样的长期项目入口。`);
  }

  return lines.slice(0, 3);
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
  const yearSemesters = run.semesters.slice(semesterStart, semesterStart + 2);
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
    profile.gpa * 20 +
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
      return (run.progression?.postgraduateProgress ?? 0) + profile.gpa * 10 >= 78 ? "success" : (run.progression?.postgraduateProgress ?? 0) >= 38 ? "ordinary" : "failure";
    case "employment":
      return (run.progression?.employmentReadiness ?? 0) + schoolTierScore(run.profile) * 4 >= 65 ? "success" : (run.progression?.employmentReadiness ?? 0) >= 28 ? "ordinary" : "failure";
    default:
      return "pivot";
  }
}

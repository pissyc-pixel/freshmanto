import {
  ensureProgressionState,
  inferGraduationPath,
  inferGraduationPathResult,
} from "@/core/resolvers/progression";
import type {
  GameRun,
  GraduationOutcome,
  SemesterFeedback,
  SemesterRecord,
  SemesterSettlementResult,
  StructuredEndingSummary,
} from "@/types/game";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function evaluateSemesterFeedback(score: number): SemesterFeedback {
  if (score >= 85) {
    return "excellent";
  }
  if (score >= 60) {
    return "stable";
  }
  if (score >= 45) {
    return "strained";
  }
  if (score >= 30) {
    return "warning";
  }
  return "critical";
}

function canPassFinal(score: number, luck: number): boolean {
  return score >= 60 || (score >= 56 && score + luck >= 120);
}

function calculateAverage(semesters: SemesterRecord[]): number {
  if (semesters.length === 0) {
    return 0;
  }

  const total = semesters.reduce((sum, semester) => sum + semester.academicScore, 0);
  return Math.round((total / semesters.length) * 10) / 10;
}

function calculateMentalPenalty(run: GameRun): number {
  const stressPenalty = run.stats.stress >= 75 ? Math.floor((run.stats.stress - 70) / 6) : 0;
  const burnoutPenalty = Math.floor(run.risk.burnout / 12);

  return Math.max(0, stressPenalty + burnoutPenalty);
}

function deriveRiskFlags(run: GameRun, nextRecord: SemesterRecord): string[] {
  const flags = new Set(run.riskFlags);

  if (!nextRecord.passed) {
    flags.add("course_failure");
  }
  if (nextRecord.feedback === "critical") {
    flags.add("chronic_failure");
  }
  if (run.stats.stress >= 80 || run.risk.burnout >= 30) {
    flags.add("burnout");
  }
  if (run.stats.money < 0) {
    flags.add("financial_instability");
  }

  return [...flags];
}

export function settleSemester(run: GameRun): SemesterSettlementResult {
  const rawScore = run.stats.semesterAcademics - run.risk.academicRisk - calculateMentalPenalty(run);
  const academicScore = clamp(Math.round(rawScore), 0, 100);
  const feedback = evaluateSemesterFeedback(academicScore);
  const passed = canPassFinal(academicScore, run.profile.luck);
  const semesterRecord: SemesterRecord = {
    semester: run.currentSemester,
    academicScore,
    feedback,
    passed,
  };
  const semesters = [...run.semesters, semesterRecord];

  return {
    run: {
      ...run,
      currentSemester: run.currentSemester + 1,
      semesterAverage: calculateAverage(semesters),
      semesters,
      riskFlags: deriveRiskFlags(run, semesterRecord),
      stats: {
        ...run.stats,
        semesterAcademics: 0,
      },
      risk: {
        academicRisk: Math.max(0, Math.round(run.risk.academicRisk * 0.35)),
        burnout: Math.max(0, Math.round(run.risk.burnout * 0.6)),
      },
    },
    summary: semesterRecord,
  };
}

function determineOutcome(run: GameRun): GraduationOutcome {
  const failCount = run.semesters.filter((semester) => !semester.passed).length;
  const average = run.semesters.length > 0 ? calculateAverage(run.semesters) : Math.max(65, 60 + run.profile.luck / 5);
  const severeFlags = new Set(run.riskFlags);

  if (failCount >= 6 && average < 25 && severeFlags.has("burnout") && severeFlags.has("financial_instability")) {
    return "drop_out";
  }
  if (failCount >= 5 || average < 35) {
    return "cannot_graduate";
  }
  if (failCount >= 3 || average < 55) {
    return "delayed";
  }
  return "graduate";
}

export function evaluateGraduationOutcome(run: GameRun): StructuredEndingSummary {
  const ensuredRun = ensureProgressionState(run);
  const outcome = determineOutcome(ensuredRun);
  const graduationPath = inferGraduationPath(ensuredRun);

  return {
    finalYear: Math.min(ensuredRun.currentYear, 4),
    outcome,
    longTermAcademicAverage:
      ensuredRun.semesters.length > 0
        ? calculateAverage(ensuredRun.semesters)
        : Math.max(65, 60 + ensuredRun.profile.luck / 5),
    resumeHighlights: ensuredRun.resume.slice(-5),
    notableFacts: [
      `failed-semesters:${ensuredRun.semesters.filter((semester) => !semester.passed).length}`,
      `risk-flags:${ensuredRun.riskFlags.length}`,
    ],
    dominantDirection: ensuredRun.progression?.dominantDirection,
    graduationPath,
    pathResult: inferGraduationPathResult(ensuredRun, graduationPath),
    recommendationQualification: ensuredRun.progression?.recommendationQualification,
    publicExamProgress: ensuredRun.progression?.publicExam.progress,
  };
}

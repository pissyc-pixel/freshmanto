import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import {
  buildDirectionPerception,
  buildPublicExamExplanation,
  buildPublicExamExplanationFromSummary,
  buildRecommendationExplanation,
  buildRecommendationExplanationFromSummary,
  buildScholarshipExplanation,
  buildScholarshipExplanationFromSummary,
  ensureProgressionState,
  summarizeDirectionSignals,
} from "@/core/resolvers/progression";
import type { GameRun, StructuredMonthlySummary } from "@/types/game";

function createBaseRun(id: string): GameRun {
  return ensureProgressionState(
    createInitialGameRun({
      id,
      randomValues: [0.12, 0.24, 0.36, 0.48, 0.6, 0.18, 0.3, 0.42],
    }),
  );
}

describe("progression perception helpers", () => {
  it("summarizes an emerging employment direction with readable reasons", () => {
    const baseRun = createBaseRun("direction-employment");
    const run: GameRun = {
      ...baseRun,
      currentYear: 3,
      resume: [
        {
          id: "intern-1",
          category: "internship",
          title: "暑期产品实习",
          summary: "参与需求梳理和用户访谈。",
          month: 7,
          tags: ["internship", "实践"],
        },
      ],
      progression: {
        ...baseRun.progression!,
        tendencies: {
          ...baseRun.progression!.tendencies,
          employment: 32,
          recommendation: 18,
          postgraduate: 14,
          undecided: 6,
        },
        dominantDirection: "employment",
        employmentReadiness: 36,
      },
    };

    const perception = buildDirectionPerception(run);

    expect(perception.primary.key).toBe("employment");
    expect(["forming", "clear"]).toContain(perception.stage);
    expect(perception.reasons.length).toBeGreaterThan(0);
    expect(perception.summary).toContain("就业");
  });

  it("keeps direction signal copy readable instead of exposing raw direction enums", () => {
    const baseRun = createBaseRun("direction-signal-readable");
    const run: GameRun = {
      ...baseRun,
      currentYear: 3,
      progression: {
        ...baseRun.progression!,
        dominantDirection: "employment",
        employmentReadiness: 38,
        tendencies: {
          ...baseRun.progression!.tendencies,
          employment: 36,
          recommendation: 14,
          postgraduate: 9,
          undecided: 4,
        },
      },
    };

    const lines = summarizeDirectionSignals(run);

    expect(lines.some((line) => line.includes("就业"))).toBe(true);
    expect(lines.join(" ")).not.toContain("employment");
  });

  it("explains recommendation qualification through strengths and gaps", () => {
    const baseRun = createBaseRun("direction-recommendation");
    const run: GameRun = {
      ...baseRun,
      currentYear: 3,
      currentMonth: 8,
      semesterAverage: 89,
      semesters: [
        { semester: 1, academicScore: 90, feedback: "excellent", passed: true },
        { semester: 2, academicScore: 88, feedback: "excellent", passed: true },
        { semester: 3, academicScore: 91, feedback: "excellent", passed: true },
        { semester: 4, academicScore: 87, feedback: "excellent", passed: true },
      ],
      scholarships: [
        {
          id: "sch-1",
          academicYear: 2,
          level: "high",
          amount: 5000,
          title: "高等级奖学金",
          reason: "上一学年的学业和竞赛表现都比较强。",
        },
      ],
      resume: [
        {
          id: "competition-1",
          category: "competition",
          title: "国家级数学建模竞赛二等奖",
          summary: "完整推进了项目答辩和材料整理。",
          month: 6,
          tags: ["competition", "national"],
        },
      ],
      progression: {
        ...baseRun.progression!,
        recommendationQualification: "eligible",
        recommendationReadiness: 52,
        tendencies: {
          ...baseRun.progression!.tendencies,
          recommendation: 35,
          postgraduate: 22,
          undecided: 4,
        },
        dominantDirection: "recommendation",
      },
    };

    const explanation = buildRecommendationExplanation(run);

    expect(explanation.status).toBe("eligible");
    expect(explanation.strengths.length).toBeGreaterThan(0);
    expect(explanation.summary).toContain("推免");
  });

  it("explains scholarship outcomes instead of leaving them as a black box", () => {
    const baseRun = createBaseRun("direction-scholarship");
    const run: GameRun = {
      ...baseRun,
      semesterAverage: 86,
      semesters: [
        { semester: 1, academicScore: 84, feedback: "excellent", passed: true },
        { semester: 2, academicScore: 88, feedback: "excellent", passed: true },
      ],
      scholarships: [
        {
          id: "sch-2",
          academicYear: 2,
          level: "standard",
          amount: 2000,
          title: "普通奖学金",
          reason: "上一学年的整体表现比较稳。",
        },
      ],
      resume: [
        {
          id: "resume-comp-1",
          category: "competition",
          title: "省级项目赛三等奖",
          summary: "完成了本学期的重要项目展示。",
          month: 6,
          tags: ["competition", "provincial"],
        },
      ],
    };

    const explanation = buildScholarshipExplanation(run);

    expect(explanation).not.toBeNull();
    expect(explanation?.summary).toContain("奖学金");
    expect(explanation?.reasons.length).toBeGreaterThan(0);
  });

  it("turns public exam progress into an understandable growth line", () => {
    const baseRun = createBaseRun("direction-public-exam");
    const run: GameRun = {
      ...baseRun,
      currentYear: 4,
      progression: {
        ...baseRun.progression!,
        dominantDirection: "public_exam",
        publicExam: {
          progress: 42,
          aptitudePrep: 39,
          essayPrep: 33,
        },
        tendencies: {
          ...baseRun.progression!.tendencies,
          public_exam: 34,
          employment: 12,
          undecided: 4,
        },
      },
    };

    const explanation = buildPublicExamExplanation(run);

    expect(explanation.summary).toContain("公考");
    expect(explanation.signals.length).toBeGreaterThan(0);
    expect(explanation.progress).toBe(42);
  });

  it("keeps historical settlement explanations anchored to the monthly snapshot", () => {
    const snapshot: StructuredMonthlySummary = {
      month: 4,
      actions: ["study"],
      attendanceStrategy: "mixed",
      schedule: [],
      weeklyCalendar: [],
      statsBefore: {
        money: 520,
        mood: 55,
        stress: 40,
        fulfillment: 42,
        social: 38,
        semesterAcademics: 68,
      },
      statsAfter: {
        money: 410,
        mood: 56,
        stress: 43,
        fulfillment: 45,
        social: 38,
        semesterAcademics: 72,
      },
      statsDelta: {
        money: -110,
        mood: 1,
        stress: 3,
        fulfillment: 3,
        social: 0,
        semesterAcademics: 4,
      },
      moneyDelta: -110,
      academicFeedback: "stable",
      eventIds: [],
      resumeAdditions: [],
      notableFacts: [],
      resolvedActions: [],
      flags: [],
      cooldowns: { askFamilyMonths: 0 },
      course: {
        strategy: "mixed",
        attendanceCounted: true,
        directRollCallPenalty: 0,
        rollCallRiskDelta: 0,
        usualScoreRiskDelta: 0,
        proxyCost: 0,
        remedyPressure: 0,
        academicRiskDelta: 0,
        academicGain: 2,
        moodDelta: 0,
        stressDelta: 1,
      },
      turns: [],
      academicProfile: {
        gpa: 3.08,
        rank: 41,
        percentile: 59,
        recommendationScore: 52,
      },
      progression: {
        tendencies: {
          employment: 10,
          postgraduate: 16,
          public_exam: 6,
          recommendation: 8,
          undecided: 14,
        },
        dominantDirection: "undecided",
        publicExam: {
          progress: 0,
          aptitudePrep: 0,
          essayPrep: 0,
        },
        postgraduateProgress: 10,
        employmentReadiness: 8,
        recommendationReadiness: 7,
        recommendationQualification: "pending",
        latestHints: [],
      },
    };

    const recommendation = buildRecommendationExplanationFromSummary(snapshot);
    const scholarship = buildScholarshipExplanationFromSummary(snapshot);
    const publicExam = buildPublicExamExplanationFromSummary(snapshot);

    expect(recommendation.status).toBe("pending");
    expect(scholarship).toBeNull();
    expect(publicExam.progress).toBe(0);
    expect(publicExam.summary).not.toContain("后期路线");
  });
});

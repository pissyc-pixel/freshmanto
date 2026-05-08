import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import {
  buildDirectionPerception,
  buildPublicExamExplanation,
  buildRecommendationExplanation,
  buildScholarshipExplanation,
  ensureProgressionState,
} from "@/core/resolvers/progression";
import type { GameRun } from "@/types/game";

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
});

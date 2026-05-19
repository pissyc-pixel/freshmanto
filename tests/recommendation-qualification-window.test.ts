import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { settleLongTermProgression } from "@/core/resolvers/progression";
import { normalizeSaveState } from "@/lib/demo/save-state";
import type { GameRun } from "@/types/game";

function createJuniorBoundaryRun(id: string, input?: Partial<GameRun>): GameRun {
  return normalizeSaveState({
    ...createInitialGameRun({
      id,
      name: "推免时间窗测试档",
      discipline: "engineering",
      randomValues: [0.82, 0.74, 0.68, 0.91, 0.77, 0.63, 0.88, 0.59],
    }),
    currentYear: 3,
    currentMonth: 7,
    currentSemester: 5,
    semesterAverage: 86,
    semesters: [
      { semester: 1, academicScore: 84, feedback: "excellent", passed: true },
      { semester: 2, academicScore: 86, feedback: "excellent", passed: true },
      { semester: 3, academicScore: 87, feedback: "excellent", passed: true },
      { semester: 4, academicScore: 88, feedback: "excellent", passed: true },
    ],
    stats: {
      money: 1600,
      mood: 58,
      stress: 52,
      fulfillment: 64,
      social: 55,
      semesterAcademics: 82,
    },
    progression: {
      tendencies: {
        employment: 18,
        postgraduate: 58,
        public_exam: 0,
        recommendation: 92,
        undecided: 0,
      },
      dominantDirection: "recommendation",
      publicExam: { progress: 0, aptitudePrep: 0, essayPrep: 0 },
      postgraduateProgress: 58,
      employmentReadiness: 18,
      recommendationReadiness: 86,
      recommendationQualification: "pending",
      latestHints: [],
    },
    ...input,
  });
}

describe("recommendation qualification settlement window", () => {
  it("does not stamp junior-fall recommendation qualification onto the month-30 settlement", () => {
    const run = createJuniorBoundaryRun("recommendation-window-run");

    const settled = settleLongTermProgression(run, { playedYear: 3, playedMonth: 6 });

    expect(settled.run.progression?.recommendationQualification).toBe("pending");
    expect(settled.notableFacts.some((fact) => fact.startsWith("recommendation:"))).toBe(false);
  });
});

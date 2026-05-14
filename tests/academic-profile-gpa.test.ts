import { describe, expect, it } from "vitest";

import { createInitialGameRun, resolveMonthlyTurn, settleSemester } from "@/core/game-engine";
import { deriveAcademicProfile } from "@/core/resolvers/progression";
import type { MonthlyActionPlan } from "@/types/game";

function createIdleMonthPlan(): MonthlyActionPlan {
  return {
    attendanceStrategy: "mixed",
    actions: [],
  };
}

describe("academic profile GPA settlement", () => {
  it("keeps GPA, ranking, and percentile empty before the first semester settlement", () => {
    const run = createInitialGameRun({
      id: "gpa-not-yet-settled",
      randomValues: [0.22, 0.31, 0.48, 0.57, 0.61, 0.19, 0.26, 0.4],
    });

    expect(deriveAcademicProfile(run)).toMatchObject({
      gpa: null,
      rank: null,
      percentile: null,
    });
  });

  it("starts exposing GPA metrics only after a semester settlement has actually happened", () => {
    const run = createInitialGameRun({
      id: "gpa-after-settlement",
      randomValues: [0.16, 0.27, 0.35, 0.49, 0.58, 0.64, 0.21, 0.37],
    });
    const afterMonth = resolveMonthlyTurn(run, createIdleMonthPlan());
    const settled = settleSemester(afterMonth.run);
    const profile = deriveAcademicProfile(settled.run);

    expect(profile.gpa).not.toBeNull();
    expect(typeof profile.gpa).toBe("number");
    expect(profile.rank).not.toBeNull();
    expect(profile.percentile).not.toBeNull();
  });
});

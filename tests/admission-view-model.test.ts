import { describe, expect, it } from "vitest";

import { buildAdmissionViewModel } from "@/lib/admission-view-model";
import type { GameRun } from "@/types/game";

function createRun(overrides: Partial<GameRun> = {}): GameRun {
  return {
    id: "run-abc12345",
    status: "active",
    currentYear: 1,
    currentMonth: 1,
    currentSemester: 1,
    profile: {
      talents: ["self-disciplined"],
      familyBackground: "ordinary",
      monthlyAllowance: 1500,
      luck: 50,
      collegeTrack: "engineering",
      schoolTier: "985",
      cityTier: "tier_1",
    },
    stats: {
      money: 1500,
      mood: 60,
      stress: 35,
      fulfillment: 40,
      social: 30,
      semesterAcademics: 55,
    },
    semesterAverage: 55,
    resume: [],
    logLineIds: [],
    monthlySummaries: [],
    semesters: [],
    cooldowns: { askFamilyMonths: 0 },
    risk: { academicRisk: 0, burnout: 0 },
    riskFlags: [],
    progression: undefined,
    competitionProjects: [],
    scholarships: [],
    ...overrides,
  };
}

describe("buildAdmissionViewModel", () => {
  it("uses safe fallbacks for fields the real run does not have", () => {
    const viewModel = buildAdmissionViewModel(createRun());

    expect(viewModel.studentName).toBe("待生成");
    expect(viewModel.schoolName).toBe("暂未确认");
    expect(viewModel.departmentName).toBe("未记录");
    expect(viewModel.majorName).toBe("未记录");
    expect(viewModel.campusName).toBe("暂未确认");
  });

  it("preserves real profile-derived facts without pretending they are exact institutions", () => {
    const viewModel = buildAdmissionViewModel(createRun());

    expect(viewModel.schoolTierLabel).toContain("985");
    expect(viewModel.cityTierLabel).toBeTruthy();
    expect(viewModel.trackLabel).toBeTruthy();
    expect(viewModel.schoolName).not.toContain("大学");
    expect(viewModel.majorName).not.toContain("计算机");
  });
});

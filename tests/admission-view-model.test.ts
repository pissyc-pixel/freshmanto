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
  it("uses the stored player name when it exists", () => {
    const viewModel = buildAdmissionViewModel(
      createRun({
        profile: {
          ...createRun().profile,
          name: "林舒恒",
        },
      }),
    );

    expect(viewModel.studentName).toBe("林舒恒");
  });

  it("uses a player-facing fallback name for older saves", () => {
    const viewModel = buildAdmissionViewModel(createRun());

    expect(viewModel.studentName).toBe("新生");
  });

  it("preserves real profile-derived facts without pretending they are exact institutions", () => {
    const viewModel = buildAdmissionViewModel(createRun());

    expect(viewModel.schoolTierLabel).toContain("985");
    expect(viewModel.cityTierLabel).toBeTruthy();
    expect(viewModel.trackLabel).toBeTruthy();
  });

  it("does not leak internal stage copy into the player-facing statement", () => {
    const viewModel = buildAdmissionViewModel(createRun());

    expect(viewModel.statement).toContain("你的大学生活档案已建立");
    expect(viewModel.statement).not.toContain("规则层");
    expect(viewModel.statement).not.toContain("暂未记录");
    expect(viewModel.statement).not.toContain("暂未确认");
    expect(viewModel.statement).not.toContain("待生成");
  });
});

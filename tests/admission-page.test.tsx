import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameRun } from "@/types/game";

const mockedRunState = {
  run: null as GameRun | null,
};

vi.mock("@/lib/demo/server", () => ({
  getServerDemoRun: vi.fn(async () => mockedRunState.run),
}));

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => null),
}));

vi.mock("@/lib/demo/active-run", () => ({
  resolveActiveRunId: ({
    searchParamRunId,
    cookieRunId,
  }: {
    searchParamRunId?: string | null;
    cookieRunId?: string | null;
  }) => searchParamRunId ?? cookieRunId ?? null,
}));

function createRun(overrides: Partial<GameRun> = {}): GameRun {
  return {
    id: "run-admission-page",
    status: "active",
    currentYear: 1,
    currentMonth: 1,
    currentSemester: 1,
    profile: {
      name: "林舒恒",
      talents: ["self-disciplined", "quick-learner"],
      familyBackground: "affluent",
      monthlyAllowance: 2900,
      luck: 48,
      collegeTrack: "arts",
      schoolTier: "qingbei",
      cityTier: "tier_1",
    },
    stats: {
      money: 2900,
      mood: 65,
      stress: 28,
      fulfillment: 40,
      social: 35,
      semesterAcademics: 0,
    },
    semesterAverage: 0,
    resume: [],
    logLineIds: [],
    monthlySummaries: [],
    semesters: [],
    cooldowns: { askFamilyMonths: 0 },
    risk: { academicRisk: 0, burnout: 0 },
    riskFlags: [],
    competitionProjects: [],
    scholarships: [],
    ...overrides,
  };
}

describe("admission page", () => {
  beforeEach(() => {
    mockedRunState.run = createRun();
  });

  it("shows the player name and a clickable share button without internal placeholders", async () => {
    const pageModule = await import("@/app/admission/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "run-admission-page" }),
      }),
    );

    expect(markup).toContain("林舒恒");
    expect(markup).toContain("分享");
    expect(markup).not.toContain("disabled");
    expect(markup).not.toContain("待生成");
    expect(markup).not.toContain("阶段接入");
    expect(markup).not.toContain("规则层");
    expect(markup).not.toContain("暂未记录");
    expect(markup).not.toContain("暂未确认");
    expect(markup).not.toContain("UI 需要");
    expect(markup).not.toContain("PRD");
    expect(markup).not.toContain("mock");
  });
});

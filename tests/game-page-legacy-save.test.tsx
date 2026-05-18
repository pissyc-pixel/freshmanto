import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type { GameRun } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerGameBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "legacy-month-two-run"),
}));

vi.mock("@/lib/demo/active-run", () => ({
  buildRunHref: (path: string, runId?: string | null) => (runId ? `${path}?runId=${runId}` : path),
  resolveActiveRunId: ({
    searchParamRunId,
    cookieRunId,
  }: {
    searchParamRunId?: string | null;
    cookieRunId?: string | null;
  }) => searchParamRunId ?? cookieRunId ?? null,
}));

vi.mock("@/lib/demo/server", () => ({
  getServerGameBundle: vi.fn(async () => mockedBundleState.bundle),
}));

function createLegacyMonthTwoRun(): GameRun {
  const baseRun = createInitialGameRun({
    id: "legacy-month-two-run",
    name: "林舒恒",
    discipline: "engineering",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  return {
    ...baseRun,
    currentMonth: 2,
    activeMonth: {
      year: 1,
      month: 2,
      currentWeek: 1,
      totalWeeks: 4,
      allowanceApplied: true,
      cooldownsAtStart: { askFamilyMonths: 0 },
      weeklyCalendar: [],
      currentWeekState: undefined as unknown as NonNullable<GameRun["activeMonth"]>["currentWeekState"],
      completedWeeks: [],
      statsAtStart: { ...baseRun.stats },
      turns: [],
    },
  };
}

describe("game page legacy month-2 saves", () => {
  beforeEach(() => {
    const run = createLegacyMonthTwoRun();
    mockedBundleState.bundle = {
      run,
      runRecord: {
        id: run.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: run.status,
        current_year: run.currentYear,
        current_month: run.currentMonth,
        profile_json: run.profile,
        current_state_json: run,
      },
      monthlyStates: [],
      logs: [],
    };
  });

  it("renders safely when a legacy month-2 save has a broken activeMonth snapshot", async () => {
    const pageModule = await import("@/app/game/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "legacy-month-two-run" }),
      }),
    );

    expect(markup).toContain("本周周历");
    expect(markup).toContain("第 1 周");
    expect(markup).toContain("安排这一周");
  });
});

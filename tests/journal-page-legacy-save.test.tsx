import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type { GameRun } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerJournalBundle"]>> | null,
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
  getServerJournalBundle: vi.fn(async () => mockedBundleState.bundle),
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

describe("journal page legacy month-2 saves", () => {
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
      aiReports: [],
    };
  });

  it("renders safely for a legacy month-2 save with no monthly archives yet", async () => {
    const pageModule = await import("@/app/journal/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "legacy-month-two-run" }),
      }),
    );

    expect(markup).toContain("成长日志");
    expect(markup).toContain("还没有第一篇月记");
    expect(markup).toContain("还没有足够的成长证据");
  });
  it("renders persisted monthly letters and timeline nodes from the run state", async () => {
    const run = {
      ...createLegacyMonthTwoRun(),
      monthlyLetters: [
        {
          id: "letter-state-only",
          monthIndex: 13,
          title: "State Letter Title",
          body: "State letter body from saved run facts.",
          facts: ["scholarship:city:1"],
          fallback: true,
        },
      ],
      timelineNodes: [
        {
          id: "timeline-state-only",
          monthIndex: 13,
          kind: "scholarship" as const,
          title: "State Timeline Title",
          body: "State timeline body from saved run facts.",
          facts: ["scholarship:city:1"],
        },
      ],
    };

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
      aiReports: [],
    };

    const pageModule = await import("@/app/journal/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: "legacy-month-two-run" }),
      }),
    );

    expect(markup).toContain("State Letter Title");
    expect(markup).toContain("State letter body from saved run facts.");
    expect(markup).toContain("State Timeline Title");
    expect(markup).toContain("State timeline body from saved run facts.");
  });
});

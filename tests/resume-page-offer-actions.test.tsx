import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { normalizeSaveState } from "@/lib/demo/save-state";
import type { ResumeItemRecord } from "@/types/db";
import type { GameRun } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerResumeBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "offer-action-run"),
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
  getServerResumeBundle: vi.fn(async () => mockedBundleState.bundle),
}));

function createOfferRun(): GameRun {
  const base = createInitialGameRun({
    id: "offer-action-run",
    name: "Offer 测试档",
    discipline: "business",
    randomValues: [0.2, 0.4, 0.6, 0.8],
  });

  return normalizeSaveState({
    ...base,
    currentYear: 4,
    currentMonth: 1,
    futureOffers: [
      {
        id: "offer-action-run-offer-employment-37-growth",
        type: "employment",
        title: "一线城市商业分析 / 产品运营岗 Offer",
        tier: "nankai_tianda",
        quality: "excellent",
        salaryLevel: "high",
        reasons: ["前期项目、实习和求职准备让这份就业结果有了落点。"],
        tradeoffs: ["成长快、压力也高。"],
        accepted: false,
        rejected: false,
        monthIndex: 37,
      },
    ],
  });
}

describe("resume page future offer decisions", () => {
  it("renders formal offer actions for pending future offers", async () => {
    const run = createOfferRun();
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
      resumeItems: [] as ResumeItemRecord[],
    };

    const pageModule = await import("@/app/resume/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: run.id }),
      }),
    );

    expect(markup).toContain("Offer Letter");
    expect(markup).toContain("选择这个 offer");
    expect(markup).toContain("继续看看别的选择");
    expect(markup).toContain("offer-action-run-offer-employment-37-growth");
  });
});

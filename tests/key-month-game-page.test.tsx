import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { createDefaultCareerRouteState } from "@/core/resolvers/progression";
import type { GameRun, ResumeItem, ScholarshipRecord } from "@/types/game";

const mockedBundleState = {
  bundle: null as Awaited<ReturnType<typeof import("@/lib/demo/server")["getServerGameBundle"]>> | null,
};

vi.mock("@/lib/demo/server-run-context", () => ({
  readActiveRunIdFromCookies: vi.fn(async () => "key-month-run"),
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

function createResumeItem(input: {
  id: string;
  month: number;
  category: ResumeItem["category"];
  title: string;
  summary: string;
  tags: string[];
}): ResumeItem {
  return {
    id: input.id,
    month: input.month,
    category: input.category,
    title: input.title,
    summary: input.summary,
    tags: input.tags,
  };
}

function createRunForMonth(input: {
  id: string;
  year: number;
  month: number;
  scholarships?: ScholarshipRecord[];
  resume?: ResumeItem[];
  progression?: Partial<NonNullable<GameRun["progression"]>>;
  legacyBrokenMonthTwo?: boolean;
}) {
  const baseRun = createInitialGameRun({
    id: input.id,
    name: "关键月份玩家",
    discipline: "engineering",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  const progression = {
    ...createDefaultCareerRouteState(),
    ...(input.progression ?? {}),
    tendencies: {
      ...createDefaultCareerRouteState().tendencies,
      ...(input.progression?.tendencies ?? {}),
    },
    publicExam: {
      ...createDefaultCareerRouteState().publicExam,
      ...(input.progression?.publicExam ?? {}),
    },
  };

  const run: GameRun = {
    ...baseRun,
    currentYear: input.year,
    currentMonth: input.month,
    currentSemester: (input.year - 1) * 2 + (input.month <= 6 ? 1 : 2),
    resume: input.resume ?? [],
    scholarships: input.scholarships ?? [],
    progression,
  };

  if (!input.legacyBrokenMonthTwo) {
    return run;
  }

  return {
    ...run,
    activeMonth: {
      year: input.year,
      month: input.month,
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

const scholarship: ScholarshipRecord = {
  id: "sch-13",
  academicYear: 1,
  level: "standard",
  amount: 2000,
  title: "奖学金",
  reason: "上学年成绩稳定，按规则获得奖学金。",
};

describe("key month game page rendering", () => {
  it.each([
    {
      label: "month 1",
      run: createRunForMonth({ id: "game-month-1", year: 1, month: 1 }),
      expected: "本周周历",
    },
    {
      label: "month 2",
      run: createRunForMonth({ id: "game-month-2", year: 1, month: 2, legacyBrokenMonthTwo: true }),
      expected: "本周周历",
    },
    {
      label: "month 25",
      run: createRunForMonth({
        id: "game-month-25",
        year: 3,
        month: 1,
        scholarships: [scholarship],
        resume: [
          createResumeItem({
            id: "game-month-25-2-1-scholarship",
            month: 1,
            category: "scholarship",
            title: "奖学金到账",
            summary: "上一学年按规则获得奖学金。",
            tags: ["scholarship"],
          }),
        ],
      }),
      expected: "阶段成果聚光灯",
    },
    {
      label: "month 36",
      run: createRunForMonth({
        id: "game-month-36",
        year: 3,
        month: 12,
        scholarships: [scholarship],
        resume: [
          createResumeItem({
            id: "game-month-36-3-10-competition",
            month: 10,
            category: "competition",
            title: "工程竞赛省级二等奖",
            summary: "项目结算后获得省级二等奖。",
            tags: ["provincial", "second"],
          }),
        ],
        progression: {
          dominantDirection: "recommendation",
          recommendationQualification: "eligible",
          recommendationReadiness: 84,
          postgraduateProgress: 50,
          tendencies: {
            employment: 20,
            postgraduate: 60,
            public_exam: 4,
            recommendation: 88,
            undecided: 0,
          },
        },
      }),
      expected: "阶段成果聚光灯",
    },
    {
      label: "month 37",
      run: createRunForMonth({
        id: "game-month-37",
        year: 4,
        month: 1,
        resume: [
          createResumeItem({
            id: "game-month-37-3-10-internship",
            month: 10,
            category: "internship",
            title: "市场运营实习机会",
            summary: "已有一段被履历系统收录的实习经历。",
            tags: ["internship", "marketing"],
          }),
        ],
        progression: {
          dominantDirection: "employment",
          employmentReadiness: 48,
          tendencies: {
            employment: 72,
            postgraduate: 22,
            public_exam: 6,
            recommendation: 18,
            undecided: 0,
          },
        },
      }),
      expected: "阶段成果聚光灯",
    },
    {
      label: "month 46",
      run: createRunForMonth({
        id: "game-month-46",
        year: 4,
        month: 10,
        scholarships: [scholarship],
        resume: [
          createResumeItem({
            id: "game-month-46-4-10-internship",
            month: 10,
            category: "internship",
            title: "秋招前置实习经历",
            summary: "最终就业线前，履历里已有实习结果。",
            tags: ["internship", "offer-ready"],
          }),
        ],
        progression: {
          dominantDirection: "employment",
          employmentReadiness: 64,
          tendencies: {
            employment: 86,
            postgraduate: 12,
            public_exam: 4,
            recommendation: 10,
            undecided: 0,
          },
        },
      }),
      expected: "阶段成果聚光灯",
    },
  ])("renders $label safely", async ({ run, expected }) => {
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

    const pageModule = await import("@/app/game/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: run.id }),
      }),
    );

    expect(markup).toContain(expected);
  });
  it.each([
    { label: "M13", run: createRunForMonth({ id: "game-node-13", year: 2, month: 1 }) },
    { label: "M28", run: createRunForMonth({ id: "game-node-28", year: 3, month: 4 }) },
    { label: "M34", run: createRunForMonth({ id: "game-node-34", year: 3, month: 10 }) },
    { label: "M48", run: createRunForMonth({ id: "game-node-48", year: 4, month: 12 }) },
  ])("shows documented final-demo milestone prompt $label", async ({ label, run }) => {
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

    const pageModule = await import("@/app/game/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ runId: run.id }),
      }),
    );

    expect(markup).toContain(label);
    expect(markup).toContain("Final Demo Milestone");
  });
});

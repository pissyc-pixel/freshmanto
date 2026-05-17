import { describe, expect, it } from "vitest";

import { createInitialGameRun, createWeeklyCalendar, resolveActionTurn, resolveWeekEnd } from "@/core/game-engine";
import type {
  AIReportRecord,
  GameEventLogRecord,
  Json,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord
} from "@/types/db";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type {
  ActionTurnPlan,
  GameRun,
  MonthlyActionPlan,
  StructuredEndingSummary,
  StructuredMonthlySummary,
} from "@/types/game";
import {
  advanceDemoMonth,
  advanceDemoTurn,
  confirmDemoWeek,
  createDemoRun,
  endDemoWeek,
  planDemoWeekday,
  setDemoWeekAttendance,
} from "@/lib/demo/run-service";

type InMemoryStore = {
  run: RunRecord | null;
  monthlyStates: MonthlyStateRecord[];
  logs: GameEventLogRecord[];
  aiReports: AIReportRecord[];
  resumeItems: ResumeItemRecord[];
};

function readCurrentWeekState(run: GameRun) {
  const activeMonth = run.activeMonth as (GameRun["activeMonth"] & {
    currentWeekState?: {
      totalTimeUnits: number;
      remainingTimeUnits: number;
      releasedClassDays: string[];
    };
  }) | undefined;

  return activeMonth?.currentWeekState;
}

function createStore(): InMemoryStore {
  return {
    run: null,
    monthlyStates: [],
    logs: [],
    aiReports: [],
    resumeItems: []
  };
}

function createRepository(store: InMemoryStore) {
  return {
    async createRun(input: {
      currentYear: number;
      currentMonth: number;
      profile: GameRun["profile"];
      currentState: GameRun;
      status?: "active" | "completed";
      id?: string;
    }) {
      const record: RunRecord = {
        id: input.id ?? input.currentState.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: input.status ?? "active",
        current_year: input.currentYear,
        current_month: input.currentMonth,
        profile_json: input.profile,
        current_state_json: input.currentState
      };
      store.run = record;
      return record;
    },
    async getRun(runId: string) {
      if (store.run?.id !== runId) {
        return null;
      }

      return store.run;
    },
    async updateRun(runId: string, input: {
      status?: "active" | "completed";
      currentYear?: number;
      currentMonth?: number;
      profile?: GameRun["profile"];
      currentState?: GameRun;
    }) {
      if (!store.run || store.run.id !== runId) {
        throw new Error("run not found");
      }

      store.run = {
        ...store.run,
        updated_at: new Date().toISOString(),
        status: input.status ?? store.run.status,
        current_year: input.currentYear ?? store.run.current_year,
        current_month: input.currentMonth ?? store.run.current_month,
        profile_json: input.profile ?? store.run.profile_json,
        current_state_json: input.currentState ?? store.run.current_state_json
      };

      return store.run;
    },
    async saveMonthlyState(input: {
      runId: string;
      year: number;
      month: number;
      snapshot: StructuredMonthlySummary;
    }) {
      const record: MonthlyStateRecord = {
        id: `${input.runId}-${input.year}-${input.month}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        snapshot_json: input.snapshot,
        created_at: new Date().toISOString()
      };
      store.monthlyStates.push(record);
      return record;
    },
    async writeEventLogs(inputs: Array<{
      runId: string;
      year: number;
      month: number;
      logType: "action" | "event" | "settlement";
      message: string;
      metadata?: Record<string, Json>;
    }>) {
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-${input.month}-${index}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        log_type: input.logType,
        message: input.message,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString()
      })) satisfies GameEventLogRecord[];
      store.logs.push(...records);
      return records;
    },
    async saveAiReport(input: {
      runId: string;
      year: number;
      month?: number | null;
      reportType: "monthly_journal" | "ending_report";
      inputSummary: StructuredMonthlySummary | StructuredEndingSummary;
      outputMarkdown: string;
      model?: string | null;
    }) {
      const record: AIReportRecord = {
        id: `${input.runId}-${input.reportType}-${store.aiReports.length + 1}`,
        run_id: input.runId,
        year: input.year,
        month: input.month ?? null,
        report_type: input.reportType,
        input_summary_json: input.inputSummary,
        output_markdown: input.outputMarkdown,
        model: input.model ?? null,
        created_at: new Date().toISOString()
      };
      store.aiReports.push(record);
      return record;
    },
    async saveResumeItems(inputs: Array<{
      runId: string;
      year: number;
      month: number;
      category: ResumeItemRecord["category"];
      title: string;
      summary: string;
      sourceItemId?: string | null;
      metadata?: Record<string, Json>;
    }>) {
      const records = inputs.map((input) => ({
        id: `${input.runId}-${input.month}-${input.title}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        category: input.category,
        title: input.title,
        summary: input.summary,
        source_item_id: input.sourceItemId ?? null,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString()
      })) satisfies ResumeItemRecord[];
      store.resumeItems.push(...records);
      return records;
    }
  };
}

async function fakeAiReport(input: AiReportRequest): Promise<AiReportResult> {
  return {
    kind: input.kind,
    markdown: `Report for ${input.kind}`,
    model: "fake-model",
    usedFallback: false
  };
}

describe("demo run service", () => {
  it("builds a 4-week calendar where weekdays stay busy, Tuesday/Thursday are half-free, and weekends are free", () => {
    const calendar = createWeeklyCalendar(1);

    expect(calendar).toHaveLength(4);
    expect(calendar[0]?.label).toBe("第 1 周");
    expect(calendar.every((week) => week.days.length === 7)).toBe(true);
    expect(calendar[0]?.days.map((day) => day.label)).toEqual([
      "周一",
      "周二",
      "周三",
      "周四",
      "周五",
      "周六",
      "周日",
    ]);
    expect(
      calendar.every((week) =>
        week.days.map((day) => day.weekday).join(",") === "mon,tue,wed,thu,fri,sat,sun",
      ),
    ).toBe(true);
    expect(
      calendar.every(
        (week) =>
          week.days.find((day) => day.weekday === "tue")?.dayType === "half_free" &&
          week.days.find((day) => day.weekday === "thu")?.dayType === "half_free",
      ),
    ).toBe(true);
    expect(
      calendar.every(
        (week) =>
          week.days.find((day) => day.weekday === "sat")?.dayType === "free" &&
          week.days.find((day) => day.weekday === "sun")?.dayType === "free",
      ),
    ).toBe(true);
    expect(
      calendar.every(
        (week) =>
          week.days.find((day) => day.weekday === "mon")?.dayType === "busy_day" &&
          week.days.find((day) => day.weekday === "wed")?.dayType === "busy_day" &&
          week.days.find((day) => day.weekday === "fri")?.dayType === "busy_day",
      ),
    ).toBe(true);
  });

  it("creates a new run and persists the initial state", async () => {
    const store = createStore();

    const result = await createDemoRun({
      repository: createRepository(store),
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });

    expect(result.run.id).toBeTruthy();
    expect(store.run?.current_state_json.id).toBe(result.run.id);
    expect(store.logs[0]?.message).toContain("已创建新档");
  });

  it("consumes time from the current week pool without immediately ending the week", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-turn",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const plan: ActionTurnPlan = {
      attendanceStrategy: "mixed",
      action: { action: "study", time: "night" }
    };

    const result = await advanceDemoTurn({
      repository: createRepository(store),
      runId: run.id,
      plan,
      generateReport: fakeAiReport
    });

    expect(result.monthCompleted).toBe(false);
    expect(result.turnSummary.week).toBe(1);
    expect(result.turnSummary.slotLabel).toBe("第 1 周");
    expect(result.run.currentMonth).toBe(1);
    expect(result.run.activeMonth?.currentWeek).toBe(1);
    expect(result.run.activeMonth?.turns).toHaveLength(1);
    expect(readCurrentWeekState(result.run)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 10,
      releasedClassDays: [],
    });
    expect(store.monthlyStates).toHaveLength(0);
    expect(store.aiReports).toHaveLength(0);
    expect(store.logs.some((log) => log.message === "单次行动已结算")).toBe(true);
  });

  it("keeps zero-cost actions in the same week without spending time", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-big-meal",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const result = await advanceDemoTurn({
      repository: createRepository(store),
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: { action: "big_meal", time: "night" }
      },
      generateReport: fakeAiReport
    });

    expect(result.monthCompleted).toBe(false);
    expect(result.turnSummary.advancesCalendar).toBe(false);
    expect(result.turnSummary.week).toBe(1);
    expect(result.run.activeMonth?.currentWeek).toBe(1);
    expect(readCurrentWeekState(result.run)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 11,
      releasedClassDays: [],
    });
    expect(result.run.stats.money).toBeLessThan(run.stats.money + run.profile.monthlyAllowance);
    expect(result.run.stats.mood).toBeGreaterThanOrEqual(run.stats.mood);
    expect(store.monthlyStates).toHaveLength(0);
  });

  it("allows multiple time-cost actions in the same week until the pool is exhausted, then auto-settles into the next week", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-week-chain",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const repository = createRepository(store);
    const weeklyPlans: ActionTurnPlan[] = [
      { attendanceStrategy: "mixed", action: { action: "job_prep", time: "day" } },
      { attendanceStrategy: "mixed", action: { action: "job_prep", time: "day" } },
      { attendanceStrategy: "mixed", action: { action: "job_prep", time: "day" } },
      { attendanceStrategy: "mixed", action: { action: "job_prep", time: "day" } },
      { attendanceStrategy: "mixed", action: { action: "job_prep", time: "day" } },
      { attendanceStrategy: "mixed", action: { action: "study", time: "night" } }
    ];
    let latestResult:
      | Awaited<ReturnType<typeof advanceDemoTurn>>
      | undefined;

    for (const [index, plan] of weeklyPlans.entries()) {
      latestResult = await advanceDemoTurn({
        repository,
        runId: run.id,
        plan,
        generateReport: fakeAiReport
      });

      if (index < weeklyPlans.length - 1) {
        expect(latestResult.monthCompleted).toBe(false);
        expect(latestResult.playedWeek).toBe(1);
        expect(latestResult.run.activeMonth?.currentWeek).toBe(1);
      }
    }

    expect(latestResult?.monthCompleted).toBe(false);
    expect(latestResult?.turnSummary.week).toBe(1);
    expect(latestResult?.turnSummary.weekCompleted).toBe(true);
    expect(latestResult?.run.activeMonth?.currentWeek).toBe(2);
    expect(latestResult?.run.activeMonth?.completedWeeks[0]).toMatchObject({
      week: 1,
      attendanceStrategy: "mixed",
      endedEarly: false,
    });
    expect(readCurrentWeekState(latestResult?.run as GameRun)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 11,
      releasedClassDays: [],
    });
    expect(store.monthlyStates).toHaveLength(0);
    expect(store.aiReports).toHaveLength(0);
  });

  it("keeps the run in the same week after multiple actions until the player manually ends that week", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-manual-week-end",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const repository = createRepository(store);

    const firstAction = await advanceDemoTurn({
      repository,
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: { action: "study", time: "night" }
      },
      generateReport: fakeAiReport
    });
    const secondAction = await advanceDemoTurn({
      repository,
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: { action: "social", time: "night" }
      },
      generateReport: fakeAiReport
    });

    expect(firstAction.run.activeMonth?.currentWeek).toBe(1);
    expect(secondAction.run.activeMonth?.currentWeek).toBe(1);
    expect(secondAction.run.activeMonth?.turns).toHaveLength(2);
    expect(readCurrentWeekState(secondAction.run)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 9,
      releasedClassDays: [],
    });

    const weekEndResult = await endDemoWeek({
      repository,
      runId: run.id,
      attendanceStrategy: "mixed",
      generateReport: fakeAiReport,
    });

    expect(weekEndResult.monthCompleted).toBe(false);
    expect(weekEndResult.playedWeek).toBe(1);
    expect(weekEndResult.run.activeMonth?.currentWeek).toBe(2);
    expect(weekEndResult.run.activeMonth?.completedWeeks[0]).toMatchObject({
      week: 1,
      attendanceStrategy: "mixed",
      endedEarly: true,
    });
    expect(readCurrentWeekState(weekEndResult.run)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 11,
      releasedClassDays: [],
    });
    expect(store.monthlyStates).toHaveLength(0);
    expect(store.aiReports).toHaveLength(0);
  });

  it("lets skip_class release locked class time without directly changing academics on the action step", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-skip-class",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const result = await advanceDemoTurn({
      repository: createRepository(store),
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: {
          action: "skip_class" as ActionTurnPlan["action"]["action"],
          time: "day",
          skipClassDays: ["mon", "wed"],
        } as ActionTurnPlan["action"],
      },
      generateReport: fakeAiReport
    });

    expect(result.monthCompleted).toBe(false);
    expect(result.run.activeMonth?.currentWeek).toBe(1);
    expect(result.turnSummary.statsDelta.semesterAcademics).toBe(0);
    expect(result.run.stats.semesterAcademics).toBe(run.stats.semesterAcademics);
    expect(readCurrentWeekState(result.run)).toMatchObject({
      totalTimeUnits: 13,
      remainingTimeUnits: 13,
      releasedClassDays: ["mon", "wed"],
    });
  });

  it("treats skip_class days as optional and lets released daytime blocks be used by later actions in the same week", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-optional-skip-days",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const repository = createRepository(store);
    const skipNothing = await advanceDemoTurn({
      repository,
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: {
          action: "skip_class",
          time: "day",
          skipClassDays: [],
        },
      },
      generateReport: fakeAiReport
    });

    expect(skipNothing.monthCompleted).toBe(false);
    expect(skipNothing.turnSummary.statsDelta.semesterAcademics).toBe(0);
    expect(readCurrentWeekState(skipNothing.run)).toMatchObject({
      totalTimeUnits: 11,
      remainingTimeUnits: 11,
      releasedClassDays: [],
    });

    const skipLockedDays = await advanceDemoTurn({
      repository,
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: {
          action: "skip_class",
          time: "day",
          skipClassDays: ["mon", "wed"],
        },
      },
      generateReport: fakeAiReport
    });

    expect(skipLockedDays.monthCompleted).toBe(false);
    expect(skipLockedDays.turnSummary.statsDelta.semesterAcademics).toBe(0);
    expect(readCurrentWeekState(skipLockedDays.run)).toMatchObject({
      totalTimeUnits: 13,
      remainingTimeUnits: 13,
      releasedClassDays: ["mon", "wed"],
    });

    const followUpAction = await advanceDemoTurn({
      repository,
      runId: run.id,
      plan: {
        attendanceStrategy: "mixed",
        action: { action: "job_prep", time: "day" }
      },
      generateReport: fakeAiReport
    });

    expect(followUpAction.monthCompleted).toBe(false);
    expect(followUpAction.playedWeek).toBe(1);
    expect(followUpAction.run.activeMonth?.currentWeek).toBe(1);
    expect(readCurrentWeekState(followUpAction.run)).toMatchObject({
      totalTimeUnits: 13,
      remainingTimeUnits: 11,
      releasedClassDays: ["mon", "wed"],
    });
    expect(followUpAction.run.stats.semesterAcademics).toBe(run.stats.semesterAcademics);
  });

  it("tracks independent class skipping through risk and proxy cost at week settlement instead of direct academic penalties", () => {
    const run = createInitialGameRun({
      id: "attendance-chain",
      randomValues: [0.42, 0.33, 0.51, 0.64, 0.58, 0.45, 0.7, 0.2]
    });

    const actionResult = resolveActionTurn(run, {
      attendanceStrategy: "mixed",
      action: { action: "skip_class", time: "day", skipClassDays: ["mon"] }
    });
    const result = resolveWeekEnd(actionResult.run, "mixed");

    expect(actionResult.turnSummary.course.directRollCallPenalty).toBe(0);
    expect(actionResult.turnSummary.statsDelta.semesterAcademics).toBe(0);
    expect(actionResult.turnSummary.statsDelta.money).toBe(0);
    expect(actionResult.turnSummary.releasedClassDays).toEqual(["mon"]);
    expect(result.run.activeMonth?.currentWeek).toBe(2);
    expect(result.run.stats.money).toBeLessThan(run.stats.money + run.profile.monthlyAllowance);
    expect(result.run.risk.academicRisk).toBeGreaterThan(run.risk.academicRisk);
  });

  it("advances one month, stores the summary, logs, report, and updated run state", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-month",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const plan: MonthlyActionPlan = {
      attendanceStrategy: "mixed",
      actions: [
        { action: "study", time: "day" },
        { action: "student_activity", time: "night" },
        { action: "social", time: "night" }
      ]
    };

    const result = await advanceDemoMonth({
      repository: createRepository(store),
      runId: run.id,
      plan,
      generateReport: fakeAiReport
    });

    expect(result.run.currentMonth).toBe(2);
    expect(store.monthlyStates).toHaveLength(1);
    expect(store.aiReports[0]?.report_type).toBe("monthly_journal");
    expect(store.logs.length).toBeGreaterThanOrEqual(2);
    expect(store.run?.current_state_json.currentMonth).toBe(2);
  });

  it("persists planned weekday actions through the service layer and settles only missing days as idle", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-weekly-plan-service-chain",
      randomValues: [0.29, 0.41, 0.52, 0.63, 0.17, 0.38, 0.49, 0.58],
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run,
    };

    const repository = createRepository(store);

    await setDemoWeekAttendance({
      repository,
      runId: run.id,
      attendanceStrategy: "mixed",
    });

    await planDemoWeekday({
      repository,
      runId: run.id,
      weekday: "mon",
      optionId: "study",
    });
    await planDemoWeekday({
      repository,
      runId: run.id,
      weekday: "tue",
      optionId: "social",
    });
    await planDemoWeekday({
      repository,
      runId: run.id,
      weekday: "wed",
      optionId: "relax",
    });

    const persistedWeekState = store.run?.current_state_json.activeMonth?.currentWeekState;

    expect(
      persistedWeekState?.days?.find((day) => day.weekday === "mon")?.plannedAction?.action,
    ).toBe("study");
    expect(
      persistedWeekState?.days?.find((day) => day.weekday === "tue")?.plannedAction?.action,
    ).toBe("social");
    expect(
      persistedWeekState?.days?.find((day) => day.weekday === "wed")?.plannedAction?.action,
    ).toBe("relax");

    const result = await confirmDemoWeek({
      repository,
      runId: run.id,
      generateReport: fakeAiReport,
    });
    const settlement = result.run.activeMonth?.latestWeekSettlement;

    expect(settlement?.dailyResults.find((day) => day.weekday === "mon")?.resolvedAction.action).toBe("study");
    expect(settlement?.dailyResults.find((day) => day.weekday === "tue")?.resolvedAction.action).toBe("social");
    expect(settlement?.dailyResults.find((day) => day.weekday === "wed")?.resolvedAction.action).toBe("relax");
    expect(settlement?.dailyResults.filter((day) => day.resolvedAction.action === "idle")).toHaveLength(4);
  });

  it("confirms four completely empty planned weeks without crashing and writes monthly artifacts", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-four-empty-weeks",
      randomValues: [0.29, 0.41, 0.52, 0.63, 0.17, 0.38, 0.49, 0.58],
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run,
    };
    const repository = createRepository(store);
    let latestRun = run;
    let finalResult: Awaited<ReturnType<typeof confirmDemoWeek>> | undefined;

    for (let week = 0; week < 4; week += 1) {
      await setDemoWeekAttendance({
        repository,
        runId: latestRun.id,
        attendanceStrategy: "mixed",
      });
      finalResult = await confirmDemoWeek({
        repository,
        runId: latestRun.id,
        generateReport: fakeAiReport,
      });
      latestRun = finalResult.run;
    }

    expect(finalResult?.monthCompleted).toBe(true);
    expect(finalResult?.monthlySummary?.weeklySettlements).toHaveLength(4);
    expect(finalResult?.monthlySummary?.weeklySettlements?.[0]?.dailyResults).toHaveLength(7);
    expect(
      finalResult?.monthlySummary?.weeklySettlements?.every((settlement) =>
        settlement.dailyResults.every((day) => day.resolvedAction.action === "idle" && day.resolvedAction.autoFilled),
      ),
    ).toBe(true);
    expect(store.monthlyStates).toHaveLength(1);
    expect(store.aiReports[0]?.report_type).toBe("monthly_journal");
  });

  it("finalizes the month after the fourth week is actually completed and then writes the monthly artifacts", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-four-weeks",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    store.run = {
      id: run.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: run.currentYear,
      current_month: run.currentMonth,
      profile_json: run.profile,
      current_state_json: run
    };

    const repository = createRepository(store);
    let latestRun = run;
    let finalResult:
      | Awaited<ReturnType<typeof endDemoWeek>>
      | undefined;

    for (let week = 1; week <= 4; week += 1) {
      const actionResult = await advanceDemoTurn({
        repository,
        runId: latestRun.id,
        plan: {
          attendanceStrategy: week < 4 ? "mixed" : "serious",
          action: { action: week % 2 === 0 ? "study" : "social", time: "night" }
        },
        generateReport: fakeAiReport
      });
      latestRun = actionResult.run;

      finalResult = await endDemoWeek({
        repository,
        runId: latestRun.id,
        attendanceStrategy: week < 4 ? "mixed" : "serious",
        generateReport: fakeAiReport,
      });
      latestRun = finalResult.run;
    }

    expect(finalResult?.monthCompleted).toBe(true);
    expect(finalResult?.monthlySummary?.turns).toHaveLength(4);
    expect(finalResult?.run.currentMonth).toBe(2);
    expect(finalResult?.run.activeMonth).toBeUndefined();
    expect(store.monthlyStates).toHaveLength(1);
    expect(store.aiReports[0]?.report_type).toBe("monthly_journal");
  });

  it("marks the run completed and saves an ending report after year 4 month 12", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-ending",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2]
    });
    const finalRun: GameRun = {
      ...run,
      currentYear: 4,
      currentMonth: 12,
      currentSemester: 8,
      semesters: [
        { semester: 1, academicScore: 75, feedback: "stable", passed: true },
        { semester: 2, academicScore: 79, feedback: "stable", passed: true },
        { semester: 3, academicScore: 82, feedback: "stable", passed: true },
        { semester: 4, academicScore: 84, feedback: "stable", passed: true },
        { semester: 5, academicScore: 80, feedback: "stable", passed: true },
        { semester: 6, academicScore: 77, feedback: "stable", passed: true },
        { semester: 7, academicScore: 81, feedback: "stable", passed: true }
      ]
    };

    store.run = {
      id: finalRun.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "active",
      current_year: finalRun.currentYear,
      current_month: finalRun.currentMonth,
      profile_json: finalRun.profile,
      current_state_json: finalRun
    };

    const result = await advanceDemoMonth({
      repository: createRepository(store),
      runId: finalRun.id,
      plan: {
        attendanceStrategy: "serious",
        actions: [{ action: "study", time: "night" }]
      },
      generateReport: fakeAiReport
    });

    expect(result.run.status).toBe("completed");
    expect(result.endingReport?.kind).toBe("ending_report");
    expect(store.aiReports.some((record) => record.report_type === "ending_report")).toBe(true);
  });
});

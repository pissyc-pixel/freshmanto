import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import type {
  AIReportRecord,
  GameEventLogRecord,
  Json,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord,
} from "@/types/db";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type {
  GameRun,
  StructuredEndingSummary,
  StructuredMonthlySummary,
} from "@/types/game";
import { advanceDemoMonth } from "@/lib/demo/run-service";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest, normalizeMonthlySummary } from "@/lib/demo/monthly-digest";
import { renderMonthlyJournalFallback } from "@/lib/ai/reports";

type InMemoryStore = {
  run: RunRecord | null;
  monthlyStates: MonthlyStateRecord[];
  logs: GameEventLogRecord[];
  aiReports: AIReportRecord[];
  resumeItems: ResumeItemRecord[];
};

function createStore(): InMemoryStore {
  return {
    run: null,
    monthlyStates: [],
    logs: [],
    aiReports: [],
    resumeItems: [],
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
        current_state_json: input.currentState,
      };
      store.run = record;
      return record;
    },
    async getRun(runId: string) {
      if (store.run?.id !== runId) return null;
      return store.run;
    },
    async updateRun(runId: string, input: {
      status?: "active" | "completed";
      currentYear?: number;
      currentMonth?: number;
      profile?: GameRun["profile"];
      currentState?: GameRun;
    }) {
      if (!store.run || store.run.id !== runId) throw new Error("run not found");
      store.run = {
        ...store.run,
        updated_at: new Date().toISOString(),
        status: input.status ?? store.run.status,
        current_year: input.currentYear ?? store.run.current_year,
        current_month: input.currentMonth ?? store.run.current_month,
        profile_json: input.profile ?? store.run.profile_json,
        current_state_json: input.currentState ?? store.run.current_state_json,
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
        created_at: new Date().toISOString(),
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
        created_at: new Date().toISOString(),
      }));
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
        id: `${input.runId}-report-${input.year}-${input.month ?? "ending"}`,
        run_id: input.runId,
        year: input.year,
        month: input.month ?? null,
        report_type: input.reportType,
        input_summary_json: input.inputSummary as unknown as Json,
        output_markdown: input.outputMarkdown,
        model: input.model ?? null,
        created_at: new Date().toISOString(),
      };
      store.aiReports.push(record);
      return record;
    },
    async saveResumeItems(inputs: Array<{
      runId: string;
      year: number;
      month: number;
      title: string;
      category: string;
      detail?: string;
    }>) {
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-resume-${input.year}-${input.month}-${index}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        title: input.title,
        category: input.category,
        detail: input.detail ?? null,
        created_at: new Date().toISOString(),
      }));
      store.resumeItems.push(...records);
      return records;
    },
  };
}

async function fakeAiReport(input: AiReportRequest): Promise<AiReportResult> {
  return {
    kind: input.kind,
    markdown: `Report for ${input.kind}`,
    model: "fake-model",
    usedFallback: false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function failingAiReport(_input: AiReportRequest): Promise<AiReportResult> {
  return {
    kind: "monthly_journal",
    markdown: "",
    model: "failing-model",
    usedFallback: true,
  };
}

describe("12-month smoke test", () => {
  it("advances through 12 months without crashing and produces valid data each month", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-12-months",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2],
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

    for (let month = 1; month <= 12; month++) {
      const result = await advanceDemoMonth({
        repository: createRepository(store),
        runId: run.id,
        plan: {
          attendanceStrategy: "mixed",
          actions: [
            { action: "study", time: "day" },
            { action: month % 2 === 0 ? "social" : "student_activity", time: "night" },
          ],
        },
        generateReport: fakeAiReport,
      });

      // Verify run advanced correctly
      const expectedMonth = month < 12 ? month + 1 : 1;
      const expectedYear = month < 12 ? 1 : 2;
      expect(result.run.currentMonth).toBe(expectedMonth);
      expect(result.run.currentYear).toBe(expectedYear);

      // Verify monthly state was saved
      expect(store.monthlyStates).toHaveLength(month);
      const latestState = store.monthlyStates[month - 1];
      expect(latestState).toBeDefined();
      expect(latestState!.year).toBe(1);
      expect(latestState!.month).toBe(month);

      // Verify snapshot can be normalized without crashing
      const normalized = normalizeMonthlySummary(latestState!.snapshot_json as unknown as StructuredMonthlySummary);
      expect(normalized.statsBefore).toBeDefined();
      expect(normalized.statsAfter).toBeDefined();
      expect(normalized.statsDelta).toBeDefined();
      expect(typeof normalized.statsBefore.money).toBe("number");
      expect(typeof normalized.statsAfter.money).toBe("number");
      expect(typeof normalized.statsDelta.money).toBe("number");

      // Verify growth journal entry can be built without crashing
      const growthEntry = buildGrowthJournalEntry(
        latestState!.snapshot_json as unknown as StructuredMonthlySummary,
        latestState!.year,
        latestState!.month,
      );
      expect(growthEntry.title).toBeTruthy();
      expect(growthEntry.message).toBeTruthy();
      expect(growthEntry.title).not.toContain("undefined");
      expect(growthEntry.message).not.toContain("undefined");

      // Verify digest can be built without crashing
      const digest = buildMonthlyDiaryDigest(
        latestState!.snapshot_json as unknown as StructuredMonthlySummary,
        latestState!.year,
        latestState!.month,
      );
      expect(digest.monthLabel).toBeTruthy();
      expect(digest.directionSignal).toBeTruthy();
      expect(digest.moneyStory).toBeTruthy();

      // Verify AI report was saved
      expect(store.aiReports.length).toBeGreaterThanOrEqual(month);
    }

    // Final verification
    expect(store.monthlyStates).toHaveLength(12);
    expect(store.aiReports.length).toBeGreaterThanOrEqual(12);
  });

  it("advances through 12 months with AI failures and falls back gracefully", async () => {
    const store = createStore();
    const run = createInitialGameRun({
      id: "run-12-months-fallback",
      randomValues: [0.2, 0.6, 0.4, 0.5, 0.3, 0.1, 0.7, 0.2],
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

    for (let month = 1; month <= 12; month++) {
      const result = await advanceDemoMonth({
        repository: createRepository(store),
        runId: run.id,
        plan: {
          attendanceStrategy: "mixed",
          actions: [
            { action: "study", time: "day" },
            { action: "relax", time: "night" },
          ],
        },
        generateReport: failingAiReport,
      });

      // Verify run advanced
      expect(result.run.currentMonth).toBe(month < 12 ? month + 1 : 1);

      // Verify monthly state was saved
      const latestState = store.monthlyStates[month - 1];
      expect(latestState).toBeDefined();

      // Verify fallback can be rendered without crashing
      const fallbackReport = renderMonthlyJournalFallback({
        kind: "monthly_journal",
        runId: run.id,
        year: latestState!.year,
        month: latestState!.month,
        summary: latestState!.snapshot_json as unknown as StructuredMonthlySummary,
      });
      expect(fallbackReport.usedFallback).toBe(true);
      expect(fallbackReport.markdown).toBeTruthy();
      expect(fallbackReport.markdown).not.toContain("undefined");
    }

    expect(store.monthlyStates).toHaveLength(12);
  });
});

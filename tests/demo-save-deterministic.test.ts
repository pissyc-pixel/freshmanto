import { describe, expect, it } from "vitest";

import { advanceDemoMonth } from "@/lib/demo/run-service";
import { createDemoPresetRun } from "@/lib/demo/presets";
import { acceptFutureOfferDecision } from "@/core/resolvers/progression";
import type {
  AIReportRecord,
  GameEventLogRecord,
  Json,
  MonthlyStateRecord,
  ResumeItemRecord,
  RunRecord,
} from "@/types/db";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type { GameRun, StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";

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
      return store.run?.id === runId ? store.run : null;
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
        created_at: new Date().toISOString(),
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
      const records = inputs.map((input, index) => ({
        id: `${input.runId}-${input.month}-${index}`,
        run_id: input.runId,
        year: input.year,
        month: input.month,
        category: input.category,
        title: input.title,
        summary: input.summary,
        source_item_id: input.sourceItemId ?? null,
        metadata_json: input.metadata ?? {},
        created_at: new Date().toISOString(),
      })) satisfies ResumeItemRecord[];
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

async function advanceUntilCompleted(input: {
  store: InMemoryStore;
  runId: string;
  monthPlan: {
    attendanceStrategy: "mixed" | "serious";
    actions: Array<{ action: "study" | "job_prep" | "student_activity" | "writing_research" | "postgraduate_prep"; time: "day" | "night" }>;
  };
}) {
  const repository = createRepository(input.store);
  let latestRun = input.store.run?.current_state_json as GameRun;
  let latestResult:
    | Awaited<ReturnType<typeof advanceDemoMonth>>
    | undefined;

  for (let step = 0; step < 24; step += 1) {
    latestResult = await advanceDemoMonth({
      repository,
      runId: input.runId,
      plan: input.monthPlan,
      generateReport: fakeAiReport,
    });
    latestRun = latestResult.run;

    const targetOffer = latestRun.futureOffers?.find((offer) => {
      if (offer.accepted || offer.rejected) {
        return false;
      }

      if (latestRun.progression?.dominantDirection === "recommendation") {
        return offer.type === "recommendation";
      }

      return offer.type === "employment" && (offer.quality === "excellent" || offer.quality === "good");
    });

    if (targetOffer) {
      latestRun = acceptFutureOfferDecision(latestRun, targetOffer.id, "accept");
      await repository.updateRun(input.runId, {
        status: latestRun.status,
        currentYear: latestRun.currentYear,
        currentMonth: latestRun.currentMonth,
        profile: latestRun.profile,
        currentState: latestRun,
      });
    }

    if (latestRun.status === "completed") {
      break;
    }
  }

  return latestResult!;
}

describe("deterministic demo save progression", () => {
  it("carries the Nankai business employment preset from month 25 to a completed employment ending", async () => {
    const store = createStore();
    const repository = createRepository(store);
    const seed = await createDemoPresetRun({
      repository,
      presetId: "nankai-business-employment-junior-fall",
      runId: "demo-nankai-business",
    });

    const result = await advanceUntilCompleted({
      store,
      runId: seed.run.id,
      monthPlan: {
        attendanceStrategy: "mixed",
        actions: [
          { action: "job_prep", time: "day" },
          { action: "student_activity", time: "night" },
          { action: "job_prep", time: "day" },
        ],
      },
    });

    expect(result.run.status).toBe("completed");
    expect(result.endingSummary?.graduationPath).toBe("employment");
    expect(result.endingSummary?.pathResult).toBe("success");
    expect(result.run.acceptedOffer).toMatchObject({ type: "employment", accepted: true });
    expect(result.run.endingEvidence?.some((item) => item.kind === "offer")).toBe(true);
  });

  it("carries the Tianda engineering recommendation preset from month 25 to a completed recommendation ending", async () => {
    const store = createStore();
    const repository = createRepository(store);
    const seed = await createDemoPresetRun({
      repository,
      presetId: "tianda-engineering-recommendation-junior-fall",
      runId: "demo-tianda-engineering",
    });

    const result = await advanceUntilCompleted({
      store,
      runId: seed.run.id,
      monthPlan: {
        attendanceStrategy: "serious",
        actions: [
          { action: "study", time: "day" },
          { action: "writing_research", time: "night" },
          { action: "study", time: "day" },
        ],
      },
    });

    expect(result.run.status).toBe("completed");
    expect(result.endingSummary?.graduationPath).toBe("recommendation");
    expect(result.endingSummary?.pathResult).toBe("success");
    expect(result.run.acceptedOffer).toMatchObject({ type: "recommendation", accepted: true });
    expect(result.run.endingEvidence?.some((item) => item.kind === "offer")).toBe(true);
  });
});

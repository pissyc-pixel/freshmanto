import { randomUUID } from "node:crypto";
import {
  createInitialGameRun,
  evaluateGraduationOutcome,
  resolveMonthlyTurn,
  settleSemester
} from "@/core/game-engine";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type {
  GameRun,
  MonthlyActionPlan,
  ResumeItem,
  SemesterSettlement,
  StructuredEndingSummary,
  StructuredMonthlySummary
} from "@/types/game";

type JsonValue = string | number | boolean | null | string[];

export type DemoRepository = {
  createRun(input: {
    id?: string;
    status?: "active" | "completed";
    currentYear: number;
    currentMonth: number;
    profile: GameRun["profile"];
    currentState: GameRun;
  }): Promise<unknown>;
  getRun(runId: string): Promise<{
    id: string;
    status: "active" | "completed";
    current_year: number;
    current_month: number;
    profile_json: GameRun["profile"];
    current_state_json: GameRun;
  } | null>;
  updateRun(runId: string, input: {
    status?: "active" | "completed";
    currentYear?: number;
    currentMonth?: number;
    profile?: GameRun["profile"];
    currentState?: GameRun;
  }): Promise<unknown>;
  saveMonthlyState(input: {
    runId: string;
    year: number;
    month: number;
    snapshot: StructuredMonthlySummary;
  }): Promise<unknown>;
  writeEventLogs(inputs: Array<{
    runId: string;
    year: number;
    month: number;
    logType: "action" | "event" | "settlement";
    message: string;
    metadata?: Record<string, JsonValue>;
  }>): Promise<unknown>;
  saveAiReport(input: {
    runId: string;
    year: number;
    month?: number | null;
    reportType: "monthly_journal" | "ending_report";
    inputSummary: StructuredMonthlySummary | StructuredEndingSummary;
    outputMarkdown: string;
    model?: string | null;
  }): Promise<unknown>;
  saveResumeItems(inputs: Array<{
    runId: string;
    year: number;
    month: number;
    category: ResumeItem["category"];
    title: string;
    summary: string;
    sourceItemId?: string | null;
    metadata?: Record<string, JsonValue>;
  }>): Promise<unknown>;
};

export type AdvanceDemoMonthResult = {
  run: GameRun;
  playedYear: number;
  playedMonth: number;
  monthlySummary: StructuredMonthlySummary;
  monthlyReport: AiReportResult;
  semesterSettlement?: SemesterSettlement;
  endingSummary?: StructuredEndingSummary;
  endingReport?: AiReportResult;
};

type ReportGenerator = (input: AiReportRequest) => Promise<AiReportResult>;

function createRunLog(run: GameRun) {
  return {
    runId: run.id,
    year: run.currentYear,
    month: run.currentMonth,
    logType: "settlement" as const,
    message: "run created",
    metadata: {
      schoolTier: run.profile.schoolTier,
      cityTier: run.profile.cityTier,
      monthlyAllowance: run.profile.monthlyAllowance
    }
  };
}

function createMonthlyLogs(input: {
  runId: string;
  year: number;
  month: number;
  summary: StructuredMonthlySummary;
  semesterSettlement?: SemesterSettlement;
  endingSummary?: StructuredEndingSummary;
}) {
  const logs: Array<{
    runId: string;
    year: number;
    month: number;
    logType: "action" | "event" | "settlement";
    message: string;
    metadata?: Record<string, JsonValue>;
  }> = [];

  logs.push({
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "action",
    message: "monthly actions resolved",
    metadata: {
      attendanceStrategy: input.summary.attendanceStrategy,
      actions: input.summary.actions,
      flags: input.summary.flags
    }
  });

  if (input.summary.eventIds.length > 0) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "event",
      message: "events triggered",
      metadata: {
        eventIds: input.summary.eventIds
      }
    });
  }

  logs.push({
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "settlement",
    message: "monthly settlement saved",
    metadata: {
      feedback: input.summary.academicFeedback,
      moneyDelta: input.summary.moneyDelta
    }
  });

  if (input.semesterSettlement) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "settlement",
      message: "semester settlement saved",
      metadata: {
        semester: input.semesterSettlement.semester,
        feedback: input.semesterSettlement.feedback,
        passed: input.semesterSettlement.passed
      }
    });
  }

  if (input.endingSummary) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "settlement",
      message: "ending summary saved",
      metadata: {
        outcome: input.endingSummary.outcome
      }
    });
  }

  return logs;
}

function mapResumeItems(run: GameRun, month: number, items: ResumeItem[]) {
  return items.map((item) => ({
    runId: run.id,
    year: run.currentYear,
    month,
    category: item.category,
    title: item.title,
    summary: item.summary,
    sourceItemId: item.id,
    metadata: {
      tags: item.tags
    }
  }));
}

export async function createDemoRun(input: {
  repository: DemoRepository;
  runId?: string;
  randomValues?: number[];
}) {
  const run = createInitialGameRun({
    id: input.runId ?? randomUUID(),
    randomValues: input.randomValues
  });

  await input.repository.createRun({
    id: run.id,
    currentYear: run.currentYear,
    currentMonth: run.currentMonth,
    profile: run.profile,
    currentState: run
  });
  await input.repository.writeEventLogs([createRunLog(run)]);

  return { run };
}

export async function advanceDemoMonth(input: {
  repository: DemoRepository;
  runId: string;
  plan: MonthlyActionPlan;
  generateReport: ReportGenerator;
}): Promise<AdvanceDemoMonthResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = existing.current_state_json;
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const monthlyResult = resolveMonthlyTurn(baseRun, input.plan);
  let nextRun = monthlyResult.run;
  let semesterSettlement: SemesterSettlement | undefined;

  if (playedMonth % 6 === 0) {
    const settlement = settleSemester(nextRun);
    nextRun = settlement.run;
    semesterSettlement = settlement.summary;
  }

  const monthlyReport = await input.generateReport({
    kind: "monthly_journal",
    runId: input.runId,
    year: playedYear,
    month: playedMonth,
    summary: monthlyResult.summary
  });

  await input.repository.saveMonthlyState({
    runId: input.runId,
    year: playedYear,
    month: playedMonth,
    snapshot: monthlyResult.summary
  });
  await input.repository.saveAiReport({
    runId: input.runId,
    year: playedYear,
    month: playedMonth,
    reportType: "monthly_journal",
    inputSummary: monthlyResult.summary,
    outputMarkdown: monthlyReport.markdown,
    model: monthlyReport.model ?? null
  });

  if (monthlyResult.summary.resumeAdditions.length > 0) {
    await input.repository.saveResumeItems(
      mapResumeItems(baseRun, playedMonth, monthlyResult.summary.resumeAdditions)
    );
  }

  let endingSummary: StructuredEndingSummary | undefined;
  let endingReport: AiReportResult | undefined;

  if (playedYear === 4 && playedMonth === 12) {
    endingSummary = evaluateGraduationOutcome(nextRun);
    endingReport = await input.generateReport({
      kind: "ending_report",
      runId: input.runId,
      summary: endingSummary
    });
    nextRun = {
      ...nextRun,
      status: "completed"
    };

    await input.repository.saveAiReport({
      runId: input.runId,
      year: playedYear,
      month: null,
      reportType: "ending_report",
      inputSummary: endingSummary,
      outputMarkdown: endingReport.markdown,
      model: endingReport.model ?? null
    });
  }

  await input.repository.writeEventLogs(
    createMonthlyLogs({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      summary: monthlyResult.summary,
      semesterSettlement,
      endingSummary
    })
  );
  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    monthlySummary: monthlyResult.summary,
    monthlyReport,
    semesterSettlement,
    endingSummary,
    endingReport
  };
}


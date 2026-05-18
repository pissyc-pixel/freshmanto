import { randomUUID } from "node:crypto";
import {
  createInitialGameRun,
  confirmPlannedWeek,
  evaluateGraduationOutcome,
  planWeeklyDayAction,
  resolveActionTurn,
  resolveMonthlyTurn,
  resolveWeekEnd,
  selectWeekAttendanceStrategy,
  settleSemester,
} from "@/core/game-engine";
import { deriveAcademicProfile, settleLongTermProgression } from "@/core/resolvers/progression";
import { renderEndingReportFallback, renderMonthlyJournalFallback } from "@/lib/ai/reports";
import type { AiReportRequest, AiReportResult } from "@/types/ai";
import type {
  ActionTurnPlan,
  ActionTurnSummary,
  CollegeTrack,
  GameRun,
  MonthlyActionPlan,
  ResumeItem,
  SemesterSettlement,
  StructuredEndingSummary,
  StructuredMonthlySummary,
  Weekday,
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

export type AdvanceDemoTurnResult = {
  run: GameRun;
  playedYear: number;
  playedMonth: number;
  playedWeek: number;
  turnSummary: ActionTurnSummary;
  monthCompleted: boolean;
  monthlySummary?: StructuredMonthlySummary;
  monthlyReport?: AiReportResult;
  semesterSettlement?: SemesterSettlement;
  endingSummary?: StructuredEndingSummary;
  endingReport?: AiReportResult;
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

export type EndDemoWeekResult = {
  run: GameRun;
  playedYear: number;
  playedMonth: number;
  playedWeek: number;
  monthCompleted: boolean;
  monthlySummary?: StructuredMonthlySummary;
  monthlyReport?: AiReportResult;
  semesterSettlement?: SemesterSettlement;
  endingSummary?: StructuredEndingSummary;
  endingReport?: AiReportResult;
};

export type UpdateDemoWeekPlanResult = {
  run: GameRun;
  playedYear: number;
  playedMonth: number;
  playedWeek: number;
};

export type PlannedActionSnapshotEntry = {
  weekday: Weekday;
  optionId: string;
  skipClass?: boolean;
};

type ReportGenerator = (input: AiReportRequest) => Promise<AiReportResult>;

async function generateReportWithFallback(
  input: AiReportRequest,
  generateReport: ReportGenerator,
): Promise<AiReportResult> {
  try {
    const report = await generateReport(input);

    if (report.markdown.trim().length > 0) {
      return report;
    }
  } catch {
    // The rules and monthly snapshot are already deterministic; report writing must degrade locally.
  }

  return input.kind === "monthly_journal"
    ? renderMonthlyJournalFallback(input)
    : renderEndingReportFallback(input);
}

function createRunLog(run: GameRun) {
  return {
    runId: run.id,
    year: run.currentYear,
    month: run.currentMonth,
    logType: "settlement" as const,
    message: "已创建新档",
    metadata: {
      schoolTier: run.profile.schoolTier,
      cityTier: run.profile.cityTier,
      monthlyAllowance: run.profile.monthlyAllowance,
    },
  };
}

function createTurnLog(input: {
  runId: string;
  year: number;
  month: number;
  turnSummary: ActionTurnSummary;
}) {
  return {
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "action" as const,
    message: "单次行动已结算",
    metadata: {
      week: input.turnSummary.week,
      advancesCalendar: input.turnSummary.advancesCalendar,
      attendanceStrategy: input.turnSummary.attendanceStrategy,
      action: input.turnSummary.resolvedAction.action,
      flags: input.turnSummary.flags,
    },
  };
}

function createWeekEndLog(input: {
  runId: string;
  year: number;
  month: number;
  week: number;
  attendanceStrategy: ActionTurnSummary["attendanceStrategy"];
}) {
  return {
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "action" as const,
    message: "本周已提前结束",
    metadata: {
      week: input.week,
      attendanceStrategy: input.attendanceStrategy,
    },
  };
}

function createWeekPlanningLog(input: {
  runId: string;
  year: number;
  month: number;
  week: number;
  message: string;
  metadata?: Record<string, JsonValue>;
}) {
  return {
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "action" as const,
    message: input.message,
    metadata: {
      week: input.week,
      ...(input.metadata ?? {}),
    },
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
    message: "本月行动已完成结算",
    metadata: {
      attendanceStrategy: input.summary.attendanceStrategy,
      actions: input.summary.actions,
      flags: input.summary.flags,
    },
  });

  if (input.summary.eventIds.length > 0) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "event",
      message: "本月事件已触发",
      metadata: {
        eventIds: input.summary.eventIds,
      },
    });
  }

  logs.push({
    runId: input.runId,
    year: input.year,
    month: input.month,
    logType: "settlement",
    message: "本月结算已存档",
    metadata: {
      feedback: input.summary.academicFeedback,
      moneyDelta: input.summary.moneyDelta,
    },
  });

  if (input.semesterSettlement) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "settlement",
      message: "学期结算已存档",
      metadata: {
        semester: input.semesterSettlement.semester,
        feedback: input.semesterSettlement.feedback,
        passed: input.semesterSettlement.passed,
      },
    });
  }

  if (input.endingSummary) {
    logs.push({
      runId: input.runId,
      year: input.year,
      month: input.month,
      logType: "settlement",
      message: "终局摘要已存档",
      metadata: {
        outcome: input.endingSummary.outcome,
      },
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
      tags: item.tags,
    },
  }));
}

async function persistMonthArtifacts(input: {
  repository: DemoRepository;
  runId: string;
  playedYear: number;
  playedMonth: number;
  nextRun: GameRun;
  monthlySummary: StructuredMonthlySummary;
  generateReport: ReportGenerator;
}) {
  let settledRun = input.nextRun;
  let semesterSettlement: SemesterSettlement | undefined;
  let monthlySummary: StructuredMonthlySummary = input.monthlySummary;

  if (input.playedMonth % 6 === 0) {
    const settlement = settleSemester(settledRun);
    settledRun = settlement.run;
    semesterSettlement = settlement.summary;
  }

  const longTermSettlement = settleLongTermProgression(settledRun, {
    playedYear: input.playedYear,
    playedMonth: input.playedMonth,
  });
  settledRun = longTermSettlement.run;
  monthlySummary = {
    ...monthlySummary,
    resumeAdditions: [...monthlySummary.resumeAdditions, ...longTermSettlement.resumeAdditions],
    notableFacts: [...monthlySummary.notableFacts, ...longTermSettlement.notableFacts],
    academicProfile: deriveAcademicProfile(settledRun),
    progression: settledRun.progression,
    competitionProjects: settledRun.competitionProjects,
    scholarshipAwarded: longTermSettlement.scholarshipAwarded,
  };

  await input.repository.saveMonthlyState({
    runId: input.runId,
    year: input.playedYear,
    month: input.playedMonth,
    snapshot: monthlySummary,
  });

  if (monthlySummary.resumeAdditions.length > 0) {
    await input.repository.saveResumeItems(
      mapResumeItems(settledRun, input.playedMonth, monthlySummary.resumeAdditions),
    );
  }

  const monthlyReport = await generateReportWithFallback(
    {
      kind: "monthly_journal",
      runId: input.runId,
      year: input.playedYear,
      month: input.playedMonth,
      summary: monthlySummary,
    },
    input.generateReport,
  );

  await input.repository.saveAiReport({
    runId: input.runId,
    year: input.playedYear,
    month: input.playedMonth,
    reportType: "monthly_journal",
    inputSummary: monthlySummary,
    outputMarkdown: monthlyReport.markdown,
    model: monthlyReport.model ?? null,
  });

  let endingSummary: StructuredEndingSummary | undefined;
  let endingReport: AiReportResult | undefined;

  if (input.playedYear === 4 && input.playedMonth === 12) {
    endingSummary = evaluateGraduationOutcome(settledRun);
    endingReport = await generateReportWithFallback(
      {
        kind: "ending_report",
        runId: input.runId,
        summary: endingSummary,
      },
      input.generateReport,
    );
    settledRun = {
      ...settledRun,
      status: "completed",
    };

    await input.repository.saveAiReport({
      runId: input.runId,
      year: input.playedYear,
      month: null,
      reportType: "ending_report",
      inputSummary: endingSummary,
      outputMarkdown: endingReport.markdown,
      model: endingReport.model ?? null,
    });
  }

  await input.repository.writeEventLogs(
    createMonthlyLogs({
      runId: input.runId,
      year: input.playedYear,
      month: input.playedMonth,
      summary: monthlySummary,
      semesterSettlement,
      endingSummary,
    }),
  );

  return {
    nextRun: settledRun,
    monthlySummary,
    monthlyReport,
    semesterSettlement,
    endingSummary,
    endingReport,
  };
}

function applyPlannedActionsSnapshot(run: GameRun, plannedActionsSnapshot?: PlannedActionSnapshotEntry[]) {
  if (!plannedActionsSnapshot || plannedActionsSnapshot.length === 0) {
    return run;
  }

  const latestByWeekday = new Map<Weekday, PlannedActionSnapshotEntry>();

  for (const entry of plannedActionsSnapshot) {
    latestByWeekday.set(entry.weekday, entry);
  }

  let nextRun = run;

  for (const snapshot of latestByWeekday.values()) {
    nextRun = planWeeklyDayAction({
      run: nextRun,
      weekday: snapshot.weekday,
      optionId: snapshot.optionId,
      skipClass: snapshot.skipClass,
    });
  }

  return nextRun;
}

export async function createDemoRun(input: {
  repository: DemoRepository;
  runId?: string;
  randomValues?: number[];
  name?: string;
  discipline?: CollegeTrack;
}) {
  const run = createInitialGameRun({
    id: input.runId ?? randomUUID(),
    randomValues: input.randomValues,
    name: input.name,
    discipline: input.discipline,
  });

  await input.repository.createRun({
    id: run.id,
    currentYear: run.currentYear,
    currentMonth: run.currentMonth,
    profile: run.profile,
    currentState: run,
  });
  await input.repository.writeEventLogs([createRunLog(run)]);

  return { run };
}

export async function setDemoWeekAttendance(input: {
  repository: DemoRepository;
  runId: string;
  attendanceStrategy: ActionTurnPlan["attendanceStrategy"];
}): Promise<UpdateDemoWeekPlanResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = existing.current_state_json;
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const playedWeek = baseRun.activeMonth?.currentWeek ?? 1;
  const nextRun = selectWeekAttendanceStrategy(baseRun, input.attendanceStrategy);

  await input.repository.writeEventLogs([
    createWeekPlanningLog({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      week: playedWeek,
      message: "已确定本周课程态度",
      metadata: {
        attendanceStrategy: input.attendanceStrategy,
      },
    }),
  ]);
  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun,
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    playedWeek,
  };
}

export async function planDemoWeekday(input: {
  repository: DemoRepository;
  runId: string;
  weekday: Weekday;
  optionId: string;
  skipClass?: boolean;
}): Promise<UpdateDemoWeekPlanResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = existing.current_state_json;
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const playedWeek = baseRun.activeMonth?.currentWeek ?? 1;
  const nextRun = planWeeklyDayAction({
    run: baseRun,
    weekday: input.weekday,
    optionId: input.optionId,
    skipClass: input.skipClass,
  });

  await input.repository.writeEventLogs([
    createWeekPlanningLog({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      week: playedWeek,
      message: "已安排某一天行动",
      metadata: {
        weekday: input.weekday,
        optionId: input.optionId,
        skipClass: Boolean(input.skipClass),
      },
    }),
  ]);
  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun,
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    playedWeek,
  };
}

export async function confirmDemoWeek(input: {
  repository: DemoRepository;
  runId: string;
  generateReport: ReportGenerator;
  plannedActionsSnapshot?: PlannedActionSnapshotEntry[];
}): Promise<EndDemoWeekResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = applyPlannedActionsSnapshot(existing.current_state_json, input.plannedActionsSnapshot);
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const playedWeek = baseRun.activeMonth?.currentWeek ?? 1;
  const weekResult = confirmPlannedWeek(baseRun);
  let nextRun = weekResult.run;
  let resolvedMonthlySummary = weekResult.monthlySummary;
  let monthlyReport: AiReportResult | undefined;
  let semesterSettlement: SemesterSettlement | undefined;
  let endingSummary: StructuredEndingSummary | undefined;
  let endingReport: AiReportResult | undefined;

  await input.repository.writeEventLogs([
    createWeekPlanningLog({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      week: playedWeek,
      message: "已确认本周安排",
      metadata: {
        monthCompleted: weekResult.monthCompleted,
      },
    }),
  ]);

  if (weekResult.monthCompleted && weekResult.monthlySummary) {
    const monthArtifacts = await persistMonthArtifacts({
      repository: input.repository,
      runId: input.runId,
      playedYear,
      playedMonth,
      nextRun,
      monthlySummary: weekResult.monthlySummary,
      generateReport: input.generateReport,
    });

    nextRun = monthArtifacts.nextRun;
    resolvedMonthlySummary = monthArtifacts.monthlySummary;
    resolvedMonthlySummary = monthArtifacts.monthlySummary;
    monthlyReport = monthArtifacts.monthlyReport;
    semesterSettlement = monthArtifacts.semesterSettlement;
    endingSummary = monthArtifacts.endingSummary;
    endingReport = monthArtifacts.endingReport;
  }

  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun,
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    playedWeek,
    monthCompleted: weekResult.monthCompleted,
    monthlySummary: resolvedMonthlySummary,
    monthlyReport,
    semesterSettlement,
    endingSummary,
    endingReport,
  };
}

export async function advanceDemoTurn(input: {
  repository: DemoRepository;
  runId: string;
  plan: ActionTurnPlan;
  generateReport: ReportGenerator;
}): Promise<AdvanceDemoTurnResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = existing.current_state_json;
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const playedWeek = baseRun.activeMonth?.currentWeek ?? 1;
  const turnResult = resolveActionTurn(baseRun, input.plan);
  let nextRun = turnResult.run;
  let resolvedMonthlySummary = turnResult.monthlySummary;
  let monthlyReport: AiReportResult | undefined;
  let semesterSettlement: SemesterSettlement | undefined;
  let endingSummary: StructuredEndingSummary | undefined;
  let endingReport: AiReportResult | undefined;

  await input.repository.writeEventLogs([
    createTurnLog({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      turnSummary: turnResult.turnSummary,
    }),
  ]);

  if (turnResult.monthCompleted && turnResult.monthlySummary) {
    const monthArtifacts = await persistMonthArtifacts({
      repository: input.repository,
      runId: input.runId,
      playedYear,
      playedMonth,
      nextRun,
      monthlySummary: turnResult.monthlySummary,
      generateReport: input.generateReport,
    });

    nextRun = monthArtifacts.nextRun;
    resolvedMonthlySummary = monthArtifacts.monthlySummary;
    monthlyReport = monthArtifacts.monthlyReport;
    semesterSettlement = monthArtifacts.semesterSettlement;
    endingSummary = monthArtifacts.endingSummary;
    endingReport = monthArtifacts.endingReport;
  }

  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun,
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    playedWeek,
    turnSummary: turnResult.turnSummary,
    monthCompleted: turnResult.monthCompleted,
    monthlySummary: resolvedMonthlySummary,
    monthlyReport,
    semesterSettlement,
    endingSummary,
    endingReport,
  };
}

export async function endDemoWeek(input: {
  repository: DemoRepository;
  runId: string;
  attendanceStrategy: ActionTurnPlan["attendanceStrategy"];
  generateReport: ReportGenerator;
}): Promise<EndDemoWeekResult> {
  const existing = await input.repository.getRun(input.runId);

  if (!existing) {
    throw new Error(`Run ${input.runId} was not found.`);
  }

  const baseRun = existing.current_state_json;
  const playedYear = baseRun.currentYear;
  const playedMonth = baseRun.currentMonth;
  const playedWeek = baseRun.activeMonth?.currentWeek ?? 1;
  const weekResult = resolveWeekEnd(baseRun, input.attendanceStrategy);
  let nextRun = weekResult.run;
  let resolvedMonthlySummary = weekResult.monthlySummary;
  let monthlyReport: AiReportResult | undefined;
  let semesterSettlement: SemesterSettlement | undefined;
  let endingSummary: StructuredEndingSummary | undefined;
  let endingReport: AiReportResult | undefined;

  await input.repository.writeEventLogs([
    createWeekEndLog({
      runId: input.runId,
      year: playedYear,
      month: playedMonth,
      week: playedWeek,
      attendanceStrategy: input.attendanceStrategy,
    }),
  ]);

  if (weekResult.monthCompleted && weekResult.monthlySummary) {
    const monthArtifacts = await persistMonthArtifacts({
      repository: input.repository,
      runId: input.runId,
      playedYear,
      playedMonth,
      nextRun,
      monthlySummary: weekResult.monthlySummary,
      generateReport: input.generateReport,
    });

    nextRun = monthArtifacts.nextRun;
    resolvedMonthlySummary = monthArtifacts.monthlySummary;
    monthlyReport = monthArtifacts.monthlyReport;
    semesterSettlement = monthArtifacts.semesterSettlement;
    endingSummary = monthArtifacts.endingSummary;
    endingReport = monthArtifacts.endingReport;
  }

  await input.repository.updateRun(input.runId, {
    status: nextRun.status,
    currentYear: nextRun.currentYear,
    currentMonth: nextRun.currentMonth,
    profile: nextRun.profile,
    currentState: nextRun,
  });

  return {
    run: nextRun,
    playedYear,
    playedMonth,
    playedWeek,
    monthCompleted: weekResult.monthCompleted,
    monthlySummary: resolvedMonthlySummary,
    monthlyReport,
    semesterSettlement,
    endingSummary,
    endingReport,
  };
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
  const monthArtifacts = await persistMonthArtifacts({
    repository: input.repository,
    runId: input.runId,
    playedYear,
    playedMonth,
    nextRun: monthlyResult.run,
    monthlySummary: monthlyResult.summary,
    generateReport: input.generateReport,
  });

  const lastTurn = monthlyResult.summary.turns.at(-1) ?? monthlyResult.summary.turns[0];

  if (lastTurn) {
    await input.repository.writeEventLogs([
      createTurnLog({
        runId: input.runId,
        year: playedYear,
        month: playedMonth,
        turnSummary: lastTurn,
      }),
    ]);
  }

  await input.repository.updateRun(input.runId, {
    status: monthArtifacts.nextRun.status,
    currentYear: monthArtifacts.nextRun.currentYear,
    currentMonth: monthArtifacts.nextRun.currentMonth,
    profile: monthArtifacts.nextRun.profile,
    currentState: monthArtifacts.nextRun,
  });

  return {
    run: monthArtifacts.nextRun,
    playedYear,
    playedMonth,
    monthlySummary: monthlyResult.summary,
    monthlyReport: monthArtifacts.monthlyReport,
    semesterSettlement: monthArtifacts.semesterSettlement,
    endingSummary: monthArtifacts.endingSummary,
    endingReport: monthArtifacts.endingReport,
  };
}

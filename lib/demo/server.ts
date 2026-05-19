import { ensureDemoSchema } from "@/db/ensure-schema";
import { generateAiReport } from "@/lib/ai/reports";
import { createDemoPresetRun, type DemoSavePresetId } from "@/lib/demo/presets";
import { normalizeSaveState } from "@/lib/demo/save-state";
import { createServerSupabaseRepository } from "@/lib/supabase";
import {
  advanceDemoMonth,
  advanceDemoTurn,
  confirmDemoWeek,
  createDemoRun,
  decideFutureOffer,
  type PlannedActionSnapshotEntry,
  planDemoWeekday,
  setDemoWeekAttendance,
} from "@/lib/demo/run-service";
import { evaluateGraduationOutcome } from "@/core/game-engine";
import type { ActionTurnPlan, CollegeTrack, MonthlyActionPlan, Weekday } from "@/types/game";

export async function createServerDemoRun(input?: {
  name?: string;
  discipline?: CollegeTrack;
}) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return createDemoRun({
    repository,
    name: input?.name,
    discipline: input?.discipline,
  });
}

export async function createServerDemoPresetRun(presetId: DemoSavePresetId) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return createDemoPresetRun({
    repository,
    presetId,
  });
}

export async function advanceServerDemoMonth(runId: string, plan: MonthlyActionPlan) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return advanceDemoMonth({
    repository,
    runId,
    plan,
    generateReport: generateAiReport
  });
}

export async function advanceServerDemoTurn(runId: string, plan: ActionTurnPlan) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return advanceDemoTurn({
    repository,
    runId,
    plan,
    generateReport: generateAiReport,
  });
}

export async function setServerWeekAttendance(runId: string, attendanceStrategy: ActionTurnPlan["attendanceStrategy"]) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return setDemoWeekAttendance({
    repository,
    runId,
    attendanceStrategy,
  });
}

export async function planServerWeekdayAction(
  runId: string,
  input: {
    weekday: Weekday;
    optionId: string;
    skipClass?: boolean;
  },
) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return planDemoWeekday({
    repository,
    runId,
    ...input,
  });
}

export async function confirmServerWeek(runId: string, plannedActionsSnapshot?: PlannedActionSnapshotEntry[]) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return confirmDemoWeek({
    repository,
    runId,
    generateReport: generateAiReport,
    plannedActionsSnapshot,
  });
}

export async function getServerDemoBundle(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  if (!runRecord) {
    return null;
  }

  const [monthlyStates, logs, aiReports, resumeItems] = await Promise.all([
    repository.listMonthlyStates(runId),
    repository.listEventLogs(runId),
    repository.listAiReports(runId),
    repository.listResumeItems(runId)
  ]);

  return {
    run: normalizeSaveState(runRecord.current_state_json),
    runRecord,
    monthlyStates,
    logs,
    aiReports,
    resumeItems
  };
}

export async function getServerGameBundle(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  if (!runRecord) {
    return null;
  }

  const [monthlyStates, logs] = await Promise.all([
    repository.listMonthlyStates(runId, { limit: 1, ascending: false }),
    repository.listEventLogs(runId, { limit: 6, ascending: false }),
  ]);

  return {
    run: normalizeSaveState(runRecord.current_state_json),
    runRecord,
    monthlyStates: monthlyStates.slice().reverse(),
    logs: logs.slice().reverse(),
  };
}

export async function getServerJournalBundle(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  if (!runRecord) {
    return null;
  }

  const [monthlyStates, aiReports] = await Promise.all([
    repository.listMonthlyStates(runId),
    repository.listAiReports(runId, "monthly_journal"),
  ]);

  return {
    run: normalizeSaveState(runRecord.current_state_json),
    runRecord,
    monthlyStates,
    aiReports,
  };
}

export async function getServerResumeBundle(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  if (!runRecord) {
    return null;
  }

  const [monthlyStates, resumeItems] = await Promise.all([
    repository.listMonthlyStates(runId),
    repository.listResumeItems(runId),
  ]);

  return {
    run: normalizeSaveState(runRecord.current_state_json),
    runRecord,
    monthlyStates,
    resumeItems,
  };
}

export async function getServerDemoRun(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  return runRecord ? normalizeSaveState(runRecord.current_state_json) : null;
}

export async function decideServerFutureOffer(
  runId: string,
  input: {
    offerId: string;
    decision: "accept" | "reject";
  },
) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return decideFutureOffer({
    repository,
    runId,
    offerId: input.offerId,
    decision: input.decision,
  });
}

export async function getServerEndingPreview(runId: string) {
  const bundle = await getServerDemoBundle(runId);

  if (!bundle) {
    return null;
  }

  const endingSummary = evaluateGraduationOutcome(bundle.run);
  const savedEndingReport = bundle.aiReports
    .filter((report) => report.report_type === "ending_report")
    .at(-1);

  return {
    ...bundle,
    endingSummary,
    savedEndingReport
  };
}

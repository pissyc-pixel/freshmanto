import { ensureDemoSchema } from "@/db/ensure-schema";
import { generateAiReport } from "@/lib/ai/reports";
import { createServerSupabaseRepository } from "@/lib/supabase";
import {
  advanceDemoMonth,
  advanceDemoTurn,
  confirmDemoWeek,
  createDemoRun,
  planDemoWeekday,
  setDemoWeekAttendance,
} from "@/lib/demo/run-service";
import { evaluateGraduationOutcome } from "@/core/game-engine";
import type { ActionTurnPlan, MonthlyActionPlan, Weekday } from "@/types/game";

export async function createServerDemoRun() {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return createDemoRun({ repository });
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

export async function confirmServerWeek(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();

  return confirmDemoWeek({
    repository,
    runId,
    generateReport: generateAiReport,
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
    run: runRecord.current_state_json,
    runRecord,
    monthlyStates,
    logs,
    aiReports,
    resumeItems
  };
}

export async function getServerDemoRun(runId: string) {
  await ensureDemoSchema();
  const repository = createServerSupabaseRepository();
  const runRecord = await repository.getRun(runId);

  return runRecord?.current_state_json ?? null;
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

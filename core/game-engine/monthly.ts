import { createInitialGameRun } from "@/core/generators";
import { resolveActionPlan } from "@/core/resolvers/actions";
import { resolveCourseStrategy } from "@/core/resolvers/attendance";
import { resolveMonthEvents } from "@/core/resolvers/events";
import { createMonthlySchedule } from "@/core/resolvers/schedule";
import { evaluateGraduationOutcome, evaluateSemesterFeedback, settleSemester } from "@/core/resolvers/semester";
import type {
  CooldownState,
  DynamicStats,
  GameRun,
  MonthlyActionPlan,
  ResolvedMonthResult,
  RiskState,
} from "@/types/game";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function addStats(base: DynamicStats, delta: DynamicStats): DynamicStats {
  return {
    money: base.money + delta.money,
    mood: clamp(base.mood + delta.mood, 0, 100),
    stress: clamp(base.stress + delta.stress, 0, 100),
    fulfillment: clamp(base.fulfillment + delta.fulfillment, 0, 100),
    social: clamp(base.social + delta.social, 0, 100),
    semesterAcademics: clamp(base.semesterAcademics + delta.semesterAcademics, 0, 100),
  };
}

function mergeRisk(base: RiskState, delta: RiskState): RiskState {
  return {
    academicRisk: Math.max(0, base.academicRisk + delta.academicRisk),
    burnout: Math.max(0, base.burnout + delta.burnout),
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function nextCooldowns(run: GameRun, askFamilyUsed: boolean): CooldownState {
  if (askFamilyUsed) {
    return {
      askFamilyMonths: 1,
    };
  }

  return {
    askFamilyMonths: Math.max(0, run.cooldowns.askFamilyMonths - 1),
  };
}

function nextCalendar(run: GameRun): Pick<GameRun, "currentMonth" | "currentYear"> {
  if (run.currentMonth === 12) {
    return {
      currentMonth: 1,
      currentYear: run.currentYear + 1,
    };
  }

  return {
    currentMonth: run.currentMonth + 1,
    currentYear: run.currentYear,
  };
}

function deriveMonthlyRiskFlags(run: GameRun): string[] {
  const flags = new Set(run.riskFlags);

  if (run.stats.money < 0) {
    flags.add("financial_instability");
  }
  if (run.stats.stress >= 85 || run.risk.burnout >= 30) {
    flags.add("burnout");
  }
  if (run.risk.academicRisk >= 25) {
    flags.add("chronic_failure");
  }

  return [...flags];
}

export function resolveMonthlyTurn(run: GameRun, plan: MonthlyActionPlan): ResolvedMonthResult {
  const schedule = createMonthlySchedule(run.currentMonth);
  const statsBefore = run.stats;
  const allowanceDelta = run.profile.monthlyAllowance;
  const course = resolveCourseStrategy(plan.attendanceStrategy);
  const actionResolution = resolveActionPlan(run, plan);

  const preEventStats = addStats(statsBefore, {
    money: allowanceDelta + actionResolution.moneyDelta + actionResolution.stats.money,
    mood: course.moodDelta + actionResolution.stats.mood,
    stress: actionResolution.stats.stress,
    fulfillment: actionResolution.stats.fulfillment,
    social: actionResolution.stats.social,
    semesterAcademics:
      course.academicGain + course.directRollCallPenalty + actionResolution.stats.semesterAcademics,
  });
  const preEventRun: GameRun = {
    ...run,
    stats: preEventStats,
    risk: mergeRisk(run.risk, {
      academicRisk: course.academicRiskDelta + actionResolution.risk.academicRisk,
      burnout: actionResolution.risk.burnout,
    }),
  };
  const eventResolution = resolveMonthEvents(preEventRun, run.currentMonth);
  const totalMoneyDelta =
    allowanceDelta +
    actionResolution.moneyDelta +
    actionResolution.stats.money +
    eventResolution.moneyDelta +
    eventResolution.stats.money;
  const statsDelta: DynamicStats = {
    money: totalMoneyDelta,
    mood: course.moodDelta + actionResolution.stats.mood + eventResolution.stats.mood,
    stress: actionResolution.stats.stress + eventResolution.stats.stress,
    fulfillment: actionResolution.stats.fulfillment + eventResolution.stats.fulfillment,
    social: actionResolution.stats.social + eventResolution.stats.social,
    semesterAcademics:
      course.academicGain +
      course.directRollCallPenalty +
      actionResolution.stats.semesterAcademics +
      eventResolution.stats.semesterAcademics,
  };
  const statsAfter = addStats(statsBefore, statsDelta);
  const riskAfter = mergeRisk(preEventRun.risk, eventResolution.risk);
  const updatedRun: GameRun = {
    ...run,
    ...nextCalendar(run),
    stats: statsAfter,
    risk: riskAfter,
    cooldowns: nextCooldowns(run, actionResolution.askFamilyUsed),
    resume: [...run.resume, ...actionResolution.resumeAdditions, ...eventResolution.resumeAdditions],
    riskFlags: deriveMonthlyRiskFlags({
      ...run,
      stats: statsAfter,
      risk: riskAfter,
    }),
  };
  const summary = {
    month: run.currentMonth,
    actions: plan.actions.map((item) => item.action),
    attendanceStrategy: plan.attendanceStrategy,
    schedule,
    statsBefore,
    statsAfter,
    statsDelta,
    moneyDelta: totalMoneyDelta,
    academicFeedback: evaluateSemesterFeedback(Math.max(0, statsAfter.semesterAcademics - riskAfter.academicRisk)),
    eventIds: eventResolution.eventIds,
    resumeAdditions: [...actionResolution.resumeAdditions, ...eventResolution.resumeAdditions],
    notableFacts: [
      `allowance:${run.profile.monthlyAllowance}`,
      ...eventResolution.notableFacts,
    ],
    resolvedActions: actionResolution.resolvedActions,
    flags: dedupe([...actionResolution.flags, ...eventResolution.flags]),
    cooldowns: updatedRun.cooldowns,
    course,
  };

  const runWithSummary: GameRun = {
    ...updatedRun,
    monthlySummaries: [...updatedRun.monthlySummaries, summary],
    logLineIds: [
      ...updatedRun.logLineIds,
      ...summary.eventIds,
      ...summary.flags,
    ],
  };

  return {
    run: runWithSummary,
    summary,
  };
}

export { createInitialGameRun, createMonthlySchedule, evaluateGraduationOutcome, settleSemester };

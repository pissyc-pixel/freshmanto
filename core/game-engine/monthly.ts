import { createInitialGameRun } from "@/core/generators";
import { resolveActionPlan } from "@/core/resolvers/actions";
import { resolveCourseStrategy } from "@/core/resolvers/attendance";
import { resolveMonthEvents } from "@/core/resolvers/events";
import { createMonthlySchedule, createWeeklyCalendar } from "@/core/resolvers/schedule";
import { evaluateGraduationOutcome, evaluateSemesterFeedback, settleSemester } from "@/core/resolvers/semester";
import type {
  ActionTurnPlan,
  ActionTurnSummary,
  ActiveMonthState,
  CooldownState,
  CourseResolution,
  DynamicStats,
  GameRun,
  MonthlyActionPlan,
  ResolvedMonthResult,
  ResolvedTurnResult,
  RiskState,
  StructuredMonthlySummary,
} from "@/types/game";

const WEEKS_PER_MONTH = 4;
const DEFAULT_BATCH_ACTION: ActionTurnPlan["action"] = { action: "relax", time: "night" };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneStats(stats: DynamicStats): DynamicStats {
  return {
    money: stats.money,
    mood: stats.mood,
    stress: stats.stress,
    fulfillment: stats.fulfillment,
    social: stats.social,
    semesterAcademics: stats.semesterAcademics,
  };
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

function diffStats(before: DynamicStats, after: DynamicStats): DynamicStats {
  return {
    money: after.money - before.money,
    mood: after.mood - before.mood,
    stress: after.stress - before.stress,
    fulfillment: after.fulfillment - before.fulfillment,
    social: after.social - before.social,
    semesterAcademics: after.semesterAcademics - before.semesterAcademics,
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

function updateCooldownsDuringMonth(run: GameRun, askFamilyUsed: boolean): CooldownState {
  if (askFamilyUsed) {
    return {
      askFamilyMonths: 1,
    };
  }

  return run.cooldowns;
}

function finalizeCooldowns(monthStartCooldowns: CooldownState, askFamilyUsed: boolean): CooldownState {
  if (askFamilyUsed) {
    return {
      askFamilyMonths: 1,
    };
  }

  return {
    askFamilyMonths: Math.max(0, monthStartCooldowns.askFamilyMonths - 1),
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

function ensureActiveMonth(run: GameRun): ActiveMonthState {
  if (run.activeMonth && run.activeMonth.year === run.currentYear && run.activeMonth.month === run.currentMonth) {
    return run.activeMonth;
  }

  return {
    year: run.currentYear,
    month: run.currentMonth,
    currentWeek: 1,
    totalWeeks: WEEKS_PER_MONTH,
    allowanceApplied: false,
    cooldownsAtStart: { ...run.cooldowns },
    weeklyCalendar: createWeeklyCalendar(run.currentMonth),
    statsAtStart: cloneStats(run.stats),
    turns: [],
  };
}

function createInstantCourseResolution(strategy: CourseResolution["strategy"]): CourseResolution {
  return {
    strategy,
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 0,
    usualScoreRiskDelta: 0,
    proxyCost: 0,
    remedyPressure: 0,
    academicRiskDelta: 0,
    academicGain: 0,
    moodDelta: 0,
    stressDelta: 0,
  };
}

function aggregateCourse(turns: ActionTurnSummary[]): CourseResolution {
  const latest = turns.at(-1)?.course ?? resolveCourseStrategy("mixed");

  return turns.reduce<CourseResolution>(
    (summary, turn, index) => ({
      strategy: index === turns.length - 1 ? turn.course.strategy : summary.strategy,
      attendanceCounted: summary.attendanceCounted && turn.course.attendanceCounted,
      directRollCallPenalty: summary.directRollCallPenalty + turn.course.directRollCallPenalty,
      rollCallRiskDelta: summary.rollCallRiskDelta + turn.course.rollCallRiskDelta,
      usualScoreRiskDelta: summary.usualScoreRiskDelta + turn.course.usualScoreRiskDelta,
      proxyCost: summary.proxyCost + turn.course.proxyCost,
      remedyPressure: summary.remedyPressure + turn.course.remedyPressure,
      academicRiskDelta: summary.academicRiskDelta + turn.course.academicRiskDelta,
      academicGain: summary.academicGain + turn.course.academicGain,
      moodDelta: summary.moodDelta + turn.course.moodDelta,
      stressDelta: summary.stressDelta + turn.course.stressDelta,
      note: turn.course.note,
    }),
    {
      ...latest,
      attendanceCounted: true,
      directRollCallPenalty: 0,
      rollCallRiskDelta: 0,
      usualScoreRiskDelta: 0,
      proxyCost: 0,
      remedyPressure: 0,
      academicRiskDelta: 0,
      academicGain: 0,
      moodDelta: 0,
      stressDelta: 0,
      note: latest.note,
    },
  );
}

function buildMonthlySummary(input: {
  runBeforeMonth: GameRun;
  runAfterTurns: GameRun;
  activeMonth: ActiveMonthState;
  eventIds: string[];
  eventFlags: string[];
  eventFacts: string[];
  eventResumeAdditions: StructuredMonthlySummary["resumeAdditions"];
  eventStats: DynamicStats;
  eventMoneyDelta: number;
  eventRisk: RiskState;
}): StructuredMonthlySummary {
  const statsAfterEvents = addStats(input.runAfterTurns.stats, {
    money: input.eventMoneyDelta + input.eventStats.money,
    mood: input.eventStats.mood,
    stress: input.eventStats.stress,
    fulfillment: input.eventStats.fulfillment,
    social: input.eventStats.social,
    semesterAcademics: input.eventStats.semesterAcademics,
  });
  const riskAfterEvents = mergeRisk(input.runAfterTurns.risk, input.eventRisk);
  const statsBefore = input.activeMonth.statsAtStart;
  const statsDelta = diffStats(statsBefore, statsAfterEvents);
  const turns = input.activeMonth.turns;
  const latestAttendanceStrategy = turns.at(-1)?.attendanceStrategy ?? "mixed";
  const turnResumeAdditions = input.runAfterTurns.resume.slice(input.runBeforeMonth.resume.length);

  return {
    month: input.runBeforeMonth.currentMonth,
    actions: turns.map((turn) => turn.resolvedAction.action),
    attendanceStrategy: latestAttendanceStrategy,
    schedule: createMonthlySchedule(input.runBeforeMonth.currentMonth),
    weeklyCalendar: input.activeMonth.weeklyCalendar,
    statsBefore,
    statsAfter: statsAfterEvents,
    statsDelta,
    moneyDelta: statsDelta.money,
    academicFeedback: evaluateSemesterFeedback(
      Math.max(0, statsAfterEvents.semesterAcademics - riskAfterEvents.academicRisk),
    ),
    eventIds: input.eventIds,
    resumeAdditions: [...turnResumeAdditions, ...input.eventResumeAdditions],
    notableFacts: dedupe([
      ...turns.flatMap((turn) => turn.notableFacts),
      ...input.eventFacts,
    ]),
    resolvedActions: turns.map((turn) => turn.resolvedAction),
    flags: dedupe([
      ...turns.flatMap((turn) => turn.flags),
      ...input.eventFlags,
    ]),
    cooldowns: input.runAfterTurns.cooldowns,
    course: aggregateCourse(turns),
    turns,
  };
}

export function resolveActionTurn(run: GameRun, plan: ActionTurnPlan): ResolvedTurnResult {
  const activeMonth = ensureActiveMonth(run);
  const week = activeMonth.weeklyCalendar[activeMonth.currentWeek - 1];
  const advancesCalendar = plan.action.action !== "big_meal";

  if (!week) {
    throw new Error(`Month ${run.currentMonth} has no remaining weekly turns.`);
  }

  const statsBefore = run.stats;
  const allowanceDelta = activeMonth.allowanceApplied ? 0 : run.profile.monthlyAllowance;
  const course = advancesCalendar
    ? resolveCourseStrategy(plan.attendanceStrategy)
    : createInstantCourseResolution(plan.attendanceStrategy);
  const actionResolution = resolveActionPlan(run, {
    attendanceStrategy: plan.attendanceStrategy,
    actions: [plan.action],
  });
  const statsDelta: DynamicStats = {
    money: allowanceDelta + actionResolution.moneyDelta + actionResolution.stats.money - course.proxyCost,
    mood: course.moodDelta + actionResolution.stats.mood,
    stress: course.stressDelta + actionResolution.stats.stress,
    fulfillment: actionResolution.stats.fulfillment,
    social: actionResolution.stats.social,
    semesterAcademics: course.academicGain + actionResolution.stats.semesterAcademics,
  };
  const statsAfter = addStats(statsBefore, statsDelta);
  const riskAfter = mergeRisk(run.risk, {
    academicRisk: course.academicRiskDelta + actionResolution.risk.academicRisk,
    burnout: actionResolution.risk.burnout + Math.max(0, Math.round(course.stressDelta / 4)),
  });
  const resolvedAction = actionResolution.resolvedActions[0] ?? {
    ...plan.action,
    accepted: false,
    reason: "turn-resolution-missing",
  };
  const turnSummary: ActionTurnSummary = {
    turn: activeMonth.turns.length + 1,
    week: week.week,
    slotLabel: week.label,
    advancesCalendar,
    attendanceStrategy: plan.attendanceStrategy,
    chosenAction: plan.action,
    resolvedAction,
    statsBefore,
    statsAfter,
    statsDelta,
    moneyDelta: statsDelta.money,
    flags: dedupe(actionResolution.flags),
    notableFacts: dedupe([
      allowanceDelta > 0 ? `allowance:${allowanceDelta}` : "",
      course.note ?? "",
      course.rollCallRiskDelta > 0 ? `roll-call-risk:${course.rollCallRiskDelta}` : "",
      course.usualScoreRiskDelta > 0 ? `usual-score-risk:${course.usualScoreRiskDelta}` : "",
      course.proxyCost > 0 ? `proxy-cost:${course.proxyCost}` : "",
      course.remedyPressure > 0 ? `remedy-pressure:${course.remedyPressure}` : "",
    ].filter(Boolean)),
    allowanceApplied: allowanceDelta > 0,
    course,
  };
  const updatedActiveMonth: ActiveMonthState = {
    ...activeMonth,
    allowanceApplied: true,
    currentWeek: activeMonth.currentWeek + (advancesCalendar ? 1 : 0),
    turns: [...activeMonth.turns, turnSummary],
    lastResolvedTurn: turnSummary,
  };
  const updatedRun: GameRun = {
    ...run,
    stats: statsAfter,
    risk: riskAfter,
    cooldowns: updateCooldownsDuringMonth(run, actionResolution.askFamilyUsed),
    resume: [...run.resume, ...actionResolution.resumeAdditions],
    riskFlags: deriveMonthlyRiskFlags({
      ...run,
      stats: statsAfter,
      risk: riskAfter,
    }),
    activeMonth: updatedActiveMonth,
  };

  if (updatedActiveMonth.currentWeek <= updatedActiveMonth.totalWeeks) {
    return {
      run: updatedRun,
      turnSummary,
      monthCompleted: false,
    };
  }

  const eventResolution = resolveMonthEvents(updatedRun, run.currentMonth);
  const summary = buildMonthlySummary({
    runBeforeMonth: run,
    runAfterTurns: updatedRun,
    activeMonth: updatedActiveMonth,
    eventIds: eventResolution.eventIds,
    eventFlags: eventResolution.flags,
    eventFacts: eventResolution.notableFacts,
    eventResumeAdditions: eventResolution.resumeAdditions,
    eventStats: eventResolution.stats,
    eventMoneyDelta: eventResolution.moneyDelta,
    eventRisk: eventResolution.risk,
  });
  const finalStatsAfter = summary.statsAfter;
  const finalRiskAfter = mergeRisk(updatedRun.risk, eventResolution.risk);
  const askFamilyUsedThisMonth = updatedActiveMonth.turns.some(
    (turn) => turn.resolvedAction.action === "ask_family" && turn.resolvedAction.accepted,
  );
  const finalizedCooldowns = finalizeCooldowns(updatedActiveMonth.cooldownsAtStart, askFamilyUsedThisMonth);
  const monthAdvancedRun: GameRun = {
    ...updatedRun,
    ...nextCalendar(run),
    stats: finalStatsAfter,
    risk: finalRiskAfter,
    activeMonth: undefined,
    cooldowns: finalizedCooldowns,
    resume: [...updatedRun.resume, ...eventResolution.resumeAdditions],
    riskFlags: deriveMonthlyRiskFlags({
      ...updatedRun,
      stats: finalStatsAfter,
      risk: finalRiskAfter,
    }),
  };
  const runWithSummary: GameRun = {
    ...monthAdvancedRun,
    monthlySummaries: [...monthAdvancedRun.monthlySummaries, summary],
    logLineIds: [
      ...monthAdvancedRun.logLineIds,
      ...summary.eventIds,
      ...summary.flags,
    ],
  };
  runWithSummary.monthlySummaries[runWithSummary.monthlySummaries.length - 1] = {
    ...summary,
    cooldowns: finalizedCooldowns,
  };

  return {
    run: runWithSummary,
    turnSummary,
    monthCompleted: true,
    monthlySummary: summary,
  };
}

export function resolveMonthlyTurn(run: GameRun, plan: MonthlyActionPlan): ResolvedMonthResult {
  const queuedActions = [...(plan.actions.length > 0 ? plan.actions : [DEFAULT_BATCH_ACTION])];

  let nextRun = run;
  let monthlySummary: StructuredMonthlySummary | undefined;
  let cursor = 0;

  while (!monthlySummary) {
    const action = queuedActions[cursor] ?? DEFAULT_BATCH_ACTION;
    const result = resolveActionTurn(nextRun, {
      attendanceStrategy: plan.attendanceStrategy,
      action,
    });

    nextRun = result.run;
    monthlySummary = result.monthlySummary;
    cursor += 1;

    if (!result.turnSummary.advancesCalendar && cursor >= queuedActions.length) {
      queuedActions.push(DEFAULT_BATCH_ACTION);
    }

    if (cursor > WEEKS_PER_MONTH * 3) {
      throw new Error("Monthly resolution exceeded the expected weekly turn count.");
    }
  }

  return {
    run: nextRun,
    summary: monthlySummary,
  };
}

export {
  createInitialGameRun,
  createMonthlySchedule,
  createWeeklyCalendar,
  evaluateGraduationOutcome,
  settleSemester,
};

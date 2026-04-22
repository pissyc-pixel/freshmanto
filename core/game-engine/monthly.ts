import { createInitialGameRun } from "@/core/generators";
import { resolveActionPlan } from "@/core/resolvers/actions";
import { resolveCourseStrategy } from "@/core/resolvers/attendance";
import { resolveMonthEvents } from "@/core/resolvers/events";
import {
  createMonthlySchedule,
  createWeekTimeState,
  createWeeklyCalendar,
  getActionTimeCost,
  releaseSkippedClassDays,
} from "@/core/resolvers/schedule";
import { evaluateGraduationOutcome, evaluateSemesterFeedback, settleSemester } from "@/core/resolvers/semester";
import type {
  ActionTurnPlan,
  ActionTurnSummary,
  ActiveMonthState,
  CooldownState,
  CourseAttendanceStrategy,
  CourseResolution,
  DynamicStats,
  GameRun,
  MonthlyActionPlan,
  ResolvedTurnResult,
  RiskState,
  StructuredMonthlySummary,
} from "@/types/game";

const WEEKS_PER_MONTH = 4;

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

function emptyStatsDelta(): DynamicStats {
  return {
    money: 0,
    mood: 0,
    stress: 0,
    fulfillment: 0,
    social: 0,
    semesterAcademics: 0,
  };
}

function emptyRiskDelta(): RiskState {
  return {
    academicRisk: 0,
    burnout: 0,
  };
}

function createEmptyActionResolution(): ReturnType<typeof resolveActionPlan> {
  return {
    stats: emptyStatsDelta(),
    moneyDelta: 0,
    risk: emptyRiskDelta(),
    resolvedActions: [],
    flags: [],
    resumeAdditions: [],
    askFamilyUsed: false,
  };
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

  const weeklyCalendar = createWeeklyCalendar(run.currentMonth);

  return {
    year: run.currentYear,
    month: run.currentMonth,
    currentWeek: 1,
    totalWeeks: WEEKS_PER_MONTH,
    allowanceApplied: false,
    cooldownsAtStart: { ...run.cooldowns },
    weeklyCalendar,
    currentWeekState: createWeekTimeState(weeklyCalendar[0], "mixed"),
    completedWeeks: [],
    statsAtStart: cloneStats(run.stats),
    turns: [],
  };
}

function createInstantCourseResolution(strategy: CourseAttendanceStrategy): CourseResolution {
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

function createCourseStatsDelta(course: CourseResolution, allowanceDelta = 0): DynamicStats {
  return {
    money: allowanceDelta - course.proxyCost,
    mood: course.moodDelta,
    stress: course.stressDelta,
    fulfillment: 0,
    social: 0,
    semesterAcademics: course.academicGain,
  };
}

function aggregateCourse(completedWeeks: ActiveMonthState["completedWeeks"]): CourseResolution {
  const latest = completedWeeks.at(-1)?.course ?? resolveCourseStrategy("mixed");

  return completedWeeks.reduce<CourseResolution>(
    (summary, completedWeek, index) => ({
      strategy: index === completedWeeks.length - 1 ? completedWeek.attendanceStrategy : summary.strategy,
      attendanceCounted: summary.attendanceCounted && completedWeek.course.attendanceCounted,
      directRollCallPenalty: summary.directRollCallPenalty + completedWeek.course.directRollCallPenalty,
      rollCallRiskDelta: summary.rollCallRiskDelta + completedWeek.course.rollCallRiskDelta,
      usualScoreRiskDelta: summary.usualScoreRiskDelta + completedWeek.course.usualScoreRiskDelta,
      proxyCost: summary.proxyCost + completedWeek.course.proxyCost,
      remedyPressure: summary.remedyPressure + completedWeek.course.remedyPressure,
      academicRiskDelta: summary.academicRiskDelta + completedWeek.course.academicRiskDelta,
      academicGain: summary.academicGain + completedWeek.course.academicGain,
      moodDelta: summary.moodDelta + completedWeek.course.moodDelta,
      stressDelta: summary.stressDelta + completedWeek.course.stressDelta,
      note: completedWeek.course.note ?? summary.note,
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
  const latestAttendanceStrategy =
    input.activeMonth.completedWeeks.at(-1)?.attendanceStrategy ??
    turns.at(-1)?.attendanceStrategy ??
    "mixed";
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
    course: aggregateCourse(input.activeMonth.completedWeeks),
    turns,
  };
}

function applyCourseToTurnSummary(turnSummary: ActionTurnSummary, course: CourseResolution): ActionTurnSummary {
  const statsAfter = addStats(turnSummary.statsAfter, createCourseStatsDelta(course));

  return {
    ...turnSummary,
    statsAfter,
    statsDelta: diffStats(turnSummary.statsBefore, statsAfter),
    moneyDelta: statsAfter.money - turnSummary.statsBefore.money,
    notableFacts: dedupe([
      ...turnSummary.notableFacts,
      course.note ?? "",
      course.rollCallRiskDelta > 0 ? `roll-call-risk:${course.rollCallRiskDelta}` : "",
      course.usualScoreRiskDelta > 0 ? `usual-score-risk:${course.usualScoreRiskDelta}` : "",
      course.proxyCost > 0 ? `proxy-cost:${course.proxyCost}` : "",
      course.remedyPressure > 0 ? `remedy-pressure:${course.remedyPressure}` : "",
    ].filter(Boolean)),
    course,
    weekTimeAfter: 0,
    weekCompleted: true,
  };
}

function finalizeCurrentWeek(input: {
  runBeforeMonth: GameRun;
  run: GameRun;
  activeMonth: ActiveMonthState;
  attendanceStrategy: CourseAttendanceStrategy;
  endedEarly: boolean;
  attachCourseToLastTurn: boolean;
}) {
  const allowanceDelta = input.activeMonth.allowanceApplied ? 0 : input.run.profile.monthlyAllowance;
  const course = resolveCourseStrategy(input.attendanceStrategy, {
    skippedClassDays: input.activeMonth.currentWeekState.releasedClassDays,
  });
  const statsAfter = addStats(input.run.stats, createCourseStatsDelta(course, allowanceDelta));
  const riskAfter = mergeRisk(input.run.risk, {
    academicRisk: course.academicRiskDelta,
    burnout: Math.max(0, Math.round(course.stressDelta / 4)),
  });
  let turns = input.activeMonth.turns;
  let lastResolvedTurn = input.activeMonth.lastResolvedTurn;

  if (input.attachCourseToLastTurn && turns.length > 0) {
    const updatedLastTurn = applyCourseToTurnSummary(turns[turns.length - 1], course);
    turns = [...turns.slice(0, -1), updatedLastTurn];
    lastResolvedTurn = updatedLastTurn;
  }

  const completedWeek = {
    week: input.activeMonth.currentWeekState.week,
    attendanceStrategy: input.attendanceStrategy,
    course,
    releasedClassDays: [...input.activeMonth.currentWeekState.releasedClassDays],
    endedEarly: input.endedEarly,
  };
  const settledMonth: ActiveMonthState = {
    ...input.activeMonth,
    allowanceApplied: true,
    completedWeeks: [...input.activeMonth.completedWeeks, completedWeek],
    turns,
    lastResolvedTurn,
  };
  const runAfterWeek: GameRun = {
    ...input.run,
    stats: statsAfter,
    risk: riskAfter,
    riskFlags: deriveMonthlyRiskFlags({
      ...input.run,
      stats: statsAfter,
      risk: riskAfter,
    }),
    activeMonth: settledMonth,
  };

  if (settledMonth.currentWeek < settledMonth.totalWeeks) {
    const nextWeek = settledMonth.weeklyCalendar[settledMonth.currentWeek];

    if (!nextWeek) {
      throw new Error(`Week ${settledMonth.currentWeek + 1} is missing from the calendar.`);
    }

    const nextActiveMonth: ActiveMonthState = {
      ...settledMonth,
      currentWeek: settledMonth.currentWeek + 1,
      currentWeekState: createWeekTimeState(nextWeek, input.attendanceStrategy),
    };

    return {
      run: {
        ...runAfterWeek,
        activeMonth: nextActiveMonth,
      },
      monthCompleted: false,
    };
  }

  const eventResolution = resolveMonthEvents(runAfterWeek, input.runBeforeMonth.currentMonth);
  const summary = buildMonthlySummary({
    runBeforeMonth: input.runBeforeMonth,
    runAfterTurns: runAfterWeek,
    activeMonth: settledMonth,
    eventIds: eventResolution.eventIds,
    eventFlags: eventResolution.flags,
    eventFacts: eventResolution.notableFacts,
    eventResumeAdditions: eventResolution.resumeAdditions,
    eventStats: eventResolution.stats,
    eventMoneyDelta: eventResolution.moneyDelta,
    eventRisk: eventResolution.risk,
  });
  const finalStatsAfter = summary.statsAfter;
  const finalRiskAfter = mergeRisk(runAfterWeek.risk, eventResolution.risk);
  const askFamilyUsedThisMonth = settledMonth.turns.some(
    (turn) => turn.resolvedAction.action === "ask_family" && turn.resolvedAction.accepted,
  );
  const finalizedCooldowns = finalizeCooldowns(settledMonth.cooldownsAtStart, askFamilyUsedThisMonth);
  const monthAdvancedRun: GameRun = {
    ...runAfterWeek,
    ...nextCalendar(input.runBeforeMonth),
    stats: finalStatsAfter,
    risk: finalRiskAfter,
    activeMonth: undefined,
    cooldowns: finalizedCooldowns,
    resume: [...runAfterWeek.resume, ...eventResolution.resumeAdditions],
    riskFlags: deriveMonthlyRiskFlags({
      ...runAfterWeek,
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
    monthCompleted: true,
    monthlySummary: summary,
  };
}

export function resolveActionTurn(run: GameRun, plan: ActionTurnPlan): ResolvedTurnResult {
  const activeMonth = ensureActiveMonth(run);
  const week = activeMonth.weeklyCalendar[activeMonth.currentWeek - 1];

  if (!week) {
    throw new Error(`Month ${run.currentMonth} has no remaining weekly turns.`);
  }

  const timeCost = getActionTimeCost(plan.action.action);
  const weekTimeBefore = activeMonth.currentWeekState.remainingTimeUnits;
  const allowanceDelta = activeMonth.allowanceApplied ? 0 : run.profile.monthlyAllowance;
  const initialActionResolution = resolveActionPlan(run, {
    attendanceStrategy: plan.attendanceStrategy,
    actions: [plan.action],
  });
  const initialResolvedAction = initialActionResolution.resolvedActions[0] ?? {
    ...plan.action,
    accepted: false,
    reason: "turn-resolution-missing",
  };
  const rejectedForTime = initialResolvedAction.accepted && timeCost > weekTimeBefore;
  const actionResolution =
    rejectedForTime
      ? createEmptyActionResolution()
      : initialActionResolution;
  const resolvedAction = rejectedForTime
    ? {
        ...plan.action,
        accepted: false,
        reason: "insufficient-week-time",
      }
    : initialResolvedAction;
  const effectiveTimeCost = resolvedAction.accepted ? timeCost : 0;
  const skipClassRelease =
    resolvedAction.accepted && plan.action.action === "skip_class"
      ? releaseSkippedClassDays({
          week,
          requestedDays: plan.action.skipClassDays ?? [],
          releasedClassDays: activeMonth.currentWeekState.releasedClassDays,
        })
      : {
          newlyReleasedDays: [] as string[],
          releasedClassDays: activeMonth.currentWeekState.releasedClassDays,
          reclaimedTimeUnits: 0,
        };
  const weekTimeAfter = Math.max(0, weekTimeBefore - effectiveTimeCost + skipClassRelease.reclaimedTimeUnits);
  const statsBefore = run.stats;
  const statsDelta: DynamicStats = {
    money: allowanceDelta + actionResolution.moneyDelta + actionResolution.stats.money,
    mood: actionResolution.stats.mood,
    stress: actionResolution.stats.stress,
    fulfillment: actionResolution.stats.fulfillment,
    social: actionResolution.stats.social,
    semesterAcademics: actionResolution.stats.semesterAcademics,
  };
  const statsAfter = addStats(statsBefore, statsDelta);
  const riskAfter = mergeRisk(run.risk, actionResolution.risk);
  const flags = dedupe([
    ...actionResolution.flags,
    rejectedForTime ? "insufficient-week-time" : "",
  ].filter(Boolean));
  const notableFacts = dedupe([
    allowanceDelta > 0 ? `allowance:${allowanceDelta}` : "",
    skipClassRelease.newlyReleasedDays.length > 0
      ? `skip_class released ${skipClassRelease.newlyReleasedDays.join(", ")} daytime blocks`
      : "",
  ].filter(Boolean));
  const turnSummary: ActionTurnSummary = {
    turn: activeMonth.turns.length + 1,
    week: week.week,
    slotLabel: week.label,
    advancesCalendar: effectiveTimeCost > 0,
    attendanceStrategy: plan.attendanceStrategy,
    chosenAction: plan.action,
    resolvedAction,
    statsBefore,
    statsAfter,
    statsDelta,
    moneyDelta: statsDelta.money,
    flags,
    notableFacts,
    allowanceApplied: allowanceDelta > 0,
    course: createInstantCourseResolution(plan.attendanceStrategy),
    timeCost: effectiveTimeCost,
    weekTimeBefore,
    weekTimeAfter,
    releasedClassDays: skipClassRelease.releasedClassDays,
    weekCompleted: false,
  };
  const updatedActiveMonth: ActiveMonthState = {
    ...activeMonth,
    allowanceApplied: true,
    turns: [...activeMonth.turns, turnSummary],
    lastResolvedTurn: turnSummary,
    currentWeekState: {
      ...activeMonth.currentWeekState,
      attendanceStrategy: plan.attendanceStrategy,
      totalTimeUnits: activeMonth.currentWeekState.totalTimeUnits + skipClassRelease.reclaimedTimeUnits,
      remainingTimeUnits: weekTimeAfter,
      releasedClassDays: skipClassRelease.releasedClassDays,
    },
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

  if (weekTimeAfter > 0) {
    return {
      run: updatedRun,
      turnSummary,
      monthCompleted: false,
    };
  }

  const finalized = finalizeCurrentWeek({
    runBeforeMonth: run,
    run: updatedRun,
    activeMonth: updatedActiveMonth,
    attendanceStrategy: plan.attendanceStrategy,
    endedEarly: false,
    attachCourseToLastTurn: true,
  });
  const finalizedTurnSummary =
    finalized.run.activeMonth?.lastResolvedTurn ??
    finalized.monthlySummary?.turns.at(-1) ??
    turnSummary;

  return {
    run: finalized.run,
    turnSummary: finalizedTurnSummary,
    monthCompleted: finalized.monthCompleted,
    monthlySummary: finalized.monthlySummary,
  };
}

export function resolveWeekEnd(
  run: GameRun,
  attendanceStrategy: CourseAttendanceStrategy,
): {
  run: GameRun;
  monthCompleted: boolean;
  monthlySummary?: StructuredMonthlySummary;
} {
  const activeMonth = ensureActiveMonth(run);

  return finalizeCurrentWeek({
    runBeforeMonth: run,
    run: {
      ...run,
      activeMonth,
    },
    activeMonth: {
      ...activeMonth,
      currentWeekState: {
        ...activeMonth.currentWeekState,
        attendanceStrategy,
      },
    },
    attendanceStrategy,
    endedEarly: activeMonth.currentWeekState.remainingTimeUnits > 0,
    attachCourseToLastTurn: false,
  });
}

export function resolveMonthlyTurn(run: GameRun, plan: MonthlyActionPlan) {
  const queuedActions = [...plan.actions];
  let nextRun = run;
  let monthlySummary: StructuredMonthlySummary | undefined;
  let cursor = 0;

  while (!monthlySummary) {
    const action = queuedActions[cursor];

    if (action) {
      const result = resolveActionTurn(nextRun, {
        attendanceStrategy: plan.attendanceStrategy,
        action,
      });

      nextRun = result.run;
      monthlySummary = result.monthlySummary;
      cursor += 1;
    } else {
      const result = resolveWeekEnd(nextRun, plan.attendanceStrategy);

      nextRun = result.run;
      monthlySummary = result.monthlySummary;
    }

    if (cursor > WEEKS_PER_MONTH * 12) {
      throw new Error("Monthly resolution exceeded the expected number of action steps.");
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

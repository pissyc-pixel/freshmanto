import { createInitialGameRun } from "@/core/generators";
import { resolveActionPlan } from "@/core/resolvers/actions";
import { resolveCourseStrategy } from "@/core/resolvers/attendance";
import { resolveMonthEvents } from "@/core/resolvers/events";
import {
  activateCompetitionProject,
  applyAcceptedActionProgression,
  closeCompetitionProject,
  ensureProgressionState,
} from "@/core/resolvers/progression";
import { findWeeklyEventBoost, resolveWeeklyEvent } from "@/core/resolvers/weekly-events";
import { findWeeklyActionOption } from "@/data/actions";
import { getWeeklyAllowance, getWeeklyLivingExpense } from "@/data/events";
import {
  buildPlannerWeekdays,
  createMonthlySchedule,
  createWeekTimeState,
  createWeeklyCalendar,
  getActionTimeCost,
  getWeeklyDayLabel,
  isWeekReadyToConfirm,
  releaseSkippedClassDays,
  resolveAvailableWeeklyActions,
  resolveEffectiveDayType,
} from "@/core/resolvers/schedule";
import { evaluateGraduationOutcome, evaluateSemesterFeedback, settleSemester } from "@/core/resolvers/semester";
import type {
  ActionTurnPlan,
  ActionTurnSummary,
  ActiveMonthState,
  ActiveWeekState,
  CooldownState,
  CourseAttendanceStrategy,
  CourseResolution,
  DynamicStats,
  GameRun,
  MonthlyActionPlan,
  PlannedAction,
  PlannedWeekdayState,
  ResolvedTurnResult,
  RiskState,
  StructuredMonthlySummary,
  WeeklyActionEffect,
  WeeklyActionOption,
  WeeklySettlementSummary,
  Weekday,
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

function sumStats(base: DynamicStats, addition: Partial<DynamicStats> | undefined): DynamicStats {
  if (!addition) {
    return base;
  }

  return {
    money: base.money + (addition.money ?? 0),
    mood: base.mood + (addition.mood ?? 0),
    stress: base.stress + (addition.stress ?? 0),
    fulfillment: base.fulfillment + (addition.fulfillment ?? 0),
    social: base.social + (addition.social ?? 0),
    semesterAcademics: base.semesterAcademics + (addition.semesterAcademics ?? 0),
  };
}

function sumRisk(base: RiskState, addition: Partial<RiskState> | undefined): RiskState {
  if (!addition) {
    return base;
  }

  return {
    academicRisk: base.academicRisk + (addition.academicRisk ?? 0),
    burnout: base.burnout + (addition.burnout ?? 0),
  };
}

function createPlannerFeedback(
  kind: NonNullable<ActiveWeekState["plannerFeedback"]>["kind"],
  title: string,
  message: string,
) {
  return { kind, title, message };
}

function hasWeeklyCashPlan(weekState: ActiveWeekState): boolean {
  return (weekState.days ?? []).some((day) => {
    const action = day.plannedAction?.action;
    return action === "part_time" || action === "ask_family";
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildWeeklyCashWarnings(run: GameRun, weekState: ActiveWeekState): string[] {
  const weeklyLivingExpense = getWeeklyLivingExpense(run);
  const warnings: string[] = [];

  if (run.stats.money < 0) {
    warnings.push("当前现金已经是负数了，下周固定生活开销会继续把压力往上推。");
  }

  if (!hasWeeklyCashPlan(weekState) && run.stats.money < weeklyLivingExpense) {
    warnings.push(`按你现在的现金，下周 ${weeklyLivingExpense} 元左右的固定开销会很吃紧；如果这周不安排赚钱或找家里要钱，现金会继续恶化。`);
  }

  if (!hasWeeklyCashPlan(weekState) && run.stats.money <= weeklyLivingExpense + 300) {
    warnings.push("手头现金已经贴近危险线了，这周最好至少留一个补现金的动作。");
  }

  return warnings;
}

function buildDetailedWeeklyCashWarnings(run: GameRun, weekState: ActiveWeekState): string[] {
  const weeklyLivingExpense = getWeeklyLivingExpense(run);
  const warnings: string[] = [];
  const shortfall = Math.max(0, weeklyLivingExpense - run.stats.money);

  if (run.stats.money < 0) {
    warnings.push(
      `当前现金 ${run.stats.money} 元，已经是负数；下周固定生活开销约 ${weeklyLivingExpense} 元，现金压力会继续往上推。建议优先安排兼职 / 赚钱、控制支出，或者尽快寻求家里支持。`,
    );
  }

  if (!hasWeeklyCashPlan(weekState) && run.stats.money < weeklyLivingExpense) {
    warnings.push(
      `当前现金 ${run.stats.money} 元，下周固定生活开销约 ${weeklyLivingExpense} 元，缺口大约 ${shortfall} 元。如果这周不提前安排兼职 / 赚钱、控制支出，或者寻求家里支持，现金风险会继续恶化。`,
    );
  }

  if (!hasWeeklyCashPlan(weekState) && run.stats.money <= weeklyLivingExpense + 300) {
    warnings.push("手头现金已经贴近危险线了，这周最好至少留一个补现金的动作，别等到周结算后才发现下周固定开销扛不住。");
  }

  return warnings;
}

function getCurrentWeekTurns(activeMonth: ActiveMonthState): ActionTurnSummary[] {
  return activeMonth.turns.filter((turn) => turn.week === activeMonth.currentWeek);
}

function hydrateLegacyPlannerDays(weekState: ActiveWeekState, activeMonth: ActiveMonthState): PlannedWeekdayState[] {
  const days = weekState.days && weekState.days.length > 0 ? weekState.days : buildPlannerWeekdays({
    week: activeMonth.weeklyCalendar[activeMonth.currentWeek - 1]!,
    event: weekState.event,
    releasedClassDays: weekState.releasedClassDays,
  });
  const legacyTurns = getCurrentWeekTurns(activeMonth);

  if (legacyTurns.length === 0) {
    return days.map((day) => ({
      ...day,
      effectiveDayType: resolveEffectiveDayType({
        day,
        event: weekState.event,
        skipClassSelected: day.skipClassSelected,
      }),
    }));
  }

  let turnCursor = 0;

  return days.map((day) => {
    const turn = legacyTurns[turnCursor];

    if (!turn) {
      return {
        ...day,
        effectiveDayType: resolveEffectiveDayType({
          day,
          event: weekState.event,
          skipClassSelected: day.skipClassSelected,
        }),
      };
    }

    turnCursor += 1;
    const plannedAction = {
      ...turn.chosenAction,
      label: turn.chosenAction.label ?? turn.resolvedAction.label,
      optionId: turn.chosenAction.optionId ?? turn.resolvedAction.optionId ?? turn.chosenAction.action,
      weekday: day.weekday,
      skipClass: day.skipClassSelected,
    };

    return {
      ...day,
      plannedAction,
      effectiveDayType: resolveEffectiveDayType({
        day,
        event: weekState.event,
        skipClassSelected: day.skipClassSelected,
      }),
      planningStatus: "planned",
    };
  });
}

function buildWeekPlanningState(
  run: GameRun,
  weekIndex: number,
  attendanceStrategy: CourseAttendanceStrategy,
  input?: {
    attendanceLocked?: boolean;
    releasedClassDays?: Weekday[];
    plannerFeedback?: ActiveWeekState["plannerFeedback"];
    lastSelectedOptionId?: string;
    existingDays?: PlannedWeekdayState[];
  },
): ActiveWeekState {
  const week = createWeeklyCalendar(run.currentMonth)[weekIndex - 1];

  if (!week) {
    throw new Error(`Week ${weekIndex} is missing from the monthly calendar.`);
  }

  const baseState = createWeekTimeState(week, attendanceStrategy);
  const event = resolveWeeklyEvent(run, week.week);
  const baseDays = buildPlannerWeekdays({
    week,
    event,
    releasedClassDays: input?.releasedClassDays,
  });
  const existingDaysByWeekday = new Map((input?.existingDays ?? []).map((day) => [day.weekday, day]));
  const mergedDays = baseDays.map((day) => {
    const existingDay = existingDaysByWeekday.get(day.weekday);
    const skipClassSelected = existingDay?.skipClassSelected ?? day.skipClassSelected;

    return {
      ...day,
      plannedAction: existingDay?.plannedAction,
      planningStatus: existingDay?.planningStatus ?? day.planningStatus,
      skipClassSelected,
      effectiveDayType: resolveEffectiveDayType({
        day,
        event,
        skipClassSelected,
      }),
    };
  });

  return {
    ...baseState,
    attendanceStrategy,
    attendanceLocked: input?.attendanceLocked ?? false,
    releasedClassDays: input?.releasedClassDays ?? [],
    plannerFeedback: input?.plannerFeedback,
    event,
    days: mergedDays,
    planningWarnings: buildDetailedWeeklyCashWarnings(run, {
      ...baseState,
      attendanceStrategy,
      attendanceLocked: input?.attendanceLocked ?? false,
      releasedClassDays: input?.releasedClassDays ?? [],
      plannerFeedback: input?.plannerFeedback,
      event,
      days: mergedDays,
    }),
    readyToConfirm: Boolean(input?.attendanceLocked) && mergedDays.length > 0,
    lastSelectedOptionId: input?.lastSelectedOptionId,
    lastPlannedWeekday: input?.existingDays?.find((day) => day.plannedAction)?.weekday,
  };
}

function ensurePlanningWeekState(run: GameRun, activeMonth: ActiveMonthState): ActiveWeekState {
  const current = activeMonth.currentWeekState;

  if (current.days && current.days.length > 0 && current.event) {
    const hydratedDays = hydrateLegacyPlannerDays(current, activeMonth);
    return {
      ...current,
      days: hydratedDays,
      planningWarnings: buildDetailedWeeklyCashWarnings(run, {
        ...current,
        days: hydratedDays,
      }),
      readyToConfirm: isWeekReadyToConfirm({
        ...current,
        days: hydratedDays,
      }),
    };
  }

  const rebuilt = buildWeekPlanningState(run, activeMonth.currentWeek, current.attendanceStrategy, {
    attendanceLocked: current.attendanceLocked,
    releasedClassDays: current.releasedClassDays,
    plannerFeedback: current.plannerFeedback,
    lastSelectedOptionId: current.lastSelectedOptionId,
    existingDays: current.days,
  });

  return {
    ...rebuilt,
    days: hydrateLegacyPlannerDays(rebuilt, activeMonth),
    planningWarnings: buildDetailedWeeklyCashWarnings(run, {
      ...rebuilt,
      days: hydrateLegacyPlannerDays(rebuilt, activeMonth),
    }),
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
  const ensuredRun = ensureProgressionState(run);

  if (
    ensuredRun.activeMonth &&
    ensuredRun.activeMonth.year === ensuredRun.currentYear &&
    ensuredRun.activeMonth.month === ensuredRun.currentMonth
  ) {
    return {
      ...ensuredRun.activeMonth,
      currentWeekState: ensurePlanningWeekState(ensuredRun, ensuredRun.activeMonth),
    };
  }

  const weeklyCalendar = createWeeklyCalendar(ensuredRun.currentMonth);

  return {
    year: ensuredRun.currentYear,
    month: ensuredRun.currentMonth,
    currentWeek: 1,
    totalWeeks: WEEKS_PER_MONTH,
    allowanceApplied: false,
    cooldownsAtStart: { ...ensuredRun.cooldowns },
    weeklyCalendar,
    currentWeekState: buildWeekPlanningState(ensuredRun, 1, "mixed"),
    completedWeeks: [],
    statsAtStart: cloneStats(ensuredRun.stats),
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
  const weeklySettlements = input.activeMonth.weeklySettlements
    ?? (input.activeMonth.latestWeekSettlement ? [input.activeMonth.latestWeekSettlement] : undefined);

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
    weeklySettlements,
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
  const weeklySettlementHandled = input.activeMonth.turns.some(
    (turn) => turn.week === input.activeMonth.currentWeek && turn.advancesCalendar,
  );
  const weeklyBudgetDelta = weeklySettlementHandled
    ? 0
    : getWeeklyAllowance(input.run) - getWeeklyLivingExpense(input.run);
  const course = resolveCourseStrategy(input.attendanceStrategy, {
    skippedClassDays: input.activeMonth.currentWeekState.releasedClassDays,
  });
  const statsAfter = addStats(input.run.stats, createCourseStatsDelta(course, weeklyBudgetDelta));
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
      currentWeekState: buildWeekPlanningState(
        runAfterWeek,
        settledMonth.currentWeek + 1,
        input.attendanceStrategy,
      ),
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

function createResumeItemFromWeeklyEffect(
  run: GameRun,
  effect: WeeklyActionEffect | undefined,
): GameRun["resume"] {
  if (!effect?.resume) {
    return [];
  }

  return [
    {
      id: `${run.id}-${run.currentYear}-${run.currentMonth}-${effect.resume.title}`,
      category: effect.resume.category,
      title: effect.resume.title,
      summary: effect.resume.summary,
      month: run.currentMonth,
      tags: effect.resume.tags,
    },
  ];
}

function resolvePlannedActionTime(day: PlannedWeekdayState, option: WeeklyActionOption): PlannedAction["time"] {
  if (day.effectiveDayType === "night_only") {
    return "night";
  }

  return option.availability.includes("night") && !option.availability.includes("half_day") && !option.availability.includes("full_day")
    ? "night"
    : "day";
}

function createSkipClassDayEffect(day: PlannedWeekdayState): WeeklyActionEffect {
  if (!day.skipClassSelected) {
    return {};
  }

  const isHalfDaySkip = day.baseDayType === "half_day";

  return {
    stats: {
      stress: isHalfDaySkip ? 1 : 2,
      semesterAcademics: isHalfDaySkip ? -1 : -2,
    },
    risk: {
      academicRisk: isHalfDaySkip ? 1 : 2,
    },
    flags: ["skip-class-penalty"],
    notableFact: `skip-class:${day.weekday}`,
  };
}

function createAutoFilledIdleAction(day: PlannedWeekdayState): PlannedAction {
  return {
    action: "idle",
    optionId: "idle:auto-fill",
    label: "摆烂 / 发呆",
    time: day.effectiveDayType === "night_only" ? "night" : "day",
    weekday: day.weekday,
    skipClass: false,
    autoFilled: true,
  };
}

function createOptionFromPlannedAction(plannedAction: PlannedAction): WeeklyActionOption {
  return {
    optionId: plannedAction.optionId ?? plannedAction.action,
    action: plannedAction.action,
    label: plannedAction.label ?? plannedAction.action,
    description: plannedAction.autoFilled
      ? "系统自动补成了没有特意安排的一天。"
      : "这是你在本周排程时已经选好的动作，会直接进入统一周结算。",
    availability: ["night", "half_day", "full_day"],
    source: plannedAction.sourceEventId ? "weekly_event" : "default",
    sourceEventId: plannedAction.sourceEventId,
  };
}

function distributeWeeklyLivingCost(total: number, daysCount: number): number[] {
  if (daysCount <= 0) {
    return [];
  }

  const base = Math.floor(total / daysCount);
  const remainder = total - base * daysCount;

  return Array.from({ length: daysCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function applyWeeklyEffectToTurn(
  turnSummary: ActionTurnSummary,
  effect: WeeklyActionEffect | undefined,
): ActionTurnSummary {
  if (!effect) {
    return turnSummary;
  }

  const effectStats = effect.stats ?? {};
  const effectMoney = (effect.money ?? 0) + (effectStats.money ?? 0);
  const statsAfter = addStats(turnSummary.statsAfter, {
    money: effectMoney,
    mood: effectStats.mood ?? 0,
    stress: effectStats.stress ?? 0,
    fulfillment: effectStats.fulfillment ?? 0,
    social: effectStats.social ?? 0,
    semesterAcademics: effectStats.semesterAcademics ?? 0,
  });

  return {
    ...turnSummary,
    statsAfter,
    statsDelta: diffStats(turnSummary.statsBefore, statsAfter),
    moneyDelta: statsAfter.money - turnSummary.statsBefore.money,
    flags: dedupe([...turnSummary.flags, ...(effect.flags ?? [])]),
    notableFacts: dedupe([
      ...turnSummary.notableFacts,
      effect.notableFact ?? "",
    ].filter(Boolean)),
  };
}

function buildWeeklyOpportunities(input: {
  settlement: WeeklySettlementSummary;
  resumeAdded: number;
}): string[] {
  const opportunities: string[] = [];

  if (input.resumeAdded > 0) {
    opportunities.push("这周至少留下了一条能写进履历或成长记录的经历。");
  }

  if (input.settlement.flags.includes("weekly-opportunity:recruitment-talk")) {
    opportunities.push("这周的宣讲把实习线索往前拨了一点，后面找方向会顺手些。");
  }

  if (input.settlement.totals.semesterAcademics >= 6) {
    opportunities.push("学业线确实往上走了一截，下周继续稳住会更值。");
  }

  if (input.settlement.totals.stress >= 8) {
    opportunities.push("压力已经抬得有点明显，下周最好留一点缓冲。");
  }

  return opportunities;
}

function finalizePlannedWeek(input: {
  runBeforeMonth: GameRun;
  run: GameRun;
  activeMonth: ActiveMonthState;
  attendanceStrategy: CourseAttendanceStrategy;
  dayTurns: ActionTurnSummary[];
  resumeAdded: number;
}) {
  const releasedClassDays = input.activeMonth.currentWeekState.days
    ?.filter((day) => day.skipClassSelected)
    .map((day) => day.weekday) ?? [];
  const weeklyAllowance = getWeeklyAllowance(input.run);
  const weeklyLivingExpense = getWeeklyLivingExpense(input.run);
  const weeklyBudgetDelta = weeklyAllowance;
  const course = resolveCourseStrategy(input.attendanceStrategy);
  const statsAfter = addStats(input.run.stats, createCourseStatsDelta(course, weeklyBudgetDelta));
  const riskAfter = mergeRisk(input.run.risk, {
    academicRisk: course.academicRiskDelta,
    burnout: Math.max(0, Math.round(course.stressDelta / 4)),
  });
  const settlementTotals = diffStats(input.runBeforeMonth.stats, statsAfter);
  const settlementRiskDelta = {
    academicRisk: riskAfter.academicRisk - input.runBeforeMonth.risk.academicRisk,
    burnout: riskAfter.burnout - input.runBeforeMonth.risk.burnout,
  };
  const weeklySettlement: WeeklySettlementSummary = {
    week: input.activeMonth.currentWeek,
    attendanceStrategy: input.attendanceStrategy,
    event: input.activeMonth.currentWeekState.event,
    dailyResults: input.dayTurns,
    totals: settlementTotals,
    moneyDelta: settlementTotals.money,
    riskDelta: settlementRiskDelta,
    flags: dedupe(input.dayTurns.flatMap((turn) => turn.flags)),
    opportunities: [],
    budgetLines: [
      `本周生活费到账 ${weeklyAllowance} 元。`,
      `固定生活支出一共 ${weeklyLivingExpense} 元，已经按天拆进了逐日结算。`,
      `行动本身带来的直接收支合计 ${input.dayTurns.reduce((sum, turn) => sum + turn.moneyDelta, 0) + weeklyLivingExpense} 元。`,
      course.proxyCost > 0 ? `翘课或代价带来的额外课程成本 ${course.proxyCost} 元。` : "",
    ].filter(Boolean),
  };
  weeklySettlement.opportunities = buildWeeklyOpportunities({
    settlement: weeklySettlement,
    resumeAdded: input.resumeAdded,
  });

  const completedWeek = {
    week: input.activeMonth.currentWeekState.week,
    attendanceStrategy: input.attendanceStrategy,
    course,
    releasedClassDays,
    endedEarly: false,
  };
  const settledMonth: ActiveMonthState = {
    ...input.activeMonth,
    allowanceApplied: true,
    completedWeeks: [...input.activeMonth.completedWeeks, completedWeek],
    latestWeekSettlement: weeklySettlement,
    weeklySettlements: [...(input.activeMonth.weeklySettlements ?? []), weeklySettlement],
    lastResolvedTurn: input.dayTurns.at(-1),
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
    const nextWeekState = buildWeekPlanningState(
      runAfterWeek,
      settledMonth.currentWeek + 1,
      input.attendanceStrategy,
      {
        attendanceLocked: false,
        plannerFeedback: createPlannerFeedback(
          "success",
          `第 ${weeklySettlement.week} 周已结算`,
          "本周安排已经统一结算完，下一周先定课程态度，再逐天安排。",
        ),
      },
    );

    return {
      run: {
        ...runAfterWeek,
        activeMonth: {
          ...settledMonth,
          currentWeek: settledMonth.currentWeek + 1,
          currentWeekState: nextWeekState,
        },
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

export function selectWeekAttendanceStrategy(run: GameRun, attendanceStrategy: CourseAttendanceStrategy): GameRun {
  const activeMonth = ensureActiveMonth(run);
  let nextWeekState: ActiveWeekState = {
    ...activeMonth.currentWeekState,
    attendanceStrategy,
    attendanceLocked: true,
    plannerFeedback: createPlannerFeedback(
      "success",
      "本周课程态度已确定",
      "接下来逐天点击这一周的每天，给每一天排一个行动。",
    ),
  lastPlannedWeekday: undefined,
  };
  nextWeekState = {
    ...nextWeekState,
    readyToConfirm: isWeekReadyToConfirm(nextWeekState),
    planningWarnings: buildDetailedWeeklyCashWarnings(run, nextWeekState),
  };

  return {
    ...run,
    activeMonth: {
      ...activeMonth,
      currentWeekState: nextWeekState,
    },
  };
}

export function planWeeklyDayAction(input: {
  run: GameRun;
  weekday: Weekday;
  optionId: string;
  skipClass?: boolean;
}): GameRun {
  const activeMonth = ensureActiveMonth(input.run);
  const weekState = activeMonth.currentWeekState;

  if (!weekState.attendanceLocked) {
    return {
      ...input.run,
      activeMonth: {
        ...activeMonth,
        currentWeekState: {
          ...weekState,
          plannerFeedback: createPlannerFeedback(
            "error",
            "还没开始排这周",
            "先把本周课程态度定下来，再逐天安排行动。",
          ),
        },
      },
    };
  }

  const days = [...(weekState.days ?? [])];
  const dayIndex = days.findIndex((day) => day.weekday === input.weekday);

  if (dayIndex < 0) {
    return input.run;
  }

  const day = days[dayIndex]!;
  const skipClassSelected = Boolean(input.skipClass && day.skipClassAvailable);
  const effectiveDayType = resolveEffectiveDayType({
    day,
    event: weekState.event,
    skipClassSelected,
  });
  const availableOptions = resolveAvailableWeeklyActions({
    day,
    event: weekState.event,
    skipClassSelected,
    run: input.run,
  });
  const chosenOption = availableOptions.find((option) => option.optionId === input.optionId);

  if (!chosenOption) {
    const mismatchMessage =
      effectiveDayType === "night_only"
        ? "这一天默认只有夜里能排，白天类行动放不进去。"
        : effectiveDayType === "half_day"
          ? "这一天只有半天空档，完整白天行动排不下。"
          : "这一天的可选行动已经被本周事件压缩了，换一个更贴合当天节奏的安排吧。";

    return {
      ...input.run,
      activeMonth: {
        ...activeMonth,
        currentWeekState: {
          ...weekState,
          plannerFeedback: createPlannerFeedback("error", "这一天排不进去这个行动", mismatchMessage),
        },
      },
    };
  }

  const plannedAction: PlannedAction = {
    action: chosenOption.action,
    optionId: chosenOption.optionId,
    label: chosenOption.label,
    time: resolvePlannedActionTime({
      ...day,
      effectiveDayType,
    }, chosenOption),
    weekday: day.weekday,
    skipClass: skipClassSelected,
    sourceEventId: chosenOption.sourceEventId,
  };
  const nextDays = days.map((item, index) =>
    index === dayIndex
      ? {
          ...item,
          skipClassSelected,
          effectiveDayType,
          plannedAction,
          planningStatus: "planned" as const,
        }
      : item,
  );
  const releasedClassDays = nextDays.filter((item) => item.skipClassSelected).map((item) => item.weekday);
  let nextWeekState: ActiveWeekState = {
    ...weekState,
    releasedClassDays,
    days: nextDays,
    plannerFeedback: createPlannerFeedback(
      "success",
      `${getWeeklyDayLabel(day.weekday)}已安排`,
      `${getWeeklyDayLabel(day.weekday)}先定成了“${chosenOption.label}”，这一步只是排进周历，等本周确认后再统一结算。`,
    ),
    lastSelectedOptionId: chosenOption.optionId,
    lastPlannedWeekday: day.weekday,
  };
  nextWeekState = {
    ...nextWeekState,
    readyToConfirm: isWeekReadyToConfirm(nextWeekState),
    planningWarnings: buildDetailedWeeklyCashWarnings(input.run, nextWeekState),
  };

  return {
    ...input.run,
    activeMonth: {
      ...activeMonth,
      currentWeekState: nextWeekState,
    },
  };
}

export function confirmPlannedWeek(run: GameRun): {
  run: GameRun;
  monthCompleted: boolean;
  monthlySummary?: StructuredMonthlySummary;
} {
  const activeMonth = ensureActiveMonth(run);
  const weekState = activeMonth.currentWeekState;

  if (!weekState.attendanceLocked || !weekState.days || weekState.days.length === 0) {
    return {
      run: {
        ...run,
        activeMonth: {
          ...activeMonth,
          currentWeekState: {
            ...weekState,
            plannerFeedback: createPlannerFeedback(
              "error",
              "这周还没开始排",
              "要先把这 7 天的周排程建起来，系统才能统一结算本周安排。",
            ),
          },
        },
      },
      monthCompleted: false,
    };
  }

  let projectedRun: GameRun = {
    ...run,
    activeMonth,
  };
  const dayTurns: ActionTurnSummary[] = [];
  let resumeAdded = 0;
  const dailyLivingCosts = distributeWeeklyLivingCost(getWeeklyLivingExpense(projectedRun), weekState.days.length);

  for (const [dayIndex, day] of weekState.days.entries()) {
    const plannedAction = day.plannedAction ?? createAutoFilledIdleAction(day);
    const optionId = plannedAction.optionId ?? plannedAction.action;
    const availableOptions = resolveAvailableWeeklyActions({
      day,
      event: weekState.event,
      skipClassSelected: day.skipClassSelected,
      run: projectedRun,
    });
    const option =
      availableOptions.find((item) => item.optionId === optionId) ??
      findWeeklyActionOption(optionId) ??
      createOptionFromPlannedAction(plannedAction);

    const baseResolution = resolveActionPlan(
      projectedRun,
      {
        attendanceStrategy: weekState.attendanceStrategy,
        actions: [plannedAction],
      },
      {
        suppressAllowanceCorrection: true,
        suppressWeeklySettlement: true,
      },
    );
    const resolvedAction = baseResolution.resolvedActions[0] ?? {
      ...plannedAction,
      accepted: false,
      reason: "turn-resolution-missing",
    };
    const eventBoost = findWeeklyEventBoost(weekState.event, option);
    const skipClassEffect = createSkipClassDayEffect(day);
    const livingCostEffect: WeeklyActionEffect = {
      money: -(dailyLivingCosts[dayIndex] ?? 0),
      notableFact: `daily-living-cost:${dailyLivingCosts[dayIndex] ?? 0}`,
    };
    const combinedEffect: WeeklyActionEffect = resolvedAction.accepted
      ? {
          stats: sumStats(
            sumStats(
              sumStats(emptyStatsDelta(), eventBoost.stats),
              livingCostEffect.stats,
            ),
            skipClassEffect.stats,
          ),
          money:
            (eventBoost.money ?? 0) +
            (livingCostEffect.money ?? 0) +
            (skipClassEffect.money ?? 0),
          risk: sumRisk(
            sumRisk(
              sumRisk(emptyRiskDelta(), eventBoost.risk),
              livingCostEffect.risk,
            ),
            skipClassEffect.risk,
          ),
          flags: dedupe([
            ...(eventBoost.flags ?? []),
            ...(livingCostEffect.flags ?? []),
            ...(skipClassEffect.flags ?? []),
          ]),
          notableFact: eventBoost.notableFact ?? livingCostEffect.notableFact ?? skipClassEffect.notableFact,
          resume:
            eventBoost.resume ??
            skipClassEffect.resume,
        }
      : livingCostEffect;
    const statsBefore = projectedRun.stats;
    const baseStatsDelta: DynamicStats = {
      money: baseResolution.moneyDelta + baseResolution.stats.money,
      mood: baseResolution.stats.mood,
      stress: baseResolution.stats.stress,
      fulfillment: baseResolution.stats.fulfillment,
      social: baseResolution.stats.social,
      semesterAcademics: baseResolution.stats.semesterAcademics,
    };
    const statsAfter = addStats(statsBefore, baseStatsDelta);
    const riskAfter = mergeRisk(
      projectedRun.risk,
      sumRisk(baseResolution.risk, combinedEffect.risk),
    );
    let turnSummary: ActionTurnSummary = applyWeeklyEffectToTurn(
      {
        turn: projectedRun.activeMonth!.turns.length + 1,
        week: activeMonth.currentWeek,
        slotLabel: activeMonth.weeklyCalendar[activeMonth.currentWeek - 1]?.label ?? `第 ${activeMonth.currentWeek} 周`,
        advancesCalendar: resolvedAction.accepted,
        attendanceStrategy: weekState.attendanceStrategy,
        chosenAction: plannedAction,
        resolvedAction: {
          ...resolvedAction,
          label: plannedAction.label,
          optionId: plannedAction.optionId,
          weekday: day.weekday,
          skipClass: plannedAction.skipClass,
          sourceEventId: plannedAction.sourceEventId,
        },
        statsBefore,
        statsAfter,
        statsDelta: baseStatsDelta,
        moneyDelta: baseStatsDelta.money,
        flags: baseResolution.flags,
        notableFacts: plannedAction.autoFilled ? ["auto-filled-idle"] : [],
        allowanceApplied: false,
        course: createInstantCourseResolution(weekState.attendanceStrategy),
        weekday: day.weekday,
        dayLabel: getWeeklyDayLabel(day.weekday),
        weekCompleted: false,
      },
      combinedEffect,
    );
    turnSummary = {
      ...turnSummary,
      notableFacts: dedupe([
        ...turnSummary.notableFacts,
        `daily-living-cost:${dailyLivingCosts[dayIndex] ?? 0}`,
        skipClassEffect.notableFact ?? "",
      ]),
    };
    const skippedCompetitionLine =
      weekState.event?.weekday === day.weekday &&
      weekState.event.skipClosesProjectLine &&
      Boolean(weekState.event.linkedProjectId) &&
      turnSummary.resolvedAction.sourceEventId !== weekState.event.id;

    if (skippedCompetitionLine) {
      turnSummary = applyWeeklyEffectToTurn(turnSummary, {
        notableFact: `weekly-event:competition-skipped:${weekState.event?.linkedProjectTitle ?? "competition-line"}`,
      });
    }
    const weeklyResume = createResumeItemFromWeeklyEffect(projectedRun, combinedEffect);
    resumeAdded += baseResolution.resumeAdditions.length + weeklyResume.length;
    projectedRun = {
      ...projectedRun,
      stats: turnSummary.statsAfter,
      risk: riskAfter,
      cooldowns: updateCooldownsDuringMonth(projectedRun, baseResolution.askFamilyUsed),
      resume: [...projectedRun.resume, ...baseResolution.resumeAdditions, ...weeklyResume],
      riskFlags: deriveMonthlyRiskFlags({
        ...projectedRun,
        stats: turnSummary.statsAfter,
        risk: riskAfter,
      }),
      activeMonth: {
        ...projectedRun.activeMonth!,
        turns: [...projectedRun.activeMonth!.turns, turnSummary],
        lastResolvedTurn: turnSummary,
      },
    };
    if (
      weekState.event?.weekday === day.weekday &&
      weekState.event.linkedProjectId &&
      turnSummary.resolvedAction.accepted &&
      turnSummary.resolvedAction.sourceEventId === weekState.event.id
    ) {
      projectedRun = activateCompetitionProject(projectedRun, weekState.event.linkedProjectId);
    } else if (skippedCompetitionLine && weekState.event?.linkedProjectId) {
      projectedRun = closeCompetitionProject(projectedRun, weekState.event.linkedProjectId);
    }
    if (turnSummary.resolvedAction.accepted) {
      projectedRun = applyAcceptedActionProgression(projectedRun, turnSummary.resolvedAction.action);
    }
    dayTurns.push(turnSummary);
  }

  return finalizePlannedWeek({
    runBeforeMonth: run,
    run: projectedRun,
    activeMonth: {
      ...projectedRun.activeMonth!,
      currentWeekState: {
        ...projectedRun.activeMonth!.currentWeekState,
        plannerFeedback: undefined,
        lastPlannedWeekday: undefined,
      },
    },
    attendanceStrategy: weekState.attendanceStrategy,
    dayTurns,
    resumeAdded,
  });
}

export function resolveActionTurn(run: GameRun, plan: ActionTurnPlan): ResolvedTurnResult {
  const ensuredRun = ensureProgressionState(run);
  const activeMonth = ensureActiveMonth(ensuredRun);
  const week = activeMonth.weeklyCalendar[activeMonth.currentWeek - 1];

  if (!week) {
    throw new Error(`Month ${run.currentMonth} has no remaining weekly turns.`);
  }

  const timeCost = getActionTimeCost(plan.action.action);
  const weekTimeBefore = activeMonth.currentWeekState.remainingTimeUnits;
  const allowanceDelta = activeMonth.allowanceApplied ? 0 : ensuredRun.profile.monthlyAllowance;
  const initialActionResolution = resolveActionPlan(ensuredRun, {
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
  const statsBefore = ensuredRun.stats;
  const statsDelta: DynamicStats = {
    money: allowanceDelta + actionResolution.moneyDelta + actionResolution.stats.money,
    mood: actionResolution.stats.mood,
    stress: actionResolution.stats.stress,
    fulfillment: actionResolution.stats.fulfillment,
    social: actionResolution.stats.social,
    semesterAcademics: actionResolution.stats.semesterAcademics,
  };
  const statsAfter = addStats(statsBefore, statsDelta);
  const riskAfter = mergeRisk(ensuredRun.risk, actionResolution.risk);
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
  let updatedRun: GameRun = {
    ...ensuredRun,
    stats: statsAfter,
    risk: riskAfter,
    cooldowns: updateCooldownsDuringMonth(ensuredRun, actionResolution.askFamilyUsed),
    resume: [...ensuredRun.resume, ...actionResolution.resumeAdditions],
    riskFlags: deriveMonthlyRiskFlags({
      ...ensuredRun,
      stats: statsAfter,
      risk: riskAfter,
    }),
    activeMonth: updatedActiveMonth,
  };
  if (resolvedAction.accepted) {
    updatedRun = applyAcceptedActionProgression(updatedRun, resolvedAction.action);
  }

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

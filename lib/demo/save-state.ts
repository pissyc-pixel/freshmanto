import { ensureProgressionState } from "@/core/resolvers/progression";
import { createWeekTimeState, createWeeklyCalendar } from "@/core/resolvers/schedule";
import { normalizeMonthlySummary } from "@/lib/demo/monthly-digest";
import type {
  ActiveMonthState,
  ActiveWeekState,
  DynamicStats,
  EndingEvidence,
  FutureOffer,
  GameRun,
  InternshipRecord,
  MonthlyLetter,
  PlannedWeekdayState,
  RiskState,
  StarterProfile,
  StructuredMonthlySummary,
  TimelineNode,
} from "@/types/game";

function normalizeStats(stats: Partial<DynamicStats> | null | undefined): DynamicStats {
  return {
    money: typeof stats?.money === "number" ? stats.money : 0,
    mood: typeof stats?.mood === "number" ? stats.mood : 50,
    stress: typeof stats?.stress === "number" ? stats.stress : 50,
    fulfillment: typeof stats?.fulfillment === "number" ? stats.fulfillment : 40,
    social: typeof stats?.social === "number" ? stats.social : 30,
    semesterAcademics: typeof stats?.semesterAcademics === "number" ? stats.semesterAcademics : 0,
  };
}

function normalizeRisk(risk: Partial<RiskState> | null | undefined): RiskState {
  return {
    academicRisk: typeof risk?.academicRisk === "number" ? risk.academicRisk : 0,
    burnout: typeof risk?.burnout === "number" ? risk.burnout : 0,
  };
}

function normalizeProfile(profile: Partial<StarterProfile> | null | undefined): StarterProfile {
  return {
    name: typeof profile?.name === "string" ? profile.name : undefined,
    talents: Array.isArray(profile?.talents) ? profile.talents : [],
    familyBackground: profile?.familyBackground ?? "ordinary",
    monthlyAllowance: typeof profile?.monthlyAllowance === "number" ? profile.monthlyAllowance : 1500,
    luck: typeof profile?.luck === "number" ? profile.luck : 50,
    collegeTrack: profile?.collegeTrack ?? "engineering",
    schoolTier: profile?.schoolTier ?? "985",
    cityTier: profile?.cityTier ?? "tier_1",
  };
}

function isValidPlannerDay(day: Partial<PlannedWeekdayState> | null | undefined): day is PlannedWeekdayState {
  return Boolean(
    day &&
      typeof day.weekday === "string" &&
      typeof day.label === "string" &&
      typeof day.baseDayType === "string" &&
      typeof day.effectiveDayType === "string" &&
      typeof day.skipClassAvailable === "boolean" &&
      typeof day.skipClassSelected === "boolean" &&
      typeof day.planningStatus === "string",
  );
}

function isValidWeekState(value: Partial<ActiveWeekState> | null | undefined): value is ActiveWeekState {
  return Boolean(
    value &&
      typeof value.week === "number" &&
      typeof value.totalTimeUnits === "number" &&
      typeof value.remainingTimeUnits === "number" &&
      Array.isArray(value.releasedClassDays),
  );
}

function isValidWeeklyCalendar(activeMonth: Partial<ActiveMonthState> | null | undefined) {
  return Array.isArray(activeMonth?.weeklyCalendar) && activeMonth.weeklyCalendar.length === 4;
}

function normalizeWeeklyState(
  currentMonth: number,
  currentWeek: number,
  weekState: Partial<ActiveWeekState> | null | undefined,
): ActiveWeekState {
  const weeklyCalendar = createWeeklyCalendar(currentMonth);
  const baseWeekState = createWeekTimeState(weeklyCalendar[currentWeek - 1]!, weekState?.attendanceStrategy ?? "mixed");

  if (!isValidWeekState(weekState)) {
    return baseWeekState;
  }

  const days =
    Array.isArray(weekState.days) && weekState.days.every((day) => isValidPlannerDay(day))
      ? weekState.days
      : baseWeekState.days;

  return {
    ...baseWeekState,
    ...weekState,
    week: currentWeek,
    releasedClassDays: Array.isArray(weekState.releasedClassDays) ? weekState.releasedClassDays : [],
    days,
    planningWarnings: Array.isArray(weekState.planningWarnings) ? weekState.planningWarnings : [],
    readyToConfirm: typeof weekState.readyToConfirm === "boolean" ? weekState.readyToConfirm : baseWeekState.readyToConfirm,
    attendanceLocked:
      typeof weekState.attendanceLocked === "boolean" ? weekState.attendanceLocked : baseWeekState.attendanceLocked,
  };
}

function normalizeActiveMonth(
  currentMonth: number,
  activeMonth: Partial<ActiveMonthState> | null | undefined,
  currentStats: DynamicStats,
): ActiveMonthState | undefined {
  if (!activeMonth) {
    return undefined;
  }

  const currentWeek =
    typeof activeMonth.currentWeek === "number" && activeMonth.currentWeek >= 1 && activeMonth.currentWeek <= 4
      ? activeMonth.currentWeek
      : 1;
  const weeklyCalendar = isValidWeeklyCalendar(activeMonth)
    ? activeMonth.weeklyCalendar!
    : createWeeklyCalendar(currentMonth);

  return {
    year: typeof activeMonth.year === "number" ? activeMonth.year : 1,
    month: typeof activeMonth.month === "number" ? activeMonth.month : currentMonth,
    currentWeek,
    totalWeeks: typeof activeMonth.totalWeeks === "number" ? activeMonth.totalWeeks : 4,
    allowanceApplied: typeof activeMonth.allowanceApplied === "boolean" ? activeMonth.allowanceApplied : true,
    cooldownsAtStart: activeMonth.cooldownsAtStart ?? { askFamilyMonths: 0 },
    weeklyCalendar,
    currentWeekState: normalizeWeeklyState(currentMonth, currentWeek, activeMonth.currentWeekState),
    completedWeeks: Array.isArray(activeMonth.completedWeeks) ? activeMonth.completedWeeks : [],
    latestWeekSettlement: activeMonth.latestWeekSettlement,
    weeklySettlements: Array.isArray(activeMonth.weeklySettlements) ? activeMonth.weeklySettlements : [],
    statsAtStart: normalizeStats(activeMonth.statsAtStart ?? currentStats),
    turns: Array.isArray(activeMonth.turns) ? activeMonth.turns : [],
    lastResolvedTurn: activeMonth.lastResolvedTurn,
  };
}

export function normalizeInternshipRecords(records: unknown): InternshipRecord[] {
  return Array.isArray(records) ? (records.filter((record) => record && typeof record === "object") as InternshipRecord[]) : [];
}

export function normalizeFutureOffers(records: unknown): FutureOffer[] {
  return Array.isArray(records) ? (records.filter((record) => record && typeof record === "object") as FutureOffer[]) : [];
}

export function normalizeTimelineNodes(records: unknown): TimelineNode[] {
  return Array.isArray(records) ? (records.filter((record) => record && typeof record === "object") as TimelineNode[]) : [];
}

export function normalizeMonthlyLetters(records: unknown): MonthlyLetter[] {
  return Array.isArray(records) ? (records.filter((record) => record && typeof record === "object") as MonthlyLetter[]) : [];
}

export function normalizeEndingEvidence(records: unknown): EndingEvidence[] {
  return Array.isArray(records) ? (records.filter((record) => record && typeof record === "object") as EndingEvidence[]) : [];
}

export function normalizeSaveState(run: Partial<GameRun> | null | undefined): GameRun {
  const normalizedStats = normalizeStats(run?.stats);
  const currentMonth =
    typeof run?.currentMonth === "number" && run.currentMonth >= 1 && run.currentMonth <= 12 ? run.currentMonth : 1;

  const normalized: GameRun = {
    id: typeof run?.id === "string" && run.id.trim().length > 0 ? run.id : "legacy-run",
    status: run?.status === "completed" ? "completed" : "active",
    currentYear: typeof run?.currentYear === "number" && run.currentYear > 0 ? run.currentYear : 1,
    currentMonth,
    currentSemester:
      typeof run?.currentSemester === "number" && run.currentSemester > 0 ? run.currentSemester : 1,
    profile: normalizeProfile(run?.profile),
    stats: normalizedStats,
    semesterAverage: typeof run?.semesterAverage === "number" ? run.semesterAverage : 0,
    resume: Array.isArray(run?.resume) ? run.resume : [],
    logLineIds: Array.isArray(run?.logLineIds) ? run.logLineIds : [],
    monthlySummaries: Array.isArray(run?.monthlySummaries)
      ? run.monthlySummaries.map((summary) => normalizeMonthlySummary(summary as StructuredMonthlySummary))
      : [],
    semesters: Array.isArray(run?.semesters) ? run.semesters : [],
    cooldowns: run?.cooldowns ?? { askFamilyMonths: 0 },
    risk: normalizeRisk(run?.risk),
    riskFlags: Array.isArray(run?.riskFlags) ? run.riskFlags : [],
    activeMonth: normalizeActiveMonth(currentMonth, run?.activeMonth, normalizedStats),
    progression: run?.progression,
    competitionProjects: Array.isArray(run?.competitionProjects) ? run.competitionProjects : [],
    scholarships: Array.isArray(run?.scholarships) ? run.scholarships : [],
    internshipRecords: normalizeInternshipRecords(run?.internshipRecords),
    futureOffers: normalizeFutureOffers(run?.futureOffers),
    acceptedOffer: run?.acceptedOffer ?? null,
    timelineNodes: normalizeTimelineNodes(run?.timelineNodes),
    monthlyLetters: normalizeMonthlyLetters(run?.monthlyLetters),
    endingEvidence: normalizeEndingEvidence(run?.endingEvidence),
  };

  return ensureProgressionState(normalized);
}

import type {
  ActionType,
  ActiveWeekState,
  PlannedWeekdayState,
  CourseAttendanceStrategy,
  ScheduledDay,
  ScheduledWeek,
  ScheduledWeekday,
  WeeklyActionOption,
  WeeklyDayType,
  WeeklyEventInstance,
  TimeBlockKind,
  Weekday,
} from "@/types/game";
import { weeklyActionCatalog } from "@/data/actions";

const MONTH_PATTERN: TimeBlockKind[] = [
  "free",
  "free",
  "free",
  "free",
  "free",
  "free",
  "free",
  "free",
  "half_free",
  "half_free",
  "half_free",
  "half_free",
  "half_free",
  "half_free",
  "half_free",
  "half_free",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
  "busy_day",
];

const WEEKDAY_ORDER: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
};

const COURSE_LOCKED_DAYTIME_WEEKDAYS: Weekday[] = ["mon", "wed", "fri"];

const ACTION_TIME_COSTS: Record<ActionType, number> = {
  study: 1,
  social: 1,
  relax: 1,
  student_activity: 1,
  remedy: 1,
  job_prep: 2,
  part_time: 2,
  big_meal: 0,
  ask_family: 0,
  skip_class: 0,
};

function resolveWeekdayKind(weekday: Weekday): TimeBlockKind {
  if (weekday === "sat" || weekday === "sun") {
    return "free";
  }

  if (weekday === "tue" || weekday === "thu") {
    return "half_free";
  }

  return "busy_day";
}

function createScheduledWeekday(weekday: Weekday): ScheduledWeekday {
  const dayType = resolveWeekdayKind(weekday);

  return {
    weekday,
    label: WEEKDAY_LABELS[weekday],
    dayType,
    availableTimes: dayType === "busy_day" ? ["night"] : ["day", "night"],
    courseLockedDaytime: COURSE_LOCKED_DAYTIME_WEEKDAYS.includes(weekday),
  };
}

function resolveWeeklyDayType(dayType: TimeBlockKind): WeeklyDayType {
  switch (dayType) {
    case "busy_day":
      return "night_only";
    case "half_free":
      return "half_day";
    default:
      return "full_day";
  }
}

export function getWeeklyDayLabel(weekday: Weekday): string {
  return WEEKDAY_LABELS[weekday];
}

export function getBaseWeeklyDayType(day: ScheduledWeekday): WeeklyDayType {
  return resolveWeeklyDayType(day.dayType);
}

export function isCourseLockedWeekday(weekday: Weekday): boolean {
  return COURSE_LOCKED_DAYTIME_WEEKDAYS.includes(weekday);
}

export function buildPlannerWeekdays(input: {
  week: ScheduledWeek;
  event?: WeeklyEventInstance | null;
  releasedClassDays?: Weekday[];
}): PlannedWeekdayState[] {
  const releasedDays = new Set(input.releasedClassDays ?? []);

  return input.week.days.map((day) => {
    const skipClassSelected = releasedDays.has(day.weekday);
    const baseDayType = getBaseWeeklyDayType(day);
    const eventApplies = input.event?.weekday === day.weekday;
    const effectiveDayType = eventApplies && input.event?.dayTypeOverride
      ? input.event.dayTypeOverride
      : skipClassSelected && day.courseLockedDaytime
        ? "full_day"
        : baseDayType;

    return {
      weekday: day.weekday,
      label: day.label,
      baseDayType,
      effectiveDayType,
      skipClassAvailable: Boolean(day.courseLockedDaytime),
      skipClassSelected,
      planningStatus: "pending",
    };
  });
}

export function resolveEffectiveDayType(input: {
  day: PlannedWeekdayState;
  event?: WeeklyEventInstance | null;
  skipClassSelected?: boolean;
}): WeeklyDayType {
  if (input.event?.weekday === input.day.weekday && input.event.dayTypeOverride) {
    return input.event.dayTypeOverride;
  }

  if (input.skipClassSelected && input.day.skipClassAvailable) {
    return "full_day";
  }

  return input.day.baseDayType;
}

export function resolveAvailableWeeklyActions(input: {
  day: PlannedWeekdayState;
  event?: WeeklyEventInstance | null;
  skipClassSelected?: boolean;
}): WeeklyActionOption[] {
  const effectiveDayType = resolveEffectiveDayType(input);
  const limitedActions = input.event?.weekday === input.day.weekday
    ? new Set(input.event?.limitedActions ?? [])
    : null;

  const allowedByDayType = weeklyActionCatalog.filter((option) => {
    if (effectiveDayType === "night_only") {
      return option.availability.includes("night");
    }

    if (effectiveDayType === "half_day") {
      return option.availability.includes("night") || option.availability.includes("half_day");
    }

    return true;
  });

  const baseOptions = limitedActions
    ? allowedByDayType.filter((option) => limitedActions.has(option.action))
    : allowedByDayType;

  const eventOption =
    input.event?.weekday === input.day.weekday && input.event.specialAction
      ? [input.event.specialAction]
      : [];

  return [...baseOptions, ...eventOption];
}

export function isWeekReadyToConfirm(weekState: ActiveWeekState): boolean {
  if (!weekState.attendanceLocked || !weekState.days || weekState.days.length === 0) {
    return false;
  }

  return weekState.days.every((day) => day.plannedAction);
}

export function createMonthlySchedule(month: number): ScheduledDay[] {
  const offset = (month - 1) % MONTH_PATTERN.length;

  return MONTH_PATTERN.map((_, index) => {
    const dayType = MONTH_PATTERN[(index + offset) % MONTH_PATTERN.length];

    return {
      day: index + 1,
      dayType,
      availableTimes: dayType === "busy_day" ? ["night"] : ["day", "night"],
    };
  });
}

export function createWeeklyCalendar(month: number): ScheduledWeek[] {
  void month;

  return Array.from({ length: 4 }, (_, index) => ({
    week: index + 1,
    label: `第 ${index + 1} 周`,
    days: WEEKDAY_ORDER.map((weekday) => createScheduledWeekday(weekday)),
  }));
}

export function getActionTimeCost(action: ActionType): number {
  return ACTION_TIME_COSTS[action];
}

export function getWeekTotalTimeUnits(week: ScheduledWeek): number {
  return week.days.reduce((total, day) => total + day.availableTimes.length, 0);
}

export function createWeekTimeState(
  week: ScheduledWeek,
  attendanceStrategy: CourseAttendanceStrategy = "mixed",
): ActiveWeekState {
  const totalTimeUnits = getWeekTotalTimeUnits(week);

  return {
    week: week.week,
    totalTimeUnits,
    remainingTimeUnits: totalTimeUnits,
    releasedClassDays: [],
    attendanceStrategy,
    attendanceLocked: false,
    event: null,
    days: buildPlannerWeekdays({ week }),
    readyToConfirm: false,
  };
}

export function releaseSkippedClassDays(input: {
  week: ScheduledWeek;
  requestedDays: Weekday[];
  releasedClassDays: Weekday[];
}) {
  const alreadyReleased = new Set(input.releasedClassDays);
  const newlyReleasedDays = input.week.days
    .filter((day) => input.requestedDays.includes(day.weekday))
    .filter((day) => day.courseLockedDaytime && !alreadyReleased.has(day.weekday))
    .map((day) => day.weekday);

  return {
    newlyReleasedDays,
    releasedClassDays: [...input.releasedClassDays, ...newlyReleasedDays],
    reclaimedTimeUnits: newlyReleasedDays.length,
  };
}

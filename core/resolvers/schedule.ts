import type {
  ActionType,
  ActiveWeekState,
  CourseAttendanceStrategy,
  ScheduledDay,
  ScheduledWeek,
  ScheduledWeekday,
  TimeBlockKind,
  Weekday,
} from "@/types/game";

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
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
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
    label: `Week ${index + 1}`,
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

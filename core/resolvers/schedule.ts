import type {
  ActionType,
  ActiveWeekState,
  GameRun,
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

const COURSE_LOCKED_DAYTIME_WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];

const ACTION_TIME_COSTS: Record<ActionType, number> = {
  study: 1,
  writing_research: 2,
  social: 1,
  relax: 1,
  idle: 0,
  student_activity: 1,
  remedy: 1,
  job_prep: 2,
  postgraduate_prep: 2,
  public_exam_prep: 2,
  competition_project: 2,
  part_time: 2,
  big_meal: 0,
  ask_family: 0,
  skip_class: 0,
};

function isOptionUnlocked(run: GameRun | undefined, option: WeeklyActionOption): boolean {
  if (!run) {
    return true;
  }

  if (option.action === "postgraduate_prep") {
    return run.currentYear >= 3;
  }

  if (option.action === "public_exam_prep") {
    return run.currentYear > 3 || (run.currentYear === 3 && run.currentMonth >= 7);
  }

  if (option.action === "competition_project") {
    return (run.competitionProjects ?? []).some((project) => project.status === "active");
  }

  if (option.action === "writing_research") {
    const hasActiveProject = (run.competitionProjects ?? []).some(
      (project) => project.status === "active" || project.status === "open",
    );
    const hasResearchContext = run.resume.some(
      (item) => ["research", "project", "competition"].includes(item.category),
    );
    return hasActiveProject || hasResearchContext;
  }

  return true;
}

function isVacationActionAllowed(action: WeeklyActionOption["action"], run: GameRun | undefined) {
  if (!run || !isVacationMonth(run.currentMonth)) {
    return true;
  }

  const baselineVacationActions = new Set<WeeklyActionOption["action"]>([
    "study",
    "job_prep",
    "competition_project",
    "part_time",
    "social",
    "relax",
    "idle",
    "big_meal",
    "student_activity",
    "remedy",
    "ask_family",
  ]);

  if (action === "postgraduate_prep") {
    return run.currentYear >= 3;
  }

  if (action === "public_exam_prep") {
    return run.currentYear > 3 || (run.currentYear === 3 && run.currentMonth >= 7);
  }

  if (action === "writing_research") {
    const hasActiveProject = (run.competitionProjects ?? []).some(
      (project) => project.status === "active" || project.status === "open",
    );
    return hasActiveProject || run.resume.some(
      (item) => ["research", "project", "competition"].includes(item.category),
    );
  }

  return baselineVacationActions.has(action);
}

function customizeActionOptionForRun(option: WeeklyActionOption, run: GameRun | undefined): WeeklyActionOption {
  if (!run) {
    return option;
  }

  if (run.profile.collegeTrack !== "engineering") {
    return option;
  }

  switch (option.action) {
    case "study":
      return {
        ...option,
        label: "课程复习",
        description: "围绕课程复习、刷题和补知识点推进学业。",
      };
    case "writing_research":
      return {
        ...option,
        label: "技术调研 / 实验记录",
        description: "做技术调研、实验记录、项目建模或工程训练整理，符合工科推进节奏。",
      };
    case "competition_project":
      return {
        ...option,
        label: "电赛 / 竞赛准备",
        description: "给手里的电赛、项目实践或工程训练继续投入，推进可参赛成果。",
      };
    default:
      return option;
  }
}

function resolveWeekdayKind(weekday: Weekday): TimeBlockKind {
  if (weekday === "sat" || weekday === "sun") {
    return "free";
  }

  if (weekday === "tue" || weekday === "thu") {
    return "half_free";
  }

  return "busy_day";
}

export function isVacationMonth(month: number): boolean {
  return month === 6 || month === 12;
}

function createScheduledWeekday(weekday: Weekday, month: number): ScheduledWeekday {
  const dayType = isVacationMonth(month) ? "free" : resolveWeekdayKind(weekday);

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
  const eventApplies = input.event?.weekday === input.day.weekday;

  if (input.skipClassSelected && input.day.skipClassAvailable) {
    return "full_day";
  }

  if (eventApplies && input.event?.dayTypeOverride) {
    return input.event.dayTypeOverride;
  }

  return input.day.baseDayType;
}

export function resolveAvailableWeeklyActions(input: {
  day: PlannedWeekdayState;
  event?: WeeklyEventInstance | null;
  skipClassSelected?: boolean;
  run?: GameRun;
}): WeeklyActionOption[] {
  const effectiveDayType = resolveEffectiveDayType(input);
  const eventApplies = input.event?.weekday === input.day.weekday;
  const linkedProjectStillOpen = !eventApplies || !input.event?.linkedProjectId || !input.run
    ? true
    : (input.run.competitionProjects ?? []).some(
        (project) =>
          project.id === input.event!.linkedProjectId &&
          (project.status === "open" || project.status === "active"),
      );
  const shouldShowSpecialAction = eventApplies && Boolean(input.event?.specialAction) && linkedProjectStillOpen;
  const limitedActions =
    eventApplies &&
    input.event?.limitedActions &&
    input.event.limitedActions.length > 0 &&
    !(input.event.skipClosesProjectLine && shouldShowSpecialAction) &&
    !(input.skipClassSelected && !input.event.hardBlock)
      ? new Set(input.event.limitedActions)
      : null;

  const allowedByDayType = weeklyActionCatalog.filter((option) => {
    if (!isOptionUnlocked(input.run, option)) {
      return false;
    }

    if (!isVacationActionAllowed(option.action, input.run)) {
      return false;
    }

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
    shouldShowSpecialAction && input.event?.specialAction
      ? [customizeActionOptionForRun(input.event.specialAction, input.run)]
      : [];

  return [...baseOptions, ...eventOption].map((option) => customizeActionOptionForRun(option, input.run));
}

export function isWeekReadyToConfirm(weekState: ActiveWeekState): boolean {
  if (!weekState.attendanceLocked || !weekState.days || weekState.days.length === 0) {
    return false;
  }

  return true;
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
  return Array.from({ length: 4 }, (_, index) => ({
    week: index + 1,
    label: `第 ${index + 1} 周`,
    days: WEEKDAY_ORDER.map((weekday) => createScheduledWeekday(weekday, month)),
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

import type { ScheduledDay, ScheduledWeek, ScheduledWeekday, TimeBlockKind, Weekday } from "@/types/game";

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
  };
}

export function createWeeklyCalendar(month: number): ScheduledWeek[] {
  void month;

  return Array.from({ length: 4 }, (_, index) => ({
    week: index + 1,
    label: `Week ${index + 1}`,
    days: WEEKDAY_ORDER.map((weekday) => createScheduledWeekday(weekday)),
  }));
}

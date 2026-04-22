import type { ScheduledDay, TimeBlockKind } from "@/types/game";

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

import { createWeekTimeState } from "@/core/resolvers/schedule";
import { formatTimeBlockKind } from "@/lib/demo/options";
import type { ActiveMonthState, ActiveWeekState, ScheduledWeek } from "@/types/game";

export function resolveCurrentWeekState(
  weeklyCalendar: ScheduledWeek[],
  activeMonth?: ActiveMonthState,
): ActiveWeekState {
  if (activeMonth?.currentWeekState) {
    return activeMonth.currentWeekState;
  }

  return createWeekTimeState(weeklyCalendar[0], "mixed");
}

export function buildWeeklyScheduleBlocks(input: {
  weeklyCalendar: ScheduledWeek[];
  currentWeek: number;
  currentWeekState: ActiveWeekState;
}) {
  const releasedDays = new Set(input.currentWeekState.releasedClassDays);

  return input.weeklyCalendar.map((week) => ({
    label: `Week ${week.week}`,
    isCurrent: week.week === input.currentWeek,
    detail:
      week.week === input.currentWeek
        ? `${input.currentWeekState.remainingTimeUnits}/${input.currentWeekState.totalTimeUnits} half-days remaining this week`
        : "Week completed or not active yet",
    timeSummary:
      week.week === input.currentWeek
        ? `Released class days: ${
            input.currentWeekState.releasedClassDays.length > 0
              ? input.currentWeekState.releasedClassDays.join(", ")
              : "none"
          }`
        : undefined,
    days: week.days.map((day) => {
      const released = week.week === input.currentWeek && releasedDays.has(day.weekday);

      return {
        label: day.label,
        kind: released ? "free" : day.dayType,
        released,
        detail: released
          ? "Daytime unlocked by skip_class for this week."
          : formatTimeBlockKind(day.dayType),
      };
    }),
  }));
}

import { createWeekTimeState } from "@/core/resolvers/schedule";
import {
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
} from "@/lib/demo/options";
import { formatTimeBlockKind } from "@/lib/demo/options";
import type {
  ActionTurnSummary,
  ActiveMonthState,
  ActiveWeekState,
  ScheduledWeek,
  Weekday,
} from "@/types/game";

const weekdayClassDayLabels: Record<Weekday, string> = {
  mon: "周一白天",
  tue: "周二白天",
  wed: "周三白天",
  thu: "周四白天",
  fri: "周五白天",
  sat: "周六白天",
  sun: "周日白天",
};

const weekdayLabels: Record<Weekday, string> = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
};

function formatReleasedClassDays(days: Weekday[]): string {
  return days.map((day) => weekdayClassDayLabels[day]).join("、");
}

function uniqueLines(lines: string[]): string[] {
  return [...new Set(lines.filter((line) => line.trim().length > 0))];
}

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
    label: `第 ${week.week} 周`,
    isCurrent: week.week === input.currentWeek,
    detail:
      week.week === input.currentWeek
        ? `本周还剩 ${input.currentWeekState.remainingTimeUnits} / ${input.currentWeekState.totalTimeUnits} 个半天可用。`
        : week.week < input.currentWeek
          ? "这一周已经结算完成。"
          : "还没轮到这一周。",
    timeSummary:
      week.week === input.currentWeek
        ? input.currentWeekState.releasedClassDays.length > 0
          ? `这周已经腾出来的上课白天：${formatReleasedClassDays(input.currentWeekState.releasedClassDays)}`
          : "这周还没有额外腾出来的上课白天"
        : undefined,
    days: week.days.map((day) => {
      const released = week.week === input.currentWeek && releasedDays.has(day.weekday);

      return {
        label: weekdayLabels[day.weekday],
        kind: released ? "free" : day.dayType,
        released,
        detail: released
          ? "这一天的白天已经被这周不去上课腾出来了。"
          : formatTimeBlockKind(day.dayType),
      };
    }),
  }));
}

export function buildCurrentActionFeedback(input: {
  turn: ActionTurnSummary;
  currentWeekState: ActiveWeekState;
}) {
  const { turn, currentWeekState } = input;
  const timeSummary = `${currentWeekState.remainingTimeUnits} / ${currentWeekState.totalTimeUnits}`;
  const nextStepHint =
    currentWeekState.remainingTimeUnits > 0
      ? turn.advancesCalendar
        ? `本周还剩 ${timeSummary} 个半天，还能继续安排正式行动，或者直接提前结束本周。`
        : `这一步没有消耗正式行动时间，本周还剩 ${timeSummary} 个半天，还能继续安排正式行动，或者直接提前结束本周。`
      : "这周时间已经用完，系统会自动结算到下一周。";

  const eventLines = uniqueLines([
    turn.releasedClassDays && turn.releasedClassDays.length > 0
      ? `这周已经腾出来的白天：${formatReleasedClassDays(turn.releasedClassDays)}。`
      : "",
    !turn.advancesCalendar ? "这一步没有消耗正式行动时间。" : "",
    ...turn.notableFacts.map(formatPlayerFacingFact),
    ...turn.flags.map(formatPlayerFacingFlag),
  ]);

  return {
    eventLines,
    nextStepHint,
  };
}

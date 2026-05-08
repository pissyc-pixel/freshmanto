import {
  createWeekTimeState,
  resolveAvailableWeeklyActions,
} from "@/core/resolvers/schedule";
import {
  formatActionType,
  formatAttendanceStrategy,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatPlannerReason,
  formatReleasedClassDayList,
  formatWeeklyDayType,
  formatWeeklyEventFact,
} from "@/lib/demo/options";
import type {
  ActiveMonthState,
  ActiveWeekState,
  ActionTurnSummary,
  GameRun,
  PlannedWeekdayState,
  ScheduledWeek,
  TimeBlockKind,
  WeeklySettlementSummary,
} from "@/types/game";

const weekdayLabels = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
};

function mapWeeklyDayTypeToBlockKind(value: PlannedWeekdayState["effectiveDayType"]): TimeBlockKind {
  switch (value) {
    case "night_only":
      return "busy_day";
    case "half_day":
      return "half_free";
    default:
      return "free";
  }
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
  const plannedCount = input.currentWeekState.days?.filter((day) => day.plannedAction).length ?? 0;

  return input.weeklyCalendar.map((week) => ({
    label: `第 ${week.week} 周`,
    isCurrent: week.week === input.currentWeek,
    detail:
      week.week === input.currentWeek
        ? input.currentWeekState.attendanceLocked
          ? `本周课程态度已定为“${formatAttendanceStrategy(input.currentWeekState.attendanceStrategy)}”，目前已经排了 ${plannedCount} / 7 天。`
          : "这一周先定课程态度，再逐天点击每天安排行动。"
        : week.week < input.currentWeek
          ? "这一周已经结算完成。"
          : "还没轮到这一周。",
    timeSummary:
      week.week === input.currentWeek && input.currentWeekState.event
        ? `${weekdayLabels[input.currentWeekState.event.weekday]}有本周事件：${input.currentWeekState.event.title}`
        : undefined,
    days: week.days.map((day) => {
      const plannerDay = input.currentWeekState.days?.find((item) => item.weekday === day.weekday);

      return {
        label: weekdayLabels[day.weekday],
        kind: plannerDay ? mapWeeklyDayTypeToBlockKind(plannerDay.effectiveDayType) : day.dayType,
        released: plannerDay?.skipClassSelected,
        detail: plannerDay?.plannedAction
          ? `已安排：${plannerDay.plannedAction.label ?? formatActionType(plannerDay.plannedAction.action)}`
          : plannerDay
            ? formatWeeklyDayType(plannerDay.effectiveDayType)
            : "",
      };
    }),
  }));
}

export function buildPlannerDaysView(currentWeekState: ActiveWeekState, run?: GameRun) {
  return (currentWeekState.days ?? []).map((day) => {
    const normalOptions = resolveAvailableWeeklyActions({
      day,
      event: currentWeekState.event,
      skipClassSelected: false,
      run,
    });
    const skipOptions = day.skipClassAvailable
      ? resolveAvailableWeeklyActions({
          day,
          event: currentWeekState.event,
          skipClassSelected: true,
          run,
        })
      : normalOptions;

    return {
      weekday: day.weekday,
      label: weekdayLabels[day.weekday],
      status: day.plannedAction ? "已安排" : "待安排",
      plannedActionLabel: day.plannedAction?.label ?? (day.plannedAction ? formatActionType(day.plannedAction.action) : null),
      baseTypeLabel: formatWeeklyDayType(day.baseDayType),
      effectiveTypeLabel: formatWeeklyDayType(day.effectiveDayType),
      skipClassAvailable: day.skipClassAvailable,
      skipClassSelected: day.skipClassSelected,
      eventTitle: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.title : null,
      eventSummary: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.summary : null,
      normalOptions: normalOptions.map((option) => ({
        optionId: option.optionId,
        label: option.label,
        description: option.description,
        selected: currentWeekState.lastSelectedOptionId === option.optionId,
      })),
      skipOptions: skipOptions.map((option) => ({
        optionId: option.optionId,
        label: option.label,
        description: option.description,
        selected: currentWeekState.lastSelectedOptionId === option.optionId,
      })),
    };
  });
}

export function buildWeeklySettlementView(settlement?: WeeklySettlementSummary) {
  if (!settlement) {
    return null;
  }

  const dayLines = settlement.dailyResults.map((turn) => ({
    id: `${settlement.week}-${turn.weekday ?? turn.turn}`,
    label: turn.dayLabel ?? `第 ${turn.turn} 项`,
    actionLabel: turn.resolvedAction.label ?? formatActionType(turn.resolvedAction.action),
    summary: turn.resolvedAction.accepted
      ? uniqueLines([
          ...turn.notableFacts.map((fact) => fact.startsWith("weekly-event:") ? formatWeeklyEventFact(fact) : formatPlayerFacingFact(fact)),
          ...turn.flags.map(formatPlayerFacingFlag),
        ])[0] ?? "这一天按计划落地了。"
      : formatPlannerReason(turn.resolvedAction.reason),
    statsDelta: turn.statsDelta,
  }));

  return {
    title: `第 ${settlement.week} 周结算`,
    subtitle: `课程态度：${formatAttendanceStrategy(settlement.attendanceStrategy)}`,
    eventTitle: settlement.event?.title ?? null,
    eventSummary: settlement.event?.summary ?? null,
    dayLines,
    totalLines: [
      { label: "钱", value: settlement.totals.money },
      { label: "心情", value: settlement.totals.mood },
      { label: "压力", value: settlement.totals.stress },
      { label: "学业", value: settlement.totals.semesterAcademics },
      { label: "社交", value: settlement.totals.social },
      { label: "成就感", value: settlement.totals.fulfillment },
    ],
    riskLines: uniqueLines([
      ...settlement.flags.map(formatPlayerFacingFlag),
      ...settlement.opportunities,
    ]),
  };
}

export function buildPlannerStatusText(currentWeekState: ActiveWeekState) {
  const plannedCount = currentWeekState.days?.filter((day) => day.plannedAction).length ?? 0;

  if (!currentWeekState.attendanceLocked) {
    return "这周还没定课程态度。";
  }

  if (plannedCount < 7) {
    return `这周已经排了 ${plannedCount} / 7 天，还不能确认。`;
  }

  return "这一周已经排满，可以确认本周安排并统一结算。";
}

export function buildPlannerFeedbackLines(currentWeekState: ActiveWeekState) {
  const lines = [
    currentWeekState.event
      ? `本周事件落在${weekdayLabels[currentWeekState.event.weekday]}：${currentWeekState.event.title}。`
      : "",
    currentWeekState.releasedClassDays.length > 0
      ? `这周已经决定翘掉的白天课程：${formatReleasedClassDayList(currentWeekState.releasedClassDays)}。`
      : "",
  ];

  return uniqueLines(lines);
}

export function buildCurrentActionFeedback(input: {
  turn: ActionTurnSummary;
  currentWeekState: ActiveWeekState;
}) {
  const { turn, currentWeekState } = input;
  const plannedCount = currentWeekState.days?.filter((day) => day.plannedAction).length ?? 0;
  const nextStepHint = currentWeekState.readyToConfirm
    ? "这一周已经排满，可以直接确认本周安排并统一结算。"
    : `这周目前已经排了 ${plannedCount} / 7 天，继续把剩下的天数点完再统一结算。`;

  const eventLines = uniqueLines([
    turn.resolvedAction.reason ? formatPlannerReason(turn.resolvedAction.reason) : "",
    ...turn.notableFacts.map((fact) => fact.startsWith("weekly-event:") ? formatWeeklyEventFact(fact) : formatPlayerFacingFact(fact)),
    ...turn.flags.map(formatPlayerFacingFlag),
  ]);

  return {
    eventLines,
    nextStepHint,
  };
}

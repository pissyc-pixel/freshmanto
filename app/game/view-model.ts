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

function formatPlannerWeeklyEventFact(fact: string): string {
  const extraFacts: Record<string, string> = {
    "weekly-event:strict-roll-call": "这周有一天课程签到查得特别紧，学业这条线因此被拉回了前台。",
    "weekly-event:postgraduate-briefing": "这周去听了一场深造说明会，考研和保研这两条线终于没那么虚了。",
    "weekly-event:public-exam-lecture": "这周去听了一场公考讲座，公考这条线第一次更像一条现实路径。",
    "weekly-event:competition-invite": "这周接住了一条比赛或项目入口，后面终于有了能持续投入的长期线。",
    "weekly-event:intern-referral": "这周顺着内推机会把就业线往前接了一下，求职不再只是空想。",
    "weekly-event:engineering-sprint": "这周学院的气氛很工科，实验和项目味都更重，做项目也更顺手了一点。",
    "weekly-event:business-case": "这周学院活动更偏案例赛和汇报，履历和求职这条线被自然抬起来了一点。",
    "weekly-event:humanities-workshop": "这周的调研和写作活动，把表达和公考这条线都往前轻轻推了一下。",
    "weekly-event:science-training": "这周更像在往建模和科研训练上面走，深造的方向感也更明显了。",
    "weekly-event:medical-observation": "这周的见习和实践机会，让医学线的履历和深造味道都更真实了一点。",
  };

  return extraFacts[fact] ?? formatWeeklyEventFact(fact);
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
          : "这一周先定课程态度，再逐天点击每一天安排行动。"
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
      justPlanned: currentWeekState.lastPlannedWeekday === day.weekday,
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
    label: turn.dayLabel ?? `第 ${turn.turn} 次`,
    actionLabel: turn.resolvedAction.label ?? formatActionType(turn.resolvedAction.action),
    summary: turn.resolvedAction.accepted
      ? uniqueLines([
          ...turn.notableFacts.map((fact) =>
            fact.startsWith("weekly-event:") ? formatPlannerWeeklyEventFact(fact) : formatPlayerFacingFact(fact),
          ),
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
    budgetLines: settlement.budgetLines ?? [],
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
    return `这周已经排了 ${plannedCount} / 7 天，没点到的天数会在确认时自动补成摆烂 / 发呆。`;
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
    "如果某天没点行动，系统会在确认时自动补成“摆烂 / 发呆”，不会卡死，也不会偷偷跳周。",
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
    ...turn.notableFacts.map((fact) =>
      fact.startsWith("weekly-event:") ? formatPlannerWeeklyEventFact(fact) : formatPlayerFacingFact(fact),
    ),
    ...turn.flags.map(formatPlayerFacingFlag),
  ]);

  return {
    eventLines,
    nextStepHint,
  };
}

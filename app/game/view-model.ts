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
import {
  buildPlannerActionNarrative,
  buildWeeklySettlementNarrative,
} from "@/lib/action-narratives";
import { annotatePlannerOptions } from "@/lib/planner-option-priority";
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

function uniqueLines(lines: Array<string | undefined | null>): string[] {
  return [...new Set(lines.filter((line): line is string => Boolean(line && line.trim().length > 0)))];
}

function buildCompetitionProgressText(run: GameRun | undefined) {
  const activeProject = run?.competitionProjects?.find((project) => project.status === "active");

  if (!activeProject) {
    return undefined;
  }

  return `这条项目已经投了 ${activeProject.investedDays} / ${activeProject.minimumEffortDays} 天。`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function describeExpectedImpact(option: { action: WeeklySettlementSummary["dailyResults"][number]["resolvedAction"]["action"]; source: "default" | "weekly_event"; }, run?: GameRun) {
  const track = run?.profile.collegeTrack;

  switch (option.action) {
    case "study":
      return "预期影响：补学业、压一点挂科风险，但会更累。";
    case "writing_research":
      if (track === "arts" || track === "business") {
        return "预期影响：补学业与表达，慢慢抬高写作 / 调研经历，对考公和项目线更友好。";
      }
      if (track === "science" || track === "medicine") {
        return "预期影响：补学业与研究感，更容易长出调研 / 科研类履历。";
      }
      return "预期影响：补学业、表达和调研积累，也更容易留下项目痕迹。";
    case "job_prep":
      return "预期影响：推就业 / 实习线、补履历，但会花钱耗神。";
    case "postgraduate_prep":
      return "预期影响：补学业和深造准备，后期更影响考研 / 推免。";
    case "public_exam_prep":
      return "预期影响：推进考公准备和方向感，但会占掉一整段时间。";
    case "competition_project":
      return "预期影响：补项目 / 比赛履历，也会慢慢推高推免和就业竞争力。";
    case "part_time":
      return "预期影响：补现金流，但压力和疲惫感会更明显。";
    case "social":
      return "预期影响：降压、回心情、补社交，但通常要花钱。";
    case "relax":
      return "预期影响：更明显地降压回血，但这段时间就不会推进学业和履历。";
    case "big_meal":
      return "预期影响：快速回心情、缓压力，代价是花掉一笔钱。";
    case "student_activity":
      return option.source === "weekly_event"
        ? "预期影响：先接住今天这条事件入口，减少错过信息或机会的风险。"
        : "预期影响：补社交和校园参与感，偶尔也会留下履历痕迹。";
    case "remedy":
      return "预期影响：优先止损，减压并把学业风险往回拉。";
    case "ask_family":
      return "预期影响：立刻补钱，但心理压力会明显上来。";
    default:
      return undefined;
  }
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
    "weekly-event:class-meeting-skip": "这周把班会和通知先拖过去了，后面补信息和补材料的压力也跟着上来了。",
    "weekly-event:strict-roll-call-skip": "这周把那次严查签到硬扛过去了，学业和后续补救压力都更高了一点。",
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
          ? `这周已经排了 ${plannedCount} / 7 天。`
          : "先看课表，再安排这周。"
        : week.week < input.currentWeek
          ? "这周过完了。"
          : "还没到这周。",
    timeSummary:
      week.week === input.currentWeek && input.currentWeekState.event
        ? `${weekdayLabels[input.currentWeekState.event.weekday]}｜${input.currentWeekState.event.title}`
        : undefined,
    days: week.days.map((day) => {
      const plannerDay = input.currentWeekState.days?.find((item) => item.weekday === day.weekday);
      const dayEvent =
        input.currentWeekState.event?.weekday === day.weekday ? input.currentWeekState.event.title : undefined;
      const kind = plannerDay ? mapWeeklyDayTypeToBlockKind(plannerDay.effectiveDayType) : day.dayType;
      const dayHint =
        plannerDay?.plannedAction
          ? `已安排：${plannerDay.plannedAction.label ?? formatActionType(plannerDay.plannedAction.action)}`
          : plannerDay
            ? plannerDay.effectiveDayType === "night_only"
              ? "夜晚可安排"
              : plannerDay.effectiveDayType === "half_day"
                ? "可安排半天"
                : "适合推进大事"
            : "";

      return {
        label: weekdayLabels[day.weekday],
        kind,
        released: plannerDay?.skipClassSelected,
        detail: dayHint,
        eventLabel: dayEvent ? `有${dayEvent.replace(/^[有去处理参加]+/, "")}` : undefined,
      };
    }),
  }));
}

export function buildPlannerDaysView(currentWeekState: ActiveWeekState, run?: GameRun) {
  const currentYear = run?.currentYear ?? 1;
  const currentMonth = run?.currentMonth ?? 1;
  const money = run?.stats.money ?? 0;
  const mood = run?.stats.mood ?? 50;
  const stress = run?.stats.stress ?? 50;
  const collegeTrack = run?.profile.collegeTrack ?? "engineering";
  const monthlyTurns = run?.activeMonth?.turns ?? [];

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
    const hasCashRisk = (currentWeekState.planningWarnings ?? []).length > 0;
    const plannedOptionId = day.plannedAction?.optionId;
    const dayEvent = currentWeekState.event?.weekday === day.weekday ? currentWeekState.event : null;
    const normalDayType = day.effectiveDayType;
    const skipDayType = day.skipClassAvailable ? "full_day" : day.effectiveDayType;
    const countActionRepeats = (action: WeeklySettlementSummary["dailyResults"][number]["resolvedAction"]["action"]) =>
      (currentWeekState.days ?? []).filter((item) => item.plannedAction?.action === action).length +
      monthlyTurns.filter((turn) => turn.resolvedAction.action === action).length;
    const prioritizedNormalOptions = annotatePlannerOptions({
      options: normalOptions.map((option) => ({
        optionId: option.optionId,
        action: option.action,
        label: option.label,
        description: buildPlannerActionNarrative({
          saveId: run?.id ?? "demo",
          year: currentYear,
          month: currentMonth,
          week: currentWeekState.week,
          weekday: day.weekday,
          action: option.action,
          actionId: option.optionId,
          dayType: normalDayType,
          hasEvent: Boolean(dayEvent),
          eventTitle: dayEvent?.title,
          mood,
          stress,
          money,
          collegeTrack,
          repeatedCount: countActionRepeats(option.action),
        }),
        source: option.source,
        sourceEventId: option.sourceEventId,
      selected:
          currentWeekState.lastSelectedOptionId === option.optionId ||
          plannedOptionId === option.optionId,
      })),
      event: dayEvent,
      hasCashRisk,
      dayType: day.effectiveDayType,
    });
    const prioritizedSkipOptions = annotatePlannerOptions({
      options: skipOptions.map((option) => ({
        optionId: option.optionId,
        action: option.action,
        label: option.label,
        description: buildPlannerActionNarrative({
          saveId: run?.id ?? "demo",
          year: currentYear,
          month: currentMonth,
          week: currentWeekState.week,
          weekday: day.weekday,
          action: option.action,
          actionId: option.optionId,
          dayType: skipDayType,
          hasEvent: Boolean(dayEvent),
          eventTitle: dayEvent?.title,
          mood,
          stress,
          money,
          collegeTrack,
          repeatedCount: countActionRepeats(option.action),
        }),
        source: option.source,
        sourceEventId: option.sourceEventId,
      selected:
          currentWeekState.lastSelectedOptionId === option.optionId ||
          plannedOptionId === option.optionId,
      })),
      event: dayEvent,
      hasCashRisk,
      dayType: day.effectiveDayType,
    });

    return {
      weekday: day.weekday,
      label: weekdayLabels[day.weekday],
      status: day.plannedAction ? "已安排" : "待安排",
      plannedActionLabel: day.plannedAction?.label ?? (day.plannedAction ? formatActionType(day.plannedAction.action) : null),
      justPlanned: currentWeekState.lastPlannedWeekday === day.weekday,
      baseDayTypeKey: day.baseDayType,
      baseTypeLabel: formatWeeklyDayType(day.baseDayType),
      effectiveDayTypeKey: day.effectiveDayType,
      effectiveTypeLabel: formatWeeklyDayType(day.effectiveDayType),
      skipClassAvailable: day.skipClassAvailable,
      skipClassSelected: day.skipClassSelected,
      eventTitle: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.title : null,
      eventSummary: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.summary : null,
      eventAttendSummary: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.attendSummary ?? null : null,
      eventSkipSummary: currentWeekState.event?.weekday === day.weekday ? currentWeekState.event.skipSummary ?? null : null,
      hasCashRisk,
      normalOptions: prioritizedNormalOptions.map((option) => ({
        ...option,
        progressText: option.action === "competition_project" ? buildCompetitionProgressText(run) : undefined,
      })),
      skipOptions: prioritizedSkipOptions.map((option) => ({
        ...option,
        progressText: option.action === "competition_project" ? buildCompetitionProgressText(run) : undefined,
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
    summary: buildWeeklySettlementNarrative(turn),
    statsDelta: turn.statsDelta,
  }));

  return {
    title: `第 ${settlement.week} 周回看`,
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
    return "先定这周怎么上课。";
  }

  if (plannedCount < 7) {
    return `这周已经排了 ${plannedCount} / 7 天。`;
  }

  return "这周已经排满了。";
}

export function buildPlannerFeedbackLines(currentWeekState: ActiveWeekState) {
  const isVacationWeek = currentWeekState.days?.every((day) => day.baseDayType === "full_day") ?? false;
  const lines = [
    isVacationWeek ? "这周像假期，时间基本都在自己手里。" : "",
    currentWeekState.event
      ? `${weekdayLabels[currentWeekState.event.weekday]}有${currentWeekState.event.title}。`
      : "",
    currentWeekState.releasedClassDays.length > 0
      ? `已经腾出的白天：${formatReleasedClassDayList(currentWeekState.releasedClassDays)}。`
      : "",
    ...(currentWeekState.planningWarnings ?? []),
    "没安排的日子，会自然滑过去。",
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
    ? "这周排满了，可以把它过完了。"
    : `这周已经排了 ${plannedCount} / 7 天，剩下的日子慢慢补上就行。`;

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

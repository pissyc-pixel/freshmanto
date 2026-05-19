import type { ActionType, WeeklyActionOption, WeeklyEventInstance } from "@/types/game";

export type PlannerOptionForPriority = Pick<
  WeeklyActionOption,
  "optionId" | "action" | "label" | "description" | "source" | "sourceEventId"
> & {
  selected: boolean;
};

export type PrioritizedPlannerOption = PlannerOptionForPriority & {
  badges: string[];
  isEventRelated: boolean;
  isCashRiskAction: boolean;
};

const CASH_RISK_ACTIONS = new Set<ActionType>(["part_time", "ask_family"]);
const DAY_TYPE_PRIORITY: Record<
  "night_only" | "half_day" | "full_day",
  Partial<Record<ActionType, number>>
> = {
  night_only: {
    study: 0,
    social: 1,
    relax: 2,
    student_activity: 3,
    remedy: 4,
    ask_family: 5,
  },
  half_day: {
    writing_research: 0,
    study: 1,
    job_prep: 2,
    student_activity: 3,
    social: 4,
    relax: 5,
  },
  full_day: {
    competition_project: 0,
    part_time: 1,
    job_prep: 2,
    postgraduate_prep: 3,
    public_exam_prep: 4,
    writing_research: 5,
    study: 6,
  },
};

function isEventRelatedOption(option: PlannerOptionForPriority, event?: WeeklyEventInstance | null) {
  if (!event) {
    return false;
  }

  if (option.source === "weekly_event" || option.sourceEventId === event.id) {
    return true;
  }

  return Boolean(event.actionBoosts?.some((boost) => boost.action === option.action));
}

function isCashRiskAction(option: PlannerOptionForPriority, hasCashRisk: boolean) {
  return hasCashRisk && CASH_RISK_ACTIONS.has(option.action);
}

function buildBadges(input: {
  option: PlannerOptionForPriority;
  event?: WeeklyEventInstance | null;
  hasCashRisk: boolean;
}) {
  const badges: string[] = [];

  if (input.option.selected) {
    badges.push("已选");
  }

  return badges;
}

export function annotatePlannerOptions(input: {
  options: PlannerOptionForPriority[];
  event?: WeeklyEventInstance | null;
  hasCashRisk: boolean;
  dayType?: "night_only" | "half_day" | "full_day";
}) {
  return input.options
    .map<PrioritizedPlannerOption>((option) => ({
      ...option,
      isEventRelated: isEventRelatedOption(option, input.event),
      isCashRiskAction: isCashRiskAction(option, input.hasCashRisk),
      badges: buildBadges({
        option,
        event: input.event,
        hasCashRisk: input.hasCashRisk,
      }),
    }))
    .sort((left, right) => {
      if (left.isEventRelated !== right.isEventRelated) {
        return left.isEventRelated ? -1 : 1;
      }

      if (left.isCashRiskAction !== right.isCashRiskAction) {
        return left.isCashRiskAction ? -1 : 1;
      }

      if (left.selected !== right.selected) {
        return left.selected ? -1 : 1;
      }

      const dayTypePriority = input.dayType ? DAY_TYPE_PRIORITY[input.dayType] : undefined;
      const leftRank = dayTypePriority?.[left.action] ?? Number.MAX_SAFE_INTEGER;
      const rightRank = dayTypePriority?.[right.action] ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return 0;
    });
}

export function buildPlannerEventNotice(input: {
  eventTitle?: string | null;
  eventSummary?: string | null;
  eventAttendSummary?: string | null;
  eventSkipSummary?: string | null;
  options: Array<Pick<PrioritizedPlannerOption, "isEventRelated">>;
}) {
  if (!input.eventTitle) {
    return null;
  }

  const hasEventRelatedAction = input.options.some((option) => option.isEventRelated);

  if (hasEventRelatedAction) {
    return {
      title: "今天有件事要处理",
      body:
        [input.eventAttendSummary, input.eventSkipSummary].filter(Boolean).join(" ").trim() ||
        "最好先去一趟，后面会省心一点。",
      tone: "amber" as const,
    };
  }

  return {
    title: "今天有件事",
    body:
      [input.eventSummary, input.eventSkipSummary].filter(Boolean).join(" ").trim() ||
      "今天可能会被临时打断一点，安排别排太死。",
    tone: "stone" as const,
  };
}

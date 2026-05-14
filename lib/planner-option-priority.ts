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

  if (isEventRelatedOption(input.option, input.event)) {
    badges.push("本日事件相关");
  } else if (isCashRiskAction(input.option, input.hasCashRisk)) {
    badges.push("现金风险优先");
  }

  if (input.option.selected) {
    badges.push("已选");
  }

  return badges;
}

export function annotatePlannerOptions(input: {
  options: PlannerOptionForPriority[];
  event?: WeeklyEventInstance | null;
  hasCashRisk: boolean;
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
      title: "今天有事件相关行动",
      body: [input.eventAttendSummary, input.eventSkipSummary].filter(Boolean).join(" ").trim() || "事件相关入口已经排在前面了，优先处理会更顺手。",
      tone: "amber" as const,
    };
  }

  return {
    title: "今天这条事件会影响安排结果",
    body: [input.eventSummary, input.eventSkipSummary].filter(Boolean).join(" ").trim() || "今天这条事件更像背景氛围提示，不会额外生成单独入口。",
    tone: "stone" as const,
  };
}

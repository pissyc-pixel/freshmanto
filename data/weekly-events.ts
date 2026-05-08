import type { DynamicStats, GameRun, RiskState, Weekday, WeeklyActionEffect, WeeklyActionOption, WeeklyDayType } from "@/types/game";

type EventCondition = "always" | "stress_high" | "money_low" | "academic_risk_high" | "social_high";

type WeeklyEventTemplate = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  allowedWeekdays: Weekday[];
  baseWeight: number | ((run: GameRun) => number);
  conditions: EventCondition[];
  dayTypeOverride?: WeeklyDayType;
  limitedActions?: WeeklyActionOption["action"][];
  specialAction?: {
    optionId: string;
    label: string;
    description: string;
    baseAction: WeeklyActionOption["action"];
    effect?: WeeklyActionEffect;
  };
  actionBoosts?: Array<{
    action: WeeklyActionOption["action"];
    effect: WeeklyActionEffect;
  }>;
};

function emptyStatsDelta(): DynamicStats {
  return {
    money: 0,
    mood: 0,
    stress: 0,
    fulfillment: 0,
    social: 0,
    semesterAcademics: 0,
  };
}

function emptyRiskDelta(): RiskState {
  return {
    academicRisk: 0,
    burnout: 0,
  };
}

export const weeklyEventTemplates: WeeklyEventTemplate[] = [
  {
    id: "weekly-guest-lecture",
    title: "院里临时讲座",
    summary: "这周有一场临时讲座落在排课里，你得决定要不要去。",
    detail: "这场讲座会占掉当天一部分心力，但如果去听，至少会留下一点视野和参与感。",
    allowedWeekdays: ["thu"],
    baseWeight: 7,
    conditions: ["always"],
    limitedActions: ["study", "student_activity", "relax", "big_meal", "ask_family"],
    specialAction: {
      optionId: "weekly-guest-lecture-attend",
      label: "参加讲座",
      description: "把这天腾出来去听讲座，算一次有内容的校园参与。",
      baseAction: "student_activity",
      effect: {
        stats: {
          fulfillment: 2,
          mood: 1,
        },
        notableFact: "weekly-event:guest-lecture",
        resume: {
          category: "campus_activity",
          title: "参加院里专题讲座",
          summary: "这周临时去听了一场院里讲座，留下了一次更具体的校园参与。",
          tags: ["讲座", "校园活动"],
        },
      },
    },
  },
  {
    id: "weekly-recruitment-talk",
    title: "企业来校宣讲",
    summary: "这周有一场企业宣讲落到日程里，可能对后面的实习方向有帮助。",
    detail: "当天会冒出一个更明确的去向感，适合拿来接求职准备这条线。",
    allowedWeekdays: ["tue"],
    baseWeight: (run) => (run.stats.social >= 55 ? 8 : 6),
    conditions: ["always"],
    specialAction: {
      optionId: "weekly-recruitment-talk-attend",
      label: "参加宣讲",
      description: "去听一场企业宣讲，把信息和求职方向先摸清楚。",
      baseAction: "job_prep",
      effect: {
        stats: {
          fulfillment: 2,
          social: 1,
        },
        notableFact: "weekly-event:recruitment-talk",
        flags: ["weekly-opportunity:recruitment-talk"],
      },
    },
    actionBoosts: [
      {
        action: "job_prep",
        effect: {
          stats: {
            fulfillment: 1,
          },
          notableFact: "weekly-event:job-prep-boost",
        },
      },
    ],
  },
  {
    id: "weekly-class-meeting",
    title: "班会 / 强制通知",
    summary: "辅导员把这周的一天卡成了班会和通知时间，选择会被压缩。",
    detail: "这天不像完全自由日，更适合轻一点的安排，或者直接把它当成必须去处理的杂事。",
    allowedWeekdays: ["wed"],
    baseWeight: 6,
    conditions: ["always"],
    dayTypeOverride: "night_only",
    limitedActions: ["study", "social", "relax", "big_meal", "ask_family"],
    specialAction: {
      optionId: "weekly-class-meeting-attend",
      label: "去开班会",
      description: "把这天交给班会和通知，没太大收益，但至少不会再被它打断。",
      baseAction: "student_activity",
      effect: {
        stats: {
          stress: -1,
        },
        notableFact: "weekly-event:class-meeting",
      },
    },
  },
  {
    id: "weekly-dorm-maintenance",
    title: "宿舍临时检修",
    summary: "周末被宿舍检修切掉一块，整天安排没法像平时那么完整。",
    detail: "这天还是能做事，但更像半天空档，不适合拿来排最重的行动。",
    allowedWeekdays: ["sat"],
    baseWeight: 5,
    conditions: ["always"],
    dayTypeOverride: "half_day",
  },
  {
    id: "weekly-quiet-recovery",
    title: "这周节奏偏平",
    summary: "没有额外的大事插进来，这周最大的变量还是你自己怎么排。",
    detail: "虽然没什么戏剧化事件，但这反而意味着你每一天怎么选都会更直接地留下痕迹。",
    allowedWeekdays: ["sun"],
    baseWeight: 2,
    conditions: ["always"],
    actionBoosts: [
      {
        action: "relax",
        effect: {
          stats: {
            mood: 1,
            stress: -1,
          },
          notableFact: "weekly-event:quiet-recovery",
        },
      },
    ],
  },
];

function matchesCondition(run: GameRun, condition: EventCondition): boolean {
  switch (condition) {
    case "always":
      return true;
    case "stress_high":
      return run.stats.stress >= 68;
    case "money_low":
      return run.stats.money <= 600;
    case "academic_risk_high":
      return run.risk.academicRisk >= 15;
    case "social_high":
      return run.stats.social >= 55;
    default:
      return false;
  }
}

function deterministicRoll(seed: string): number {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003;
  }

  return (hash % 1000) / 1000;
}

function resolveWeight(run: GameRun, template: WeeklyEventTemplate): number {
  if (!template.conditions.every((condition) => matchesCondition(run, condition))) {
    return 0;
  }

  return typeof template.baseWeight === "function" ? template.baseWeight(run) : template.baseWeight;
}

export function pickWeeklyEventTemplate(run: GameRun, week: number): WeeklyEventTemplate {
  const weightedTemplates = weeklyEventTemplates
    .map((template) => ({
      template,
      weight: resolveWeight(run, template),
    }))
    .filter((item) => item.weight > 0);

  if (weightedTemplates.length === 0) {
    return weeklyEventTemplates[weeklyEventTemplates.length - 1]!;
  }

  const totalWeight = weightedTemplates.reduce((sum, item) => sum + item.weight, 0);
  const target = deterministicRoll(`${run.id}:${run.currentYear}:${run.currentMonth}:${week}:weekly-event`) * totalWeight;
  let cursor = 0;

  for (const item of weightedTemplates) {
    cursor += item.weight;
    if (target <= cursor) {
      return item.template;
    }
  }

  return weightedTemplates[weightedTemplates.length - 1]!.template;
}

export function buildWeeklyEventSpecialOption(
  eventId: string,
  input: NonNullable<WeeklyEventTemplate["specialAction"]>,
): WeeklyActionOption {
  return {
    optionId: input.optionId,
    action: input.baseAction,
    label: input.label,
    description: input.description,
    availability: ["night", "half_day", "full_day"],
    source: "weekly_event",
    sourceEventId: eventId,
    effect: input.effect,
  };
}

export function emptyWeeklyEffect(): WeeklyActionEffect {
  return {
    stats: emptyStatsDelta(),
    money: 0,
    risk: emptyRiskDelta(),
    flags: [],
  };
}

import type {
  DynamicStats,
  GameRun,
  RiskState,
  Weekday,
  WeeklyActionEffect,
  WeeklyActionOption,
  WeeklyDayType,
  WeeklyEventCategory,
} from "@/types/game";

type EventCondition =
  | "always"
  | "stress_high"
  | "money_low"
  | "academic_risk_high"
  | "social_high"
  | "junior_or_senior"
  | "senior_track"
  | "competition_open";

type WeeklyEventTemplate = {
  id: string;
  category: WeeklyEventCategory;
  title: string;
  summary: string;
  detail: string;
  allowedWeekdays: Weekday[];
  baseWeight: number | ((run: GameRun) => number);
  conditions: EventCondition[];
  dayTypeOverride?: WeeklyDayType;
  limitedActions?: WeeklyActionOption["action"][];
  trackLimit?: GameRun["profile"]["collegeTrack"][];
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
    id: "weekly-class-meeting",
    category: "A",
    title: "班会 / 导员通知",
    summary: "这周有一天会被班会、材料确认和导员通知切掉一部分时间。",
    detail: "它不会让这一天完全失去安排空间，但很难再塞进最完整的白天行动。",
    allowedWeekdays: ["wed", "thu"],
    baseWeight: 7,
    conditions: ["always"],
    dayTypeOverride: "night_only",
    limitedActions: ["study", "social", "relax", "big_meal", "ask_family"],
    specialAction: {
      optionId: "weekly-class-meeting-attend",
      label: "去处理班会通知",
      description: "把这一天交给通知和班会，至少先把强制事项处理掉。",
      baseAction: "student_activity",
      effect: {
        stats: { stress: -1 },
        notableFact: "weekly-event:class-meeting",
      },
    },
  },
  {
    id: "weekly-strict-roll-call",
    category: "A",
    title: "课程签到严查",
    summary: "这周有一天课程签到查得格外紧，逃掉白天会更伤学业。",
    detail: "它不一定逼你去上课，但会让这一天更像带着风险在排。",
    allowedWeekdays: ["mon", "fri"],
    baseWeight: 5,
    conditions: ["academic_risk_high"],
    limitedActions: ["study", "relax", "big_meal", "ask_family"],
    actionBoosts: [
      {
        action: "study",
        effect: {
          stats: { semesterAcademics: 1 },
          notableFact: "weekly-event:strict-roll-call",
        },
      },
    ],
  },
  {
    id: "weekly-recruitment-talk",
    category: "B",
    title: "企业宣讲 / 招聘会",
    summary: "这周有一场企业宣讲落到日程里，适合把就业线往前拨一下。",
    detail: "它不直接给结果，但会明显提升你后续做求职准备时的方向感。",
    allowedWeekdays: ["tue", "thu"],
    baseWeight: (run) => (run.currentYear >= 2 ? 8 : 4),
    conditions: ["always"],
    specialAction: {
      optionId: "weekly-recruitment-talk-attend",
      label: "参加宣讲会",
      description: "去听企业宣讲，顺手摸清招聘节奏和岗位方向。",
      baseAction: "job_prep",
      effect: {
        stats: { fulfillment: 2, social: 1 },
        notableFact: "weekly-event:recruitment-talk",
        flags: ["weekly-opportunity:recruitment-talk"],
      },
    },
    actionBoosts: [
      {
        action: "job_prep",
        effect: {
          stats: { fulfillment: 1 },
          notableFact: "weekly-event:job-prep-boost",
        },
      },
    ],
  },
  {
    id: "weekly-postgraduate-briefing",
    category: "B",
    title: "考研 / 保研说明会",
    summary: "学院这周塞进来一场深造说明会，信息会比自己瞎摸清楚得多。",
    detail: "更适合大三后半程去接，能把深造线从模糊想法变成更具体的安排。",
    allowedWeekdays: ["thu"],
    baseWeight: 7,
    conditions: ["junior_or_senior"],
    specialAction: {
      optionId: "weekly-postgraduate-briefing-attend",
      label: "参加深造说明会",
      description: "去听一场考研/保研说明会，把路径和时间线先摸清。",
      baseAction: "postgraduate_prep",
      effect: {
        stats: { fulfillment: 2 },
        notableFact: "weekly-event:postgraduate-briefing",
      },
    },
  },
  {
    id: "weekly-public-exam-lecture",
    category: "B",
    title: "公考讲座",
    summary: "这周出现一场公考讲座，会让这条线第一次变得更像真实选项。",
    detail: "主要对大三下到大四阶段更有意义，会让后续公考准备没那么虚。",
    allowedWeekdays: ["tue"],
    baseWeight: 6,
    conditions: ["senior_track"],
    specialAction: {
      optionId: "weekly-public-exam-lecture-attend",
      label: "去听公考讲座",
      description: "把公考讲座塞进这一天，先把考试结构和节奏摸一遍。",
      baseAction: "public_exam_prep",
      effect: {
        stats: { fulfillment: 1 },
        notableFact: "weekly-event:public-exam-lecture",
      },
    },
  },
  {
    id: "weekly-competition-invite",
    category: "D",
    title: "比赛 / 项目招募信息",
    summary: "这周会冒出一条竞赛或项目招募，适合把长期线真正接起来。",
    detail: "它不是一次性答题，而是一个要后续继续投入的入口。",
    allowedWeekdays: ["wed", "sat"],
    baseWeight: (run) => ((run.competitionProjects ?? []).some((project) => project.status === "open") ? 9 : 5),
    conditions: ["competition_open"],
    specialAction: {
      optionId: "weekly-competition-invite-join",
      label: "接下比赛 / 项目入口",
      description: "把这个入口先接住，后面再慢慢投入时间做成果。",
      baseAction: "competition_project",
      effect: {
        stats: { fulfillment: 2, semesterAcademics: 1 },
        notableFact: "weekly-event:competition-invite",
      },
    },
  },
  {
    id: "weekly-intern-referral",
    category: "D",
    title: "实习内推机会",
    summary: "这周有人递来一条实习内推机会，信息质量比海投高一点。",
    detail: "这类入口本身不保证拿到结果，但会让就业线更像真的在往前走。",
    allowedWeekdays: ["fri", "sat"],
    baseWeight: (run) => (run.stats.social >= 50 ? 8 : 5),
    conditions: ["social_high"],
    specialAction: {
      optionId: "weekly-intern-referral-follow",
      label: "跟进内推机会",
      description: "顺着这条内推机会把简历和投递往前推一下。",
      baseAction: "job_prep",
      effect: {
        stats: { social: 1, fulfillment: 2 },
        notableFact: "weekly-event:intern-referral",
        resume: {
          category: "internship",
          title: "跟进一次实习内推机会",
          summary: "这周顺着熟人或学长学姐给的渠道认真跟进了一次实习机会。",
          tags: ["internship", "referral"],
        },
      },
    },
  },
  {
    id: "weekly-engineering-sprint",
    category: "E",
    title: "工科实验周 / 电赛训练",
    summary: "学院这周的节奏很工科：实验、训练和项目味都更重。",
    detail: "它会让这周更自然地偏向项目实践和竞赛投入。",
    allowedWeekdays: ["sat"],
    baseWeight: 7,
    conditions: ["always"],
    trackLimit: ["engineering"],
    actionBoosts: [
      {
        action: "competition_project",
        effect: {
          stats: { fulfillment: 1, semesterAcademics: 1 },
          notableFact: "weekly-event:engineering-sprint",
        },
      },
    ],
  },
  {
    id: "weekly-business-case",
    category: "E",
    title: "商学院案例赛",
    summary: "这周学院里的活动更偏案例赛和展示汇报。",
    detail: "它会把就业、项目和表达这种线稍微往前抬一点。",
    allowedWeekdays: ["sun"],
    baseWeight: 7,
    conditions: ["always"],
    trackLimit: ["business"],
    actionBoosts: [
      {
        action: "job_prep",
        effect: {
          stats: { fulfillment: 1, social: 1 },
          notableFact: "weekly-event:business-case",
        },
      },
    ],
  },
  {
    id: "weekly-humanities-workshop",
    category: "E",
    title: "调研 / 写作活动",
    summary: "这周学院里有一场很文科的调研或写作活动。",
    detail: "它更容易把你往表达、调研和公考这类慢热路线推一点。",
    allowedWeekdays: ["sun"],
    baseWeight: 7,
    conditions: ["always"],
    trackLimit: ["arts"],
    actionBoosts: [
      {
        action: "public_exam_prep",
        effect: {
          stats: { fulfillment: 1 },
          notableFact: "weekly-event:humanities-workshop",
        },
      },
    ],
  },
  {
    id: "weekly-science-training",
    category: "E",
    title: "理科学院竞赛集训",
    summary: "这周学院里更像在鼓励你往建模、科研训练那边靠。",
    detail: "如果本来就在考虑深造，这种周会让方向感更明显。",
    allowedWeekdays: ["sat"],
    baseWeight: 7,
    conditions: ["junior_or_senior"],
    trackLimit: ["science"],
    actionBoosts: [
      {
        action: "postgraduate_prep",
        effect: {
          stats: { semesterAcademics: 1, fulfillment: 1 },
          notableFact: "weekly-event:science-training",
        },
      },
    ],
  },
  {
    id: "weekly-medical-observation",
    category: "E",
    title: "见习 / 实践机会",
    summary: "这周学院气氛更偏见习、实践和实验安排。",
    detail: "这类资源对医学线的履历和继续深造都会更有现实感。",
    allowedWeekdays: ["sat"],
    baseWeight: 7,
    conditions: ["junior_or_senior"],
    trackLimit: ["medicine"],
    actionBoosts: [
      {
        action: "postgraduate_prep",
        effect: {
          stats: { semesterAcademics: 1, fulfillment: 1 },
          notableFact: "weekly-event:medical-observation",
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
    case "junior_or_senior":
      return run.currentYear >= 3;
    case "senior_track":
      return run.currentYear > 3 || (run.currentYear === 3 && run.currentMonth >= 7);
    case "competition_open":
      return (run.competitionProjects ?? []).some((project) => project.status === "open" || project.status === "active");
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
  if (template.trackLimit && !template.trackLimit.includes(run.profile.collegeTrack)) {
    return 0;
  }

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

  const totalWeight = weightedTemplates.reduce((sum, item) => sum + item.weight, 0);
  const target = deterministicRoll(`${run.id}:${run.currentYear}:${run.currentMonth}:${week}:weekly-event`) * totalWeight;
  let cursor = 0;

  for (const item of weightedTemplates) {
    cursor += item.weight;
    if (target <= cursor) {
      return item.template;
    }
  }

  return weightedTemplates[weightedTemplates.length - 1]?.template ?? weeklyEventTemplates[0]!;
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

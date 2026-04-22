import type { DynamicStats, EventSeverity, GameRun, ResumeCategory, RiskState } from "@/types/game";

export type EventRuleCondition =
  | "always"
  | "money_low"
  | "stress_high"
  | "academic_risk_high"
  | "social_low"
  | "social_high"
  | "mood_low"
  | "academic_streak_high";

type ComputedNumber = number | ((run: GameRun) => number);
type ComputedText = string | ((run: GameRun) => string);

type EventResumeReward = {
  category: ResumeCategory;
  title: string;
  summary: string;
  tags: string[];
};

export type EventRuleTemplate = {
  id: string;
  title: string;
  severity: EventSeverity;
  triggerMonths: number[];
  conditions: EventRuleCondition[];
  chance?: number;
  maxOccurrences?: number;
  summary: string;
  supportsRemedy: boolean;
  effect: {
    stats?: Partial<DynamicStats>;
    money?: ComputedNumber;
    risk?: Partial<RiskState>;
    flags?: string[];
    notableFact?: ComputedText;
    addResume?: EventResumeReward;
  };
};

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const LIVING_EXPENSE_BY_CITY = {
  tier_1: 1080,
  tier_2: 920,
  tier_3: 780,
} as const;

const SCHOLARSHIP_BY_SCHOOL = {
  qingbei: 1500,
  nankai_tianda: 1200,
  "985": 1000,
  "211": 850,
  first_tier: 750,
  second_tier: 650,
} as const;

export function getMonthlyLivingExpense(run: GameRun): number {
  return LIVING_EXPENSE_BY_CITY[run.profile.cityTier];
}

function scholarshipAmount(run: GameRun): number {
  return SCHOLARSHIP_BY_SCHOOL[run.profile.schoolTier];
}

export const starterEventTemplates: EventRuleTemplate[] = [
  {
    id: "monthly-living-expense",
    title: "固定生活支出",
    severity: "important",
    triggerMonths: ALL_MONTHS,
    conditions: ["always"],
    summary: "每个月都会固定消耗住宿、餐饮、通勤与日常生活支出。",
    supportsRemedy: false,
    effect: {
      money: (run) => -getMonthlyLivingExpense(run),
      notableFact: (run) => `event: monthly-living-expense:${getMonthlyLivingExpense(run)}`,
    },
  },
  {
    id: "freshman-orientation",
    title: "新生适应周",
    severity: "routine",
    triggerMonths: [1],
    conditions: ["always"],
    maxOccurrences: 1,
    summary: "开学初的导览和班级破冰，能稍微提升校园融入感。",
    supportsRemedy: false,
    effect: {
      stats: {
        mood: 3,
        social: 4,
      },
      notableFact: "event: freshman-orientation",
    },
  },
  {
    id: "midterm-pressure",
    title: "期中压力堆积",
    severity: "important",
    triggerMonths: [4, 10],
    conditions: ["academic_risk_high"],
    summary: "课堂信息缺失和拖延会在期中阶段集中爆发。",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: 5,
      },
      risk: {
        academicRisk: 4,
      },
      flags: ["midterm-pressure"],
      notableFact: "event: midterm-pressure",
    },
  },
  {
    id: "academic-scholarship",
    title: "奖学金 / 学业认可",
    severity: "important",
    triggerMonths: ALL_MONTHS,
    conditions: ["academic_streak_high"],
    maxOccurrences: 1,
    summary: "最近几个月学业表现持续稳定，学院发来奖学金或专项奖励。",
    supportsRemedy: false,
    effect: {
      money: scholarshipAmount,
      stats: {
        mood: 4,
        stress: -3,
        fulfillment: 3,
      },
      notableFact: "event: academic-scholarship",
      addResume: {
        category: "special_experience",
        title: "获得学业奖励",
        summary: "因阶段性学业表现稳定，获得奖学金或院级认可。",
        tags: ["scholarship", "academic"],
      },
    },
  },
  {
    id: "social-mutual-aid",
    title: "朋友帮忙签到 / 带资料",
    severity: "routine",
    triggerMonths: ALL_MONTHS,
    conditions: ["social_high"],
    chance: 0.65,
    summary: "社交关系好的时候，同学更愿意顺手帮忙签到、带资料或提醒作业。",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: -3,
        mood: 2,
      },
      risk: {
        academicRisk: -2,
      },
      notableFact: "event: social-mutual-aid",
    },
  },
  {
    id: "economic-pressure",
    title: "经济压力上头",
    severity: "critical",
    triggerMonths: ALL_MONTHS,
    conditions: ["money_low"],
    summary: "手头太紧会明显挤压情绪和精力，做事也会更焦躁。",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -5,
        stress: 7,
        fulfillment: -2,
      },
      risk: {
        burnout: 2,
      },
      flags: ["economic-pressure"],
      notableFact: "event: economic-pressure",
    },
  },
  {
    id: "burnout-slump",
    title: "摆烂低潮",
    severity: "critical",
    triggerMonths: ALL_MONTHS,
    conditions: ["mood_low", "stress_high"],
    summary: "心情很差又压力爆表时，容易什么都不想做，学习和工作意愿都会下降。",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -3,
        stress: 2,
        fulfillment: -4,
      },
      risk: {
        burnout: 4,
      },
      flags: ["burnout-slump"],
      notableFact: "event: burnout-slump",
    },
  },
];

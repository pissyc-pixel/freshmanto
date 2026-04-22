import type { ActionType, DynamicStats, EventSeverity, GameRun, ResumeCategory, RiskState } from "@/types/game";

export type EventRuleCondition =
  | "always"
  | "money_low"
  | "stress_high"
  | "academic_risk_high"
  | "social_low"
  | "social_high"
  | "mood_low"
  | "academic_streak_high";

export type EventPhase = "monthly" | "action";
export type EventPolarity = "positive" | "negative" | "neutral";

type ComputedNumber = number | ((run: GameRun) => number);
type ComputedText = string | ((run: GameRun) => string);
type ComputedWeight = number | ((run: GameRun) => number);

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
  phase: EventPhase;
  polarity: EventPolarity;
  triggerMonths: number[];
  actionTypes?: ActionType[];
  conditions: EventRuleCondition[];
  baseWeight: ComputedWeight;
  chance?: number;
  maxOccurrences?: number;
  fallback?: boolean;
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

const WEEKLY_BACKGROUND_SPEND = {
  struggling: 20,
  ordinary: 40,
  stable: 80,
  "well-connected": 120,
  affluent: 170,
} as const;

const WEEKLY_SUPPLY_EXPENSE_BY_CITY = {
  tier_1: 120,
  tier_2: 100,
  tier_3: 80,
} as const;

const SCHOLARSHIP_BY_SCHOOL = {
  qingbei: 1500,
  nankai_tianda: 1200,
  "985": 1000,
  "211": 850,
  first_tier: 750,
  second_tier: 650,
} as const;

function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function getMonthlyLivingExpense(run: GameRun): number {
  return LIVING_EXPENSE_BY_CITY[run.profile.cityTier];
}

export function getWeeklyAllowance(run: GameRun): number {
  return Math.round(run.profile.monthlyAllowance / 4);
}

export function getWeeklyLivingExpense(run: GameRun): number {
  return roundToNearestTen(
    getMonthlyLivingExpense(run) / 4 +
      WEEKLY_BACKGROUND_SPEND[run.profile.familyBackground] +
      WEEKLY_SUPPLY_EXPENSE_BY_CITY[run.profile.cityTier],
  );
}

export function getMoneyPressureLine(run: GameRun): number {
  return Math.max(360, roundToNearestTen(getWeeklyLivingExpense(run) * 2.5));
}

function scholarshipAmount(run: GameRun): number {
  return SCHOLARSHIP_BY_SCHOOL[run.profile.schoolTier];
}

export const starterEventTemplates: EventRuleTemplate[] = [
  {
    id: "freshman-orientation",
    title: "Freshman Orientation",
    severity: "routine",
    phase: "monthly",
    polarity: "positive",
    triggerMonths: [1],
    conditions: ["always"],
    baseWeight: 8,
    maxOccurrences: 1,
    summary: "A first-month orientation gives a small push to campus belonging.",
    supportsRemedy: false,
    effect: {
      stats: {
        mood: 3,
        social: 4,
      },
      notableFact: "event:freshman-orientation",
    },
  },
  {
    id: "midterm-pressure",
    title: "Midterm Pressure",
    severity: "important",
    phase: "monthly",
    polarity: "negative",
    triggerMonths: [4, 10],
    conditions: ["academic_risk_high"],
    baseWeight: 7,
    summary: "Missed material piles up near midterms and makes recovery harder.",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: 6,
      },
      risk: {
        academicRisk: 4,
      },
      flags: ["midterm-pressure"],
      notableFact: "event:midterm-pressure",
    },
  },
  {
    id: "academic-scholarship",
    title: "Academic Scholarship",
    severity: "important",
    phase: "monthly",
    polarity: "positive",
    triggerMonths: ALL_MONTHS,
    conditions: ["academic_streak_high"],
    baseWeight: 8,
    maxOccurrences: 2,
    summary: "Strong academic momentum can turn into scholarship or school-level recognition.",
    supportsRemedy: false,
    effect: {
      money: scholarshipAmount,
      stats: {
        mood: 4,
        stress: -3,
        fulfillment: 3,
      },
      notableFact: "event:academic-scholarship",
      addResume: {
        category: "special_experience",
        title: "Received an academic scholarship",
        summary: "Academic momentum translated into scholarship or official recognition.",
        tags: ["scholarship", "academic"],
      },
    },
  },
  {
    id: "teacher-attention",
    title: "Teacher Attention",
    severity: "routine",
    phase: "monthly",
    polarity: "positive",
    triggerMonths: ALL_MONTHS,
    conditions: ["academic_streak_high"],
    baseWeight: 6,
    maxOccurrences: 2,
    summary: "Consistent work gets noticed and opens a little more guidance or opportunity.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: 3,
        fulfillment: 4,
      },
      risk: {
        academicRisk: -3,
      },
      notableFact: "event:teacher-attention",
      addResume: {
        category: "special_experience",
        title: "Received faculty recognition",
        summary: "A teacher noticed consistent work and offered more guidance or opportunities.",
        tags: ["faculty", "academic"],
      },
    },
  },
  {
    id: "social-mutual-aid",
    title: "Social Mutual Aid",
    severity: "routine",
    phase: "monthly",
    polarity: "positive",
    triggerMonths: ALL_MONTHS,
    conditions: ["social_high"],
    baseWeight: 6,
    summary: "Good social ties increase the odds of classmates sharing resources and reminders.",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: -3,
        mood: 2,
      },
      risk: {
        academicRisk: -2,
      },
      notableFact: "event:social-mutual-aid",
    },
  },
  {
    id: "economic-pressure",
    title: "Economic Pressure",
    severity: "critical",
    phase: "monthly",
    polarity: "negative",
    triggerMonths: ALL_MONTHS,
    conditions: ["money_low"],
    baseWeight: 9,
    summary: "A thin wallet starts distorting mood, bandwidth, and day-to-day choices.",
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
      notableFact: "event:economic-pressure",
    },
  },
  {
    id: "stress-surge",
    title: "Stress Surge",
    severity: "important",
    phase: "monthly",
    polarity: "negative",
    triggerMonths: ALL_MONTHS,
    conditions: ["stress_high"],
    baseWeight: 8,
    summary: "A month of sustained pressure starts cutting into sleep, patience, and follow-through.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -2,
        stress: 4,
        fulfillment: -2,
      },
      risk: {
        burnout: 2,
      },
      flags: ["stress-surge"],
      notableFact: "event:stress-surge",
    },
  },
  {
    id: "burnout-slump",
    title: "Burnout Slump",
    severity: "critical",
    phase: "monthly",
    polarity: "negative",
    triggerMonths: ALL_MONTHS,
    conditions: ["mood_low", "stress_high"],
    baseWeight: 10,
    summary: "High stress and low mood combine into a rough slump that drags everything down.",
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
      notableFact: "event:burnout-slump",
    },
  },
  {
    id: "monthly-routine-reset",
    title: "Routine Reset",
    severity: "routine",
    phase: "monthly",
    polarity: "neutral",
    triggerMonths: ALL_MONTHS,
    conditions: ["always"],
    baseWeight: 2,
    fallback: true,
    summary: "Even a quiet month leaves a small trace in routine and self-perception.",
    supportsRemedy: false,
    effect: {
      stats: {
        mood: 1,
        fulfillment: 1,
      },
      notableFact: "event:monthly-routine-reset",
    },
  },
];

export const actionEventTemplates: EventRuleTemplate[] = [
  {
    id: "stress-spillover",
    title: "Stress Spillover",
    severity: "important",
    phase: "action",
    polarity: "negative",
    triggerMonths: ALL_MONTHS,
    actionTypes: ["study", "job_prep", "part_time", "student_activity", "remedy"],
    conditions: ["stress_high"],
    baseWeight: 7,
    summary: "Carrying too much stress makes even normal actions spill into extra strain.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -2,
        stress: 3,
      },
      risk: {
        burnout: 1,
      },
      flags: ["instant-event:stress-spillover"],
      notableFact: "event:stress-spillover",
    },
  },
  {
    id: "study-group-help",
    title: "Study Group Help",
    severity: "routine",
    phase: "action",
    polarity: "positive",
    triggerMonths: ALL_MONTHS,
    actionTypes: ["study", "job_prep", "social", "student_activity", "remedy"],
    conditions: ["social_high"],
    baseWeight: 6,
    summary: "Strong social ties sometimes turn into practical help right after an action.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: 1,
        stress: -2,
      },
      risk: {
        academicRisk: -2,
      },
      flags: ["instant-event:study-group-help"],
      notableFact: "event:study-group-help",
    },
  },
  {
    id: "teacher-nudge",
    title: "Teacher Nudge",
    severity: "routine",
    phase: "action",
    polarity: "positive",
    triggerMonths: ALL_MONTHS,
    actionTypes: ["study", "remedy"],
    conditions: ["academic_streak_high"],
    baseWeight: 5,
    summary: "Strong study momentum can trigger timely encouragement or direction from a teacher.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: 2,
        fulfillment: 2,
      },
      risk: {
        academicRisk: -1,
      },
      flags: ["instant-event:teacher-nudge"],
      notableFact: "event:teacher-nudge",
    },
  },
  {
    id: "cash-crunch",
    title: "Cash Crunch",
    severity: "important",
    phase: "action",
    polarity: "negative",
    triggerMonths: ALL_MONTHS,
    actionTypes: ["study", "job_prep", "part_time", "social", "relax", "student_activity", "remedy"],
    conditions: ["money_low"],
    baseWeight: 8,
    summary: "Low cash makes follow-through harder and adds distraction after ordinary choices.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -2,
        stress: 3,
      },
      flags: ["instant-event:cash-crunch"],
      notableFact: "event:cash-crunch",
    },
  },
];

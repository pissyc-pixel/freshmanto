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

const CITY_EXPENSE_RATIO_ADJUSTMENT = {
  tier_1: 0.05,
  tier_2: 0.02,
  tier_3: -0.03,
} as const;

const OPTIONAL_MONTHLY_SPEND_BY_BACKGROUND = {
  struggling: 0,
  ordinary: 0,
  stable: 40,
  "well-connected": 70,
  affluent: 110,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getNecessaryExpenseRatio(monthlyAllowance: number): number {
  if (monthlyAllowance <= 900) {
    return 0.91;
  }

  if (monthlyAllowance <= 1300) {
    return 0.84;
  }

  if (monthlyAllowance <= 1800) {
    return 0.73;
  }

  if (monthlyAllowance <= 2500) {
    return 0.64;
  }

  return 0.55;
}

function getNecessaryExpenseRatioCap(monthlyAllowance: number): number {
  if (monthlyAllowance <= 900) {
    return 0.94;
  }

  if (monthlyAllowance <= 1300) {
    return 0.88;
  }

  if (monthlyAllowance <= 1800) {
    return 0.78;
  }

  if (monthlyAllowance <= 2500) {
    return 0.7;
  }

  return 0.62;
}

export function getMonthlyLivingExpense(run: GameRun): number {
  const allowance = Math.max(0, run.profile.monthlyAllowance);
  const ratio = clamp(
    getNecessaryExpenseRatio(allowance) + CITY_EXPENSE_RATIO_ADJUSTMENT[run.profile.cityTier],
    0.48,
    getNecessaryExpenseRatioCap(allowance),
  );
  const optionalSpend = allowance > 1300
    ? OPTIONAL_MONTHLY_SPEND_BY_BACKGROUND[run.profile.familyBackground]
    : 0;
  const rawExpense = allowance * ratio + optionalSpend;
  const lowAllowanceCap = allowance <= 1300 ? Math.max(0, allowance - 60) : allowance * 0.92;

  return roundToNearestTen(Math.min(rawExpense, lowAllowanceCap));
}

export function getWeeklyAllowance(run: GameRun): number {
  return Math.round(run.profile.monthlyAllowance / 4);
}

export function getWeeklyLivingExpense(run: GameRun): number {
  return Math.round(getMonthlyLivingExpense(run) / 4);
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
    baseWeight: 5,
    summary: "Carrying too much stress makes even normal actions spill into extra strain.",
    supportsRemedy: true,
    effect: {
      stats: {
        mood: -2,
        stress: 2,
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

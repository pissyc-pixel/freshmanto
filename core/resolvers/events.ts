import {
  actionEventTemplates,
  getMoneyPressureLine,
  starterEventTemplates,
  type EventRuleCondition,
  type EventRuleTemplate,
} from "@/data/events";
import type { ActionType, DynamicStats, GameRun, ResumeItem, RiskState } from "@/types/game";

type EventResolution = {
  eventIds: string[];
  flags: string[];
  notableFacts: string[];
  resumeAdditions: ResumeItem[];
  stats: DynamicStats;
  moneyDelta: number;
  risk: RiskState;
};

type ActionEventResolution = {
  eventId?: string;
  flags: string[];
  resumeAdditions: ResumeItem[];
  stats: DynamicStats;
  moneyDelta: number;
  risk: RiskState;
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

function countEventOccurrences(run: GameRun, eventId: string): number {
  return run.monthlySummaries.reduce(
    (count, summary) => count + summary.eventIds.filter((id) => id === eventId).length,
    0,
  );
}

function recentAcademicMomentum(run: GameRun): number {
  return run.monthlySummaries.slice(-2).filter((summary) => {
    const strongFeedback = summary.academicFeedback === "excellent" || summary.academicFeedback === "stable";
    return strongFeedback && summary.actions.includes("study");
  }).length;
}

function matchesCondition(run: GameRun, condition: EventRuleCondition): boolean {
  switch (condition) {
    case "always":
      return true;
    case "money_low":
      return run.stats.money <= getMoneyPressureLine(run);
    case "stress_high":
      return run.stats.stress >= 68;
    case "academic_risk_high":
      return run.risk.academicRisk >= 16;
    case "social_low":
      return run.stats.social <= 25;
    case "social_high":
      return run.stats.social >= 60;
    case "mood_low":
      return run.stats.mood <= 28;
    case "academic_streak_high":
      return recentAcademicMomentum(run) >= 2 || run.stats.semesterAcademics >= 62;
    default:
      return false;
  }
}

function conditionWeightBonus(run: GameRun, condition: EventRuleCondition): number {
  switch (condition) {
    case "always":
      return 1;
    case "money_low":
      return Math.max(0, Math.ceil((getMoneyPressureLine(run) - run.stats.money) / 180));
    case "stress_high":
      if (run.stats.stress >= 88) {
        return 5;
      }
      if (run.stats.stress >= 78) {
        return 3;
      }
      return run.stats.stress >= 68 ? 1 : 0;
    case "academic_risk_high":
      return Math.max(0, Math.ceil((run.risk.academicRisk - 15) / 5));
    case "social_low":
      return run.stats.social <= 15 ? 3 : run.stats.social <= 25 ? 1 : 0;
    case "social_high":
      return run.stats.social >= 80 ? 4 : run.stats.social >= 70 ? 3 : run.stats.social >= 60 ? 1 : 0;
    case "mood_low":
      return run.stats.mood <= 12 ? 4 : run.stats.mood <= 20 ? 3 : run.stats.mood <= 28 ? 1 : 0;
    case "academic_streak_high": {
      const streakBonus = recentAcademicMomentum(run) * 2;
      const academicsBonus =
        run.stats.semesterAcademics >= 80 ? 4 : run.stats.semesterAcademics >= 70 ? 3 : run.stats.semesterAcademics >= 62 ? 1 : 0;
      return streakBonus + academicsBonus;
    }
    default:
      return 0;
  }
}

function deterministicRoll(seed: string): number {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003;
  }

  return (hash % 1000) / 1000;
}

function resolveNumber(value: number | ((run: GameRun) => number) | undefined, run: GameRun): number {
  if (value === undefined) {
    return 0;
  }

  return typeof value === "function" ? value(run) : value;
}

function resolveText(value: string | ((run: GameRun) => string) | undefined, run: GameRun): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "function" ? value(run) : value;
}

function buildStatsDelta(template: EventRuleTemplate): DynamicStats {
  return {
    money: template.effect.stats?.money ?? 0,
    mood: template.effect.stats?.mood ?? 0,
    stress: template.effect.stats?.stress ?? 0,
    fulfillment: template.effect.stats?.fulfillment ?? 0,
    social: template.effect.stats?.social ?? 0,
    semesterAcademics: template.effect.stats?.semesterAcademics ?? 0,
  };
}

function buildRiskDelta(template: EventRuleTemplate): RiskState {
  return {
    academicRisk: template.effect.risk?.academicRisk ?? 0,
    burnout: template.effect.risk?.burnout ?? 0,
  };
}

function createResumeItem(run: GameRun, month: number, template: EventRuleTemplate): ResumeItem | null {
  if (!template.effect.addResume) {
    return null;
  }

  return {
    id: `${run.id}-${month}-${template.id}`,
    category: template.effect.addResume.category,
    title: template.effect.addResume.title,
    summary: template.effect.addResume.summary,
    month,
    tags: template.effect.addResume.tags,
  };
}

function resolveBaseWeight(run: GameRun, template: EventRuleTemplate): number {
  return typeof template.baseWeight === "function" ? template.baseWeight(run) : template.baseWeight;
}

function polarityWeightBonus(run: GameRun, template: EventRuleTemplate): number {
  if (template.polarity === "negative") {
    let bonus = 0;

    if (run.stats.stress >= 80) {
      bonus += 3;
    } else if (run.stats.stress >= 68) {
      bonus += 1;
    }

    if (run.stats.mood <= 20) {
      bonus += 2;
    }

    return bonus;
  }

  if (template.polarity === "positive") {
    let bonus = 0;

    if (run.stats.social >= 60) {
      bonus += 1;
    }
    if (run.stats.semesterAcademics >= 62) {
      bonus += 1;
    }
    if (run.stats.stress >= 85) {
      bonus -= 1;
    }

    return bonus;
  }

  return 0;
}

function canTriggerTemplate(run: GameRun, month: number, template: EventRuleTemplate): boolean {
  if (!template.triggerMonths.includes(month)) {
    return false;
  }

  if (template.maxOccurrences !== undefined && countEventOccurrences(run, template.id) >= template.maxOccurrences) {
    return false;
  }

  return template.conditions.every((condition) => matchesCondition(run, condition));
}

function computeTemplateWeight(run: GameRun, month: number, template: EventRuleTemplate): number {
  if (!canTriggerTemplate(run, month, template)) {
    return 0;
  }

  const conditionBonus = template.conditions.reduce((total, condition) => total + conditionWeightBonus(run, condition), 0);
  return Math.max(0, resolveBaseWeight(run, template) + conditionBonus + polarityWeightBonus(run, template));
}

function pickWeightedTemplate(
  weightedTemplates: Array<{ template: EventRuleTemplate; weight: number }>,
  seed: string,
): EventRuleTemplate | null {
  if (weightedTemplates.length === 0) {
    return null;
  }

  const totalWeight = weightedTemplates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  const target = deterministicRoll(seed) * totalWeight;
  let cursor = 0;

  for (const item of weightedTemplates) {
    cursor += item.weight;
    if (target <= cursor) {
      return item.template;
    }
  }

  return weightedTemplates[weightedTemplates.length - 1]?.template ?? null;
}

function applyTemplate(
  resolution: EventResolution,
  template: EventRuleTemplate,
  run: GameRun,
  month: number,
): EventResolution {
  const statsDelta = buildStatsDelta(template);
  const riskDelta = buildRiskDelta(template);
  const resolvedMoneyDelta = resolveNumber(template.effect.money, run);
  const notableFact = resolveText(template.effect.notableFact, run);
  const resumeAddition = createResumeItem(run, month, template);

  resolution.eventIds.push(template.id);
  resolution.flags.push(...(template.effect.flags ?? []));
  resolution.moneyDelta += resolvedMoneyDelta;
  resolution.risk.academicRisk += riskDelta.academicRisk;
  resolution.risk.burnout += riskDelta.burnout;
  resolution.stats.money += statsDelta.money;
  resolution.stats.mood += statsDelta.mood;
  resolution.stats.stress += statsDelta.stress;
  resolution.stats.fulfillment += statsDelta.fulfillment;
  resolution.stats.social += statsDelta.social;
  resolution.stats.semesterAcademics += statsDelta.semesterAcademics;

  if (notableFact) {
    resolution.notableFacts.push(notableFact);
  }

  if (resumeAddition) {
    resolution.resumeAdditions.push(resumeAddition);
  }

  return resolution;
}

function emptyEventResolution(): EventResolution {
  return {
    eventIds: [],
    flags: [],
    notableFacts: [],
    resumeAdditions: [],
    stats: emptyStatsDelta(),
    moneyDelta: 0,
    risk: {
      academicRisk: 0,
      burnout: 0,
    },
  };
}

function emptyActionEventResolution(): ActionEventResolution {
  return {
    flags: [],
    resumeAdditions: [],
    stats: emptyStatsDelta(),
    moneyDelta: 0,
    risk: {
      academicRisk: 0,
      burnout: 0,
    },
  };
}

export function getMonthlyEventWeight(run: GameRun, month: number, eventId: string): number {
  const template = starterEventTemplates.find((item) => item.id === eventId && item.phase === "monthly");
  if (!template) {
    return 0;
  }

  return computeTemplateWeight(run, month, template);
}

export function resolveActionLinkedEvent(run: GameRun, action: ActionType): ActionEventResolution {
  const month = run.currentMonth;
  const weightedTemplates = actionEventTemplates
    .filter((template) => template.actionTypes?.includes(action))
    .map((template) => ({
      template,
      weight: computeTemplateWeight(run, month, template),
    }))
    .filter((item) => item.weight > 0);

  const chosenTemplate = pickWeightedTemplate(
    weightedTemplates,
    `${run.id}:${run.currentYear}:${month}:${run.activeMonth?.currentWeek ?? 1}:${action}:instant`,
  );

  if (!chosenTemplate) {
    return emptyActionEventResolution();
  }

  const statsDelta = buildStatsDelta(chosenTemplate);
  const riskDelta = buildRiskDelta(chosenTemplate);
  const moneyDelta = resolveNumber(chosenTemplate.effect.money, run);
  const resumeAddition = createResumeItem(run, month, chosenTemplate);

  return {
    eventId: chosenTemplate.id,
    flags: [...(chosenTemplate.effect.flags ?? [])],
    resumeAdditions: resumeAddition ? [resumeAddition] : [],
    stats: statsDelta,
    moneyDelta,
    risk: riskDelta,
  };
}

export function resolveMonthEvents(run: GameRun, month: number): EventResolution {
  const resolution = emptyEventResolution();
  const primaryTemplates = starterEventTemplates.filter((template) => template.phase === "monthly" && !template.fallback);
  const fallbackTemplates = starterEventTemplates.filter((template) => template.phase === "monthly" && template.fallback);
  const weightedPrimaryTemplates = primaryTemplates
    .map((template) => ({
      template,
      weight: computeTemplateWeight(run, month, template),
    }))
    .filter((item) => item.weight > 0);

  const chosenPrimary = pickWeightedTemplate(
    weightedPrimaryTemplates,
    `${run.id}:${run.currentYear}:${month}:monthly-primary`,
  );

  if (chosenPrimary) {
    return applyTemplate(resolution, chosenPrimary, run, month);
  }

  const weightedFallbackTemplates = fallbackTemplates
    .map((template) => ({
      template,
      weight: computeTemplateWeight(run, month, template),
    }))
    .filter((item) => item.weight > 0);

  const chosenFallback =
    pickWeightedTemplate(weightedFallbackTemplates, `${run.id}:${run.currentYear}:${month}:monthly-fallback`) ??
    fallbackTemplates[0] ??
    null;

  if (!chosenFallback) {
    return resolution;
  }

  return applyTemplate(resolution, chosenFallback, run, month);
}

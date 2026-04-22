import { getMonthlyLivingExpense, starterEventTemplates, type EventRuleCondition, type EventRuleTemplate } from "@/data/events";
import type { DynamicStats, GameRun, ResumeItem, RiskState } from "@/types/game";

type EventResolution = {
  eventIds: string[];
  flags: string[];
  notableFacts: string[];
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

function addStats(base: DynamicStats, delta: DynamicStats): DynamicStats {
  return {
    money: base.money + delta.money,
    mood: Math.min(100, Math.max(0, base.mood + delta.mood)),
    stress: Math.min(100, Math.max(0, base.stress + delta.stress)),
    fulfillment: Math.min(100, Math.max(0, base.fulfillment + delta.fulfillment)),
    social: Math.min(100, Math.max(0, base.social + delta.social)),
    semesterAcademics: Math.min(100, Math.max(0, base.semesterAcademics + delta.semesterAcademics)),
  };
}

function addRisk(base: RiskState, delta: RiskState): RiskState {
  return {
    academicRisk: Math.max(0, base.academicRisk + delta.academicRisk),
    burnout: Math.max(0, base.burnout + delta.burnout),
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
      return run.stats.money <= Math.max(500, Math.round(getMonthlyLivingExpense(run) * 0.75));
    case "stress_high":
      return run.stats.stress >= 75;
    case "academic_risk_high":
      return run.risk.academicRisk >= 16;
    case "social_low":
      return run.stats.social <= 25;
    case "social_high":
      return run.stats.social >= 60;
    case "mood_low":
      return run.stats.mood <= 25;
    case "academic_streak_high":
      return recentAcademicMomentum(run) >= 2 || run.stats.semesterAcademics >= 65;
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

function resolvesChance(run: GameRun, month: number, template: EventRuleTemplate): boolean {
  if (template.chance === undefined) {
    return true;
  }

  return deterministicRoll(`${run.id}:${month}:${template.id}`) < template.chance;
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

export function resolveMonthEvents(run: GameRun, month: number): EventResolution {
  const stats = emptyStatsDelta();
  const risk: RiskState = {
    academicRisk: 0,
    burnout: 0,
  };
  const eventIds: string[] = [];
  const flags: string[] = [];
  const notableFacts: string[] = [];
  const resumeAdditions: ResumeItem[] = [];
  let moneyDelta = 0;
  let projectedRun = run;

  for (const template of starterEventTemplates) {
    if (!template.triggerMonths.includes(month)) {
      continue;
    }

    if (template.maxOccurrences !== undefined && countEventOccurrences(run, template.id) >= template.maxOccurrences) {
      continue;
    }

    if (!template.conditions.every((condition) => matchesCondition(projectedRun, condition))) {
      continue;
    }

    if (!resolvesChance(projectedRun, month, template)) {
      continue;
    }

    const statsDelta = buildStatsDelta(template);
    const riskDelta = buildRiskDelta(template);
    const resolvedMoneyDelta = resolveNumber(template.effect.money, projectedRun);
    const notableFact = resolveText(template.effect.notableFact, projectedRun);
    const resumeAddition = createResumeItem(projectedRun, month, template);

    eventIds.push(template.id);
    flags.push(...(template.effect.flags ?? []));
    moneyDelta += resolvedMoneyDelta;
    risk.academicRisk += riskDelta.academicRisk;
    risk.burnout += riskDelta.burnout;
    stats.money += statsDelta.money;
    stats.mood += statsDelta.mood;
    stats.stress += statsDelta.stress;
    stats.fulfillment += statsDelta.fulfillment;
    stats.social += statsDelta.social;
    stats.semesterAcademics += statsDelta.semesterAcademics;

    if (notableFact) {
      notableFacts.push(notableFact);
    }

    if (resumeAddition) {
      resumeAdditions.push(resumeAddition);
    }

    projectedRun = {
      ...projectedRun,
      stats: addStats(projectedRun.stats, {
        ...statsDelta,
        money: statsDelta.money + resolvedMoneyDelta,
      }),
      risk: addRisk(projectedRun.risk, riskDelta),
    };
  }

  return {
    eventIds,
    flags,
    notableFacts,
    resumeAdditions,
    stats,
    moneyDelta,
    risk,
  };
}

import { starterEventTemplates } from "@/data/events";
import type { DynamicStats, EventTemplate, GameRun, ResumeItem, RiskState } from "@/types/game";

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

function matchesCondition(run: GameRun, template: EventTemplate): boolean {
  switch (template.condition) {
    case "always":
      return true;
    case "money_low":
      return run.stats.money < run.profile.monthlyAllowance * 0.5;
    case "stress_high":
      return run.stats.stress >= 70;
    case "academic_risk_high":
      return run.risk.academicRisk >= 16;
    case "social_low":
      return run.stats.social <= 25;
    default:
      return false;
  }
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

  for (const template of starterEventTemplates) {
    if (!template.triggerMonths.includes(month) || !matchesCondition(run, template)) {
      continue;
    }

    eventIds.push(template.id);
    moneyDelta += template.effect.money ?? 0;
    risk.academicRisk += template.effect.academicRisk ?? 0;
    flags.push(...(template.effect.flags ?? []));

    if (template.effect.notableFact) {
      notableFacts.push(template.effect.notableFact);
    }

    if (template.effect.stats) {
      stats.money += template.effect.stats.money ?? 0;
      stats.mood += template.effect.stats.mood ?? 0;
      stats.stress += template.effect.stats.stress ?? 0;
      stats.fulfillment += template.effect.stats.fulfillment ?? 0;
      stats.social += template.effect.stats.social ?? 0;
      stats.semesterAcademics += template.effect.stats.semesterAcademics ?? 0;
    }

    if (template.effect.addResume) {
      resumeAdditions.push({
        id: `${run.id}-${month}-${template.id}`,
        category: template.effect.addResume.category,
        title: template.effect.addResume.title,
        summary: template.effect.addResume.summary,
        month,
        tags: template.effect.addResume.tags,
      });
    }
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

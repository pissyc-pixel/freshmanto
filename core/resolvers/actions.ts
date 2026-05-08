import { getWeeklyAllowance, getWeeklyLivingExpense } from "@/data/events";
import { resolveActionLinkedEvent } from "@/core/resolvers/events";
import type {
  ActionType,
  DynamicStats,
  FamilyBackground,
  GameRun,
  MonthlyActionPlan,
  ResolvedAction,
  ResumeItem,
  RiskState,
} from "@/types/game";

type SupportedAction = ActionType;

type ActionResolution = {
  stats: DynamicStats;
  moneyDelta: number;
  risk: RiskState;
  resolvedActions: ResolvedAction[];
  flags: string[];
  resumeAdditions: ResumeItem[];
  askFamilyUsed: boolean;
};

type ResolveActionPlanOptions = {
  suppressAllowanceCorrection?: boolean;
  suppressWeeklySettlement?: boolean;
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

function familySupportAmount(background: FamilyBackground): number {
  const amounts: Record<FamilyBackground, number> = {
    struggling: 600,
    ordinary: 1000,
    stable: 1600,
    "well-connected": 2400,
    affluent: 3200,
  };

  return amounts[background];
}

function createResumeItem(run: GameRun, title: string, summary: string, category: ResumeItem["category"]): ResumeItem {
  return {
    id: `${run.id}-${run.currentMonth}-${title}`,
    category,
    title,
    summary,
    month: run.currentMonth,
    tags: [category, `year-${run.currentYear}`],
  };
}

function roundToNearestTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function countConsecutiveStudyMonths(run: GameRun): number {
  let streak = 0;

  for (let index = run.monthlySummaries.length - 1; index >= 0; index -= 1) {
    if (!run.monthlySummaries[index].actions.includes("study")) {
      break;
    }
    streak += 1;
  }

  return streak;
}

function countStudyTurnsThisMonth(run: GameRun): number {
  return run.activeMonth?.turns.filter(
    (turn) => turn.resolvedAction.accepted && turn.resolvedAction.action === "study",
  ).length ?? 0;
}

function productivityMultiplier(run: GameRun): number {
  let multiplier = 1;

  if (run.stats.stress >= 90) {
    multiplier *= 0.4;
  } else if (run.stats.stress >= 80) {
    multiplier *= 0.52;
  } else if (run.stats.stress >= 65) {
    multiplier *= 0.72;
  }

  if (run.stats.mood <= 10) {
    multiplier *= 0.55;
  } else if (run.stats.mood <= 25) {
    multiplier *= 0.72;
  } else if (run.stats.mood <= 40) {
    multiplier *= 0.86;
  }

  return Math.max(0.2, Number(multiplier.toFixed(2)));
}

function studyStreakMultiplier(run: GameRun, studyCountThisMonth: number): number {
  const streak = countConsecutiveStudyMonths(run) + countStudyTurnsThisMonth(run) + studyCountThisMonth;

  if (streak <= 0) {
    return 1;
  }
  if (streak === 1) {
    return 0.74;
  }
  if (streak === 2) {
    return 0.58;
  }
  if (streak === 3) {
    return 0.46;
  }
  return 0.34;
}

function refusalReason(run: GameRun, action: SupportedAction): string | null {
  if (action === "study" && (run.stats.stress >= 90 || run.stats.mood <= 8)) {
    return "state-refused-study";
  }

  if (
    (action === "job_prep" ||
      action === "part_time" ||
      action === "postgraduate_prep" ||
      action === "public_exam_prep" ||
      action === "competition_project") &&
    (run.stats.stress >= 90 || run.stats.mood <= 10)
  ) {
    return "state-refused-work";
  }

  return null;
}

function isProductiveAction(action: SupportedAction): boolean {
  return (
    action === "study" ||
    action === "job_prep" ||
    action === "postgraduate_prep" ||
    action === "public_exam_prep" ||
    action === "competition_project" ||
    action === "part_time" ||
    action === "remedy"
  );
}

function shouldApplyWeeklySettlement(run: GameRun, action: SupportedAction): boolean {
  if (action === "big_meal" || action === "ask_family" || action === "skip_class" || action === "idle") {
    return false;
  }

  const activeMonth = run.activeMonth;
  if (!activeMonth) {
    return true;
  }

  return !activeMonth.turns.some((turn) => turn.week === activeMonth.currentWeek && turn.advancesCalendar);
}

function projectRun(run: GameRun, statsDelta: DynamicStats, moneyDelta: number, riskDelta: RiskState): GameRun {
  return {
    ...run,
    stats: addStats(run.stats, {
      ...statsDelta,
      money: statsDelta.money + moneyDelta,
    }),
    risk: addRisk(run.risk, riskDelta),
  };
}

export function resolveActionPlan(
  run: GameRun,
  plan: MonthlyActionPlan,
  options: ResolveActionPlanOptions = {},
): ActionResolution {
  const stats = emptyStatsDelta();
  const risk: RiskState = {
    academicRisk: 0,
    burnout: 0,
  };
  const resolvedActions: ResolvedAction[] = [];
  const flags: string[] = [];
  const resumeAdditions: ResumeItem[] = [];
  let moneyDelta = 0;
  let askFamilyUsed = false;
  let studyCountThisMonth = 0;
  let projectedRun = run;
  let monthlyAllowanceCorrected = projectedRun.activeMonth?.allowanceApplied ?? false;
  let weeklySettlementHandled = false;

  for (const requestedAction of plan.actions) {
    const action = requestedAction.action as SupportedAction;

    if (!monthlyAllowanceCorrected && !options.suppressAllowanceCorrection) {
      moneyDelta -= projectedRun.profile.monthlyAllowance;
      monthlyAllowanceCorrected = true;
      projectedRun = projectRun(projectedRun, emptyStatsDelta(), -projectedRun.profile.monthlyAllowance, {
        academicRisk: 0,
        burnout: 0,
      });
    }

    if (
      !options.suppressWeeklySettlement &&
      !weeklySettlementHandled &&
      shouldApplyWeeklySettlement(projectedRun, action)
    ) {
      const weeklyBudgetDelta = getWeeklyAllowance(projectedRun) - getWeeklyLivingExpense(projectedRun);

      moneyDelta += weeklyBudgetDelta;
      weeklySettlementHandled = true;
      projectedRun = projectRun(projectedRun, emptyStatsDelta(), weeklyBudgetDelta, {
        academicRisk: 0,
        burnout: 0,
      });
    }

    if (action === "part_time" && requestedAction.time === "night") {
      resolvedActions.push({
        ...requestedAction,
        accepted: false,
        reason: "invalid-night-part-time",
      });
      flags.push("invalid-night-part-time");
      continue;
    }

    if (action === "ask_family") {
      if (projectedRun.cooldowns.askFamilyMonths > 0) {
        resolvedActions.push({
          ...requestedAction,
          accepted: false,
          reason: "ask-family-on-cooldown",
        });
        flags.push("ask-family-on-cooldown");
        stats.stress += 2;
        projectedRun = projectRun(projectedRun, {
          ...emptyStatsDelta(),
          stress: 2,
        }, 0, {
          academicRisk: 0,
          burnout: 0,
        });
        continue;
      }

      const support = familySupportAmount(projectedRun.profile.familyBackground);

      moneyDelta += support;
      stats.stress += 12;
      stats.mood -= 2;
      askFamilyUsed = true;
      resolvedActions.push({
        ...requestedAction,
        accepted: true,
      });
      projectedRun = projectRun(projectedRun, {
        ...emptyStatsDelta(),
        stress: 12,
        mood: -2,
      }, support, {
        academicRisk: 0,
        burnout: 0,
      });
      continue;
    }

    const stateRefusalReason = refusalReason(projectedRun, action);
    if (stateRefusalReason) {
      resolvedActions.push({
        ...requestedAction,
        accepted: false,
        reason: stateRefusalReason,
      });
      flags.push(stateRefusalReason);
      stats.stress += 1;
      projectedRun = projectRun(projectedRun, {
        ...emptyStatsDelta(),
        stress: 1,
      }, 0, {
        academicRisk: 0,
        burnout: 0,
      });
      continue;
    }

    const efficiency = productivityMultiplier(projectedRun);
    resolvedActions.push({
      ...requestedAction,
      accepted: true,
    });

    if (isProductiveAction(action) && efficiency < 1) {
      flags.push("stress-efficiency-penalty");
    }

    const actionStatsDelta = emptyStatsDelta();
    const actionRiskDelta: RiskState = {
      academicRisk: 0,
      burnout: 0,
    };
    let actionMoneyDelta = 0;

    switch (action) {
      case "study": {
        const studyMultiplier = Number((efficiency * studyStreakMultiplier(projectedRun, studyCountThisMonth)).toFixed(2));
        studyCountThisMonth += 1;

        if (studyMultiplier < 1) {
          flags.push("study-diminishing-returns");
        }

        if (studyMultiplier <= 0.55) {
          flags.push("study-efficiency-collapsed");
        }

        actionStatsDelta.semesterAcademics += Math.max(1, Math.round(5 * studyMultiplier));
        actionStatsDelta.stress += 6;
        actionStatsDelta.mood -= studyMultiplier <= 0.5 ? 2 : 1;
        actionStatsDelta.fulfillment += Math.max(1, Math.round(2 * Math.max(0.6, studyMultiplier)));
        actionRiskDelta.academicRisk -= Math.max(1, Math.round(2 * Math.max(0.55, studyMultiplier)));
        break;
      }
      case "job_prep":
        actionStatsDelta.stress += 4;
        actionStatsDelta.fulfillment += Math.max(1, Math.round(2 * efficiency));
        actionStatsDelta.money -= 60;
        resumeAdditions.push(
          createResumeItem(run, "Resume Sprint", "Started tightening the resume and testing job directions.", "job_progress"),
        );
        break;
      case "postgraduate_prep":
        actionStatsDelta.stress += 5;
        actionStatsDelta.semesterAcademics += Math.max(2, Math.round(4 * efficiency));
        actionStatsDelta.fulfillment += Math.max(1, Math.round(2 * efficiency));
        actionStatsDelta.mood -= efficiency < 0.7 ? 1 : 0;
        actionRiskDelta.academicRisk -= Math.max(1, Math.round(2 * Math.max(0.65, efficiency)));
        if (run.currentYear >= 3) {
          resumeAdditions.push(
            createResumeItem(run, "Postgraduate Prep", "Started to prepare a more explicit postgraduate study rhythm.", "research"),
          );
        }
        break;
      case "public_exam_prep":
        actionStatsDelta.stress += 4;
        actionStatsDelta.fulfillment += Math.max(1, Math.round(2 * efficiency));
        actionStatsDelta.money -= 40;
        if (run.currentYear >= 3) {
          resumeAdditions.push(
            createResumeItem(run, "Public Exam Prep", "Started building a stable public exam preparation rhythm.", "project"),
          );
        }
        break;
      case "competition_project":
        actionStatsDelta.stress += 5;
        actionStatsDelta.fulfillment += Math.max(2, Math.round(3 * efficiency));
        actionStatsDelta.semesterAcademics += Math.max(1, Math.round(3 * efficiency));
        actionStatsDelta.money -= 50;
        resumeAdditions.push(
          createResumeItem(run, "Competition Project", "Put another day into a longer competition or project line.", "competition"),
        );
        break;
      case "part_time":
        actionMoneyDelta += roundToNearestTen(360 * efficiency);
        actionStatsDelta.stress += 5;
        actionStatsDelta.fulfillment += Math.max(1, Math.round(2 * efficiency));
        if (efficiency < 0.7) {
          actionStatsDelta.mood -= 1;
        }
        break;
      case "social":
        actionStatsDelta.money -= 120;
        actionStatsDelta.mood += 4;
        actionStatsDelta.social += 6;
        actionStatsDelta.stress -= 1;
        break;
      case "relax":
        actionStatsDelta.money -= 80;
        actionStatsDelta.mood += 6;
        actionStatsDelta.stress -= 5;
        break;
      case "idle":
        actionStatsDelta.mood += 2;
        actionStatsDelta.stress -= 2;
        break;
      case "big_meal":
        actionStatsDelta.money -= 180;
        actionStatsDelta.mood += 8;
        actionStatsDelta.stress -= 6;
        break;
      case "student_activity":
        actionStatsDelta.money -= 30;
        actionStatsDelta.mood += 2;
        actionStatsDelta.social += 4;
        actionStatsDelta.fulfillment += Math.max(2, Math.round(3 * Math.max(0.75, efficiency)));
        resumeAdditions.push(
          createResumeItem(run, "Campus Activity", "Joined a lecture, club, or student activity with visible participation.", "campus_activity"),
        );
        break;
      case "remedy":
        actionStatsDelta.money -= 60;
        actionStatsDelta.stress -= 6;
        actionStatsDelta.semesterAcademics += Math.max(2, Math.round(4 * Math.max(0.65, efficiency)));
        actionRiskDelta.academicRisk -= Math.max(3, Math.round(6 * Math.max(0.65, efficiency)));
        break;
      default:
        break;
    }

    stats.money += actionStatsDelta.money;
    stats.mood += actionStatsDelta.mood;
    stats.stress += actionStatsDelta.stress;
    stats.fulfillment += actionStatsDelta.fulfillment;
    stats.social += actionStatsDelta.social;
    stats.semesterAcademics += actionStatsDelta.semesterAcademics;
    risk.academicRisk += actionRiskDelta.academicRisk;
    risk.burnout += actionRiskDelta.burnout;
    moneyDelta += actionMoneyDelta;

    projectedRun = projectRun(projectedRun, actionStatsDelta, actionMoneyDelta, actionRiskDelta);

    const actionEvent = resolveActionLinkedEvent(projectedRun, action);
    if (actionEvent.eventId) {
      flags.push(actionEvent.eventId, ...actionEvent.flags);
    }

    stats.money += actionEvent.stats.money;
    stats.mood += actionEvent.stats.mood;
    stats.stress += actionEvent.stats.stress;
    stats.fulfillment += actionEvent.stats.fulfillment;
    stats.social += actionEvent.stats.social;
    stats.semesterAcademics += actionEvent.stats.semesterAcademics;
    risk.academicRisk += actionEvent.risk.academicRisk;
    risk.burnout += actionEvent.risk.burnout;
    moneyDelta += actionEvent.moneyDelta;
    resumeAdditions.push(...actionEvent.resumeAdditions);

    projectedRun = projectRun(projectedRun, actionEvent.stats, actionEvent.moneyDelta, actionEvent.risk);
  }

  risk.burnout += Math.max(0, Math.round(stats.stress / 4));

  return {
    stats,
    moneyDelta,
    risk,
    resolvedActions,
    flags,
    resumeAdditions,
    askFamilyUsed,
  };
}

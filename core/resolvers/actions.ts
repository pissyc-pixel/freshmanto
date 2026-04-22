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

  if (run.stats.stress >= 85) {
    multiplier *= 0.55;
  } else if (run.stats.stress >= 70) {
    multiplier *= 0.75;
  }

  if (run.stats.mood <= 15) {
    multiplier *= 0.7;
  } else if (run.stats.mood <= 35) {
    multiplier *= 0.85;
  }

  return Math.max(0.35, Number(multiplier.toFixed(2)));
}

function studyStreakMultiplier(run: GameRun, studyCountThisMonth: number): number {
  const streak = countConsecutiveStudyMonths(run) + countStudyTurnsThisMonth(run) + studyCountThisMonth;

  if (streak <= 0) {
    return 1;
  }
  if (streak === 1) {
    return 0.82;
  }
  if (streak === 2) {
    return 0.68;
  }
  return 0.55;
}

function refusalReason(run: GameRun, action: SupportedAction): string | null {
  if (action === "study" && (run.stats.stress >= 90 || run.stats.mood <= 8)) {
    return "state-refused-study";
  }

  if ((action === "job_prep" || action === "part_time") && (run.stats.stress >= 90 || run.stats.mood <= 10)) {
    return "state-refused-work";
  }

  return null;
}

function isProductiveAction(action: SupportedAction): boolean {
  return action === "study" || action === "job_prep" || action === "part_time" || action === "remedy";
}

export function resolveActionPlan(run: GameRun, plan: MonthlyActionPlan): ActionResolution {
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

  for (const requestedAction of plan.actions) {
    const action = requestedAction.action as SupportedAction;

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
      if (run.cooldowns.askFamilyMonths > 0) {
        resolvedActions.push({
          ...requestedAction,
          accepted: false,
          reason: "ask-family-on-cooldown",
        });
        flags.push("ask-family-on-cooldown");
        stats.stress += 2;
        continue;
      }

      const support = familySupportAmount(run.profile.familyBackground);
      moneyDelta += support;
      stats.stress += 12;
      stats.mood -= 2;
      askFamilyUsed = true;
      resolvedActions.push({
        ...requestedAction,
        accepted: true,
      });
      continue;
    }

    const stateRefusalReason = refusalReason(run, action);
    if (stateRefusalReason) {
      resolvedActions.push({
        ...requestedAction,
        accepted: false,
        reason: stateRefusalReason,
      });
      flags.push(stateRefusalReason);
      stats.stress += 1;
      continue;
    }

    const efficiency = productivityMultiplier(run);
    resolvedActions.push({
      ...requestedAction,
      accepted: true,
    });

    if (isProductiveAction(action) && efficiency < 1) {
      flags.push("stress-efficiency-penalty");
    }

    switch (action) {
      case "study": {
        const studyMultiplier = Number((efficiency * studyStreakMultiplier(run, studyCountThisMonth)).toFixed(2));
        studyCountThisMonth += 1;

        if (studyMultiplier < 1) {
          flags.push("study-diminishing-returns");
        }

        stats.semesterAcademics += Math.max(2, Math.round(8 * studyMultiplier));
        stats.stress += 5;
        stats.mood -= 1;
        stats.fulfillment += Math.max(1, Math.round(2 * studyMultiplier));
        risk.academicRisk -= Math.max(1, Math.round(2 * studyMultiplier));
        break;
      }
      case "job_prep":
        stats.stress += 3;
        stats.fulfillment += Math.max(1, Math.round(3 * efficiency));
        stats.money -= 40;
        resumeAdditions.push(
          createResumeItem(run, "简历投递准备", "开始整理方向、修改简历并尝试投递岗位。", "job_progress"),
        );
        break;
      case "part_time":
        moneyDelta += roundToNearestTen(420 * efficiency);
        stats.stress += 4;
        stats.fulfillment += Math.max(1, Math.round(2 * efficiency));
        if (efficiency < 0.7) {
          stats.mood -= 1;
        }
        break;
      case "social":
        stats.money -= 120;
        stats.mood += 4;
        stats.social += 6;
        stats.stress -= 1;
        break;
      case "relax":
        stats.money -= 80;
        stats.mood += 6;
        stats.stress -= 5;
        break;
      case "big_meal":
        stats.money -= 180;
        stats.mood += 8;
        stats.stress -= 6;
        stats.fulfillment += 1;
        break;
      case "student_activity":
        stats.money -= 30;
        stats.mood += 2;
        stats.social += 4;
        stats.fulfillment += Math.max(2, Math.round(4 * Math.max(0.75, efficiency)));
        resumeAdditions.push(
          createResumeItem(run, "校园活动参与", "参加讲座、社团或学生事务活动。", "campus_activity"),
        );
        break;
      case "remedy":
        stats.money -= 60;
        stats.stress -= 6;
        stats.semesterAcademics += Math.max(3, Math.round(5 * Math.max(0.75, efficiency)));
        risk.academicRisk -= Math.max(4, Math.round(7 * Math.max(0.75, efficiency)));
        break;
      default:
        break;
    }
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

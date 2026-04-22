import type {
  DynamicStats,
  FamilyBackground,
  GameRun,
  MonthlyActionPlan,
  ResolvedAction,
  ResumeItem,
  RiskState,
} from "@/types/game";

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

  for (const requestedAction of plan.actions) {
    if (requestedAction.action === "part_time" && requestedAction.time === "night") {
      resolvedActions.push({
        ...requestedAction,
        accepted: false,
        reason: "invalid-night-part-time",
      });
      flags.push("invalid-night-part-time");
      continue;
    }

    if (requestedAction.action === "ask_family") {
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

    resolvedActions.push({
      ...requestedAction,
      accepted: true,
    });

    switch (requestedAction.action) {
      case "study":
        stats.semesterAcademics += 12;
        stats.stress += 4;
        stats.mood -= 1;
        stats.fulfillment += 2;
        risk.academicRisk -= 3;
        break;
      case "job_prep":
        stats.stress += 2;
        stats.fulfillment += 3;
        stats.money -= 30;
        resumeAdditions.push(
          createResumeItem(run, "简历投递记录", "开始整理方向并投递岗位。", "job_progress"),
        );
        break;
      case "part_time":
        moneyDelta += 450;
        stats.stress += 3;
        stats.fulfillment += 1;
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
      case "student_activity":
        stats.money -= 30;
        stats.mood += 2;
        stats.social += 4;
        stats.fulfillment += 4;
        resumeAdditions.push(
          createResumeItem(run, "校园活动参与", "参加讲座、社团或学生事务活动。", "campus_activity"),
        );
        break;
      case "remedy":
        stats.money -= 60;
        stats.stress -= 6;
        stats.semesterAcademics += 6;
        risk.academicRisk -= 8;
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


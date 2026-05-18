import { describe, expect, it } from "vitest";

import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import {
  confirmPlannedWeek,
  createInitialGameRun,
  planWeeklyDayAction,
  selectWeekAttendanceStrategy,
} from "@/core/game-engine";
import { getMonthlyLivingExpense } from "@/data/events";
import type {
  GameRun,
  WeeklyActionOption,
} from "@/types/game";

function createCompetitionInviteRun(id: string) {
  const baseRun = createInitialGameRun({
    id,
    randomValues: [0.44, 0.2, 0.36, 0.58, 0.62, 0.48, 0.21, 0.39],
  });
  const withAttendance = selectWeekAttendanceStrategy(baseRun, "mixed");
  const project = withAttendance.competitionProjects?.find((item) => item.status === "open");

  if (!project) {
    throw new Error("Expected an open competition project for the weekly invite regression test.");
  }

  return {
    project,
    run: {
      ...withAttendance,
      activeMonth: {
        ...withAttendance.activeMonth!,
        currentWeekState: {
          ...withAttendance.activeMonth!.currentWeekState,
          event: {
            id: "weekly-competition-invite",
            title: `《${project.title}》说明会 / 招募会`,
            summary: `这周会接触到《${project.title}》这条长期比赛 / 项目线。`,
            weekday: "sat" as const,
            effectDescription: "周六会撞上一场项目说明会。",
            specialAction: {
              optionId: `weekly-competition-invite-attend:${project.id}`,
              action: "student_activity" as const,
              label: `参加《${project.title}》说明会`,
              description: "先去听说明会，把这条项目线接起来。",
              availability: ["night", "half_day", "full_day"] as WeeklyActionOption["availability"],
              source: "weekly_event" as const,
              sourceEventId: "weekly-competition-invite",
            },
            linkedProjectId: project.id,
            linkedProjectTitle: project.title,
            skipClosesProjectLine: true,
            defaultAttendIfUnplanned: true,
          },
        },
      },
    },
  };
}

describe("weekly confirmation regression", () => {
  it("does not auto-attend a competition invite when the player leaves the event day unplanned", () => {
    const { project, run } = createCompetitionInviteRun("competition-invite-unplanned");

    const result = confirmPlannedWeek(run);
    const saturdayResult = result.run.activeMonth?.latestWeekSettlement?.dailyResults.find(
      (day) => day.weekday === "sat",
    );
    const updatedProject = result.run.competitionProjects?.find((item) => item.id === project.id);

    expect(saturdayResult?.resolvedAction.action).toBe("idle");
    expect(saturdayResult?.resolvedAction.autoFilled).toBe(true);
    expect(updatedProject?.status).not.toBe("active");
  });

  it("activates the competition project only when the player explicitly attends the invite", () => {
    const { project, run } = createCompetitionInviteRun("competition-invite-attend");

    const planned = planWeeklyDayAction({
      run,
      weekday: "sat",
      optionId: `weekly-competition-invite-attend:${project.id}`,
    });
    const result = confirmPlannedWeek(planned);
    const saturdayResult = result.run.activeMonth?.latestWeekSettlement?.dailyResults.find(
      (day) => day.weekday === "sat",
    );
    const updatedProject = result.run.competitionProjects?.find((item) => item.id === project.id);

    expect(saturdayResult?.resolvedAction.sourceEventId).toBe("weekly-competition-invite");
    expect(updatedProject?.status).toBe("active");
  });

  it("does not activate the competition project when the player explicitly chooses a normal action instead", () => {
    const { project, run } = createCompetitionInviteRun("competition-invite-skip");

    const planned = planWeeklyDayAction({
      run,
      weekday: "sat",
      optionId: "social",
    });
    const result = confirmPlannedWeek(planned);
    const saturdayResult = result.run.activeMonth?.latestWeekSettlement?.dailyResults.find(
      (day) => day.weekday === "sat",
    );
    const updatedProject = result.run.competitionProjects?.find((item) => item.id === project.id);

    expect(saturdayResult?.resolvedAction.action).toBe("social");
    expect(updatedProject?.status).toBe("expired");
  });

  it("keeps explicit weekday choices and only auto-fills the days the player actually left blank", () => {
    const baseRun = createInitialGameRun({
      id: "weekly-choice-preservation",
      randomValues: [0.22, 0.31, 0.48, 0.57, 0.61, 0.19, 0.26, 0.4],
    });
    const withAttendance = selectWeekAttendanceStrategy(baseRun, "mixed");
    const mondayPlanned = planWeeklyDayAction({
      run: withAttendance,
      weekday: "mon",
      optionId: "study",
    });
    const tuesdayPlanned = planWeeklyDayAction({
      run: mondayPlanned,
      weekday: "tue",
      optionId: "social",
    });
    const wednesdayPlanned = planWeeklyDayAction({
      run: tuesdayPlanned,
      weekday: "sun",
      optionId: "relax",
    });
    const saturdayPlanned = planWeeklyDayAction({
      run: wednesdayPlanned,
      weekday: "sat",
      optionId: "job_prep",
    });

    const result = confirmPlannedWeek(saturdayPlanned);
    const settlement = result.run.activeMonth?.latestWeekSettlement;

    expect(settlement?.dailyResults.find((day) => day.weekday === "mon")?.resolvedAction.action).toBe("study");
    expect(settlement?.dailyResults.find((day) => day.weekday === "tue")?.resolvedAction.action).toBe("social");
    expect(settlement?.dailyResults.find((day) => day.weekday === "sun")?.resolvedAction.action).toBe("relax");
    expect(settlement?.dailyResults.find((day) => day.weekday === "sat")?.resolvedAction.action).toBe("job_prep");
    expect(settlement?.dailyResults.filter((day) => day.resolvedAction.action === "idle")).toHaveLength(3);
    expect(
      settlement?.dailyResults.filter((day) => day.resolvedAction.autoFilled).map((day) => day.weekday),
    ).toEqual(["wed", "thu", "fri"]);
  });

  it("keeps weekly settlements in the month summary and exposes them to the monthly journal input", () => {
    let run: GameRun = createInitialGameRun({
      id: "weekly-settlement-monthly-prompt",
      randomValues: [0.27, 0.34, 0.41, 0.52, 0.68, 0.19, 0.28, 0.41],
    });
    let monthlySummary: ReturnType<typeof confirmPlannedWeek>["monthlySummary"] | undefined;

    for (let week = 0; week < 4; week += 1) {
      const withAttendance = selectWeekAttendanceStrategy(run, "mixed");
      const result = confirmPlannedWeek(withAttendance);

      if (result.monthCompleted) {
        monthlySummary = result.monthlySummary;
      }

      run = result.run;
    }

    expect(monthlySummary?.weeklySettlements).toHaveLength(4);
    expect(monthlySummary?.weeklySettlements?.every((settlement) => settlement.dailyResults.length === 7)).toBe(true);

    const prompt = buildMonthlyJournalPrompt({
      kind: "monthly_journal",
      runId: "weekly-settlement-monthly-prompt",
      year: 1,
      month: 1,
      summary: monthlySummary!,
    });
    const userMessage = prompt.messages.find((message) => message.role === "user")?.content;

    expect(typeof userMessage).toBe("string");

    const parsed = JSON.parse(userMessage as string) as {
      compactInput: Record<string, unknown>;
    };
    const weeklyDigest = parsed.compactInput["每周结算摘要"];

    expect(Array.isArray(weeklyDigest)).toBe(true);
    expect(weeklyDigest).toHaveLength(4);
  });

  it("surfaces a pre-planning cash warning with current cash, fixed cost, shortfall, and a mitigation hint", () => {
    const baseRun = createInitialGameRun({
      id: "weekly-cash-warning-details",
      randomValues: [0.14, 0.24, 0.33, 0.42, 0.55, 0.61, 0.72, 0.18],
    });
    const lowCashRun: GameRun = {
      ...baseRun,
      stats: {
        ...baseRun.stats,
        money: 120,
      },
    };
    const monthlyExpense = getMonthlyLivingExpense(lowCashRun);
    const shortfall = monthlyExpense - lowCashRun.stats.money;
    const withAttendance = selectWeekAttendanceStrategy(lowCashRun, "mixed");
    const warningText = (withAttendance.activeMonth?.currentWeekState.planningWarnings ?? []).join(" ");

    expect(warningText).toContain(`${lowCashRun.stats.money}`);
    expect(warningText).toContain(`${monthlyExpense}`);
    expect(warningText).toContain(`${shortfall}`);
    expect(warningText).toMatch(/兼职|赚钱|找家里要钱|控制支出|补现金/);
  });
});

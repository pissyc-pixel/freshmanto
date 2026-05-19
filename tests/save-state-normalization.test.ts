import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import { setDemoWeekAttendance } from "@/lib/demo/run-service";
import { normalizeSaveState } from "@/lib/demo/save-state";
import type { GameRun } from "@/types/game";

function createLegacyMonthTwoRun(): GameRun {
  const baseRun = createInitialGameRun({
    id: "legacy-month-two-run",
    discipline: "engineering",
    randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
  });

  return {
    ...baseRun,
    currentMonth: 2,
    activeMonth: {
      year: 1,
      month: 2,
      currentWeek: 1,
      totalWeeks: 4,
      allowanceApplied: true,
      cooldownsAtStart: { askFamilyMonths: 0 },
      weeklyCalendar: [],
      currentWeekState: undefined as unknown as NonNullable<GameRun["activeMonth"]>["currentWeekState"],
      completedWeeks: [],
      statsAtStart: { ...baseRun.stats },
      turns: [],
    },
  };
}

function createRepository(run: GameRun) {
  let currentRun = run;

  return {
    async createRun() {
      return null;
    },
    async getRun(runId: string) {
      return runId === currentRun.id
        ? {
            id: currentRun.id,
            status: currentRun.status,
            current_year: currentRun.currentYear,
            current_month: currentRun.currentMonth,
            profile_json: currentRun.profile,
            current_state_json: currentRun,
          }
        : null;
    },
    async updateRun(runId: string, input: { currentState?: GameRun }) {
      if (runId !== currentRun.id) {
        throw new Error("run not found");
      }

      currentRun = input.currentState ?? currentRun;
      return {
        id: currentRun.id,
        status: currentRun.status,
        current_year: currentRun.currentYear,
        current_month: currentRun.currentMonth,
        profile_json: currentRun.profile,
        current_state_json: currentRun,
      };
    },
    async saveMonthlyState() {
      return null;
    },
    async writeEventLogs() {
      return [];
    },
    async saveAiReport() {
      return null;
    },
    async saveResumeItems() {
      return [];
    },
    readRun() {
      return currentRun;
    },
  };
}

describe("normalizeSaveState", () => {
  it("rebuilds a playable month-2 activeMonth when a legacy save carries an empty weekly calendar", () => {
    const normalized = normalizeSaveState(createLegacyMonthTwoRun());

    expect(normalized.currentMonth).toBe(2);
    expect(normalized.activeMonth?.weeklyCalendar).toHaveLength(4);
    expect(normalized.activeMonth?.currentWeekState.week).toBe(1);
    expect(normalized.activeMonth?.currentWeekState.days).toHaveLength(7);
  });

  it("lets the week-planning service continue from a legacy month-2 save instead of crashing", async () => {
    const repository = createRepository(createLegacyMonthTwoRun());

    const result = await setDemoWeekAttendance({
      repository,
      runId: "legacy-month-two-run",
      attendanceStrategy: "mixed",
    });

    expect(result.run.activeMonth?.currentWeekState.days).toHaveLength(7);
    expect(result.run.activeMonth?.currentWeekState.week).toBe(1);
    expect(repository.readRun().activeMonth?.weeklyCalendar).toHaveLength(4);
  });
});

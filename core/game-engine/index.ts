export {
  createInitialGameRun,
  createMonthlySchedule,
  createWeeklyCalendar,
  evaluateGraduationOutcome,
  confirmPlannedWeek,
  planWeeklyDayAction,
  resolveActionTurn,
  resolveWeekEnd,
  resolveMonthlyTurn,
  selectWeekAttendanceStrategy,
  settleSemester,
} from "@/core/game-engine/monthly";

export const GAME_ENGINE_BOUNDARY = {
  owns: [
    "random start generation",
    "monthly action resolution",
    "semester settlement",
    "graduation risk evaluation",
  ],
  excludes: ["AI writing", "database persistence", "page rendering"],
} as const;

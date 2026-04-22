export {
  createInitialGameRun,
  createMonthlySchedule,
  evaluateGraduationOutcome,
  resolveMonthlyTurn,
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

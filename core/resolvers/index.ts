export { resolveActionPlan } from "@/core/resolvers/actions";
export { resolveCourseStrategy } from "@/core/resolvers/attendance";
export { resolveMonthEvents } from "@/core/resolvers/events";
export { createMonthlySchedule } from "@/core/resolvers/schedule";
export { evaluateGraduationOutcome, evaluateSemesterFeedback, settleSemester } from "@/core/resolvers/semester";

export const RESOLVER_BOUNDARY = {
  owns: ["action effects", "event outcomes", "semester and ending labels"],
  excludes: ["prompt text generation", "database mutations"],
} as const;

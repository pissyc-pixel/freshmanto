import { getActionTimeCost } from "@/core/resolvers/schedule";
import type { ActionType, Weekday } from "@/types/game";

function formatActionCost(action: ActionType) {
  const cost = getActionTimeCost(action);

  return cost === 0 ? "0 half-days" : `${cost} half-day${cost > 1 ? "s" : ""}`;
}

export const actionOptions: Array<{
  value: ActionType;
  label: string;
  description: string;
}> = [
  { value: "study", label: "Study", description: `Steady academic progress. Cost: ${formatActionCost("study")}` },
  { value: "job_prep", label: "Job Prep", description: `Resume and recruiting prep. Cost: ${formatActionCost("job_prep")}` },
  { value: "part_time", label: "Part-time", description: `Earn cash, but not at night. Cost: ${formatActionCost("part_time")}` },
  { value: "social", label: "Social", description: `Spend money for mood and connections. Cost: ${formatActionCost("social")}` },
  { value: "relax", label: "Relax", description: `Reduce stress quickly. Cost: ${formatActionCost("relax")}` },
  { value: "big_meal", label: "Big Meal", description: `Instant recovery without using time. Cost: ${formatActionCost("big_meal")}` },
  {
    value: "student_activity",
    label: "Student Activity",
    description: `Clubs, talks, and campus involvement. Cost: ${formatActionCost("student_activity")}`,
  },
  { value: "remedy", label: "Remedy", description: `Emergency catch-up and damage control. Cost: ${formatActionCost("remedy")}` },
  { value: "ask_family", label: "Ask Family", description: `Instant cash with pressure and cooldown. Cost: ${formatActionCost("ask_family")}` },
  {
    value: "skip_class",
    label: "Skip Class",
    description: `Release locked daytime class blocks this week. Cost: ${formatActionCost("skip_class")}`,
  },
];

export const skipClassDayOptions: Array<{
  value: Weekday;
  label: string;
}> = [
  { value: "mon", label: "Mon daytime" },
  { value: "wed", label: "Wed daytime" },
  { value: "fri", label: "Fri daytime" },
];

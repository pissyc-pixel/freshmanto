"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { advanceServerDemoMonth, createServerDemoRun } from "@/lib/demo/server";
import type { ActionTime, ActionType, CourseAttendanceStrategy, MonthlyActionPlan } from "@/types/game";

const attendanceSchema = z.enum([
  "serious",
  "mixed",
  "skip_sometimes",
  "skip_often",
  "proxy",
  "phone"
]);

const actionSchema = z.enum([
  "study",
  "job_prep",
  "part_time",
  "social",
  "relax",
  "student_activity",
  "remedy",
  "ask_family"
]);

const timeSchema = z.enum(["day", "night"]);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseActions(formData: FormData) {
  const actions: MonthlyActionPlan["actions"] = [];

  for (const slot of [1, 2, 3] as const) {
    const actionValue = readString(formData, `action-${slot}`);
    const timeValue = readString(formData, `time-${slot}`);

    if (!actionValue) {
      continue;
    }

    const action = actionSchema.parse(actionValue) as ActionType;
    const time = timeSchema.parse(timeValue || "day") as ActionTime;

    actions.push({ action, time });
  }

  return actions;
}

export async function startNewRunAction() {
  const result = await createServerDemoRun();
  redirect(`/game?runId=${result.run.id}`);
}

export async function submitMonthlyPlanAction(formData: FormData) {
  const runId = z.string().min(1).parse(readString(formData, "runId"));
  const attendanceStrategy = attendanceSchema.parse(
    readString(formData, "attendanceStrategy")
  ) as CourseAttendanceStrategy;
  const actions = parseActions(formData);

  if (actions.length === 0) {
    throw new Error("At least one action is required to settle the month.");
  }

  const result = await advanceServerDemoMonth(runId, {
    attendanceStrategy,
    actions
  });

  redirect(
    `/settlement?runId=${runId}&year=${result.playedYear}&month=${result.playedMonth}`
  );
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { advanceServerDemoTurn, createServerDemoRun } from "@/lib/demo/server";
import type { ActionTime, ActionType, CourseAttendanceStrategy } from "@/types/game";

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

function parseActionTurn(formData: FormData) {
  const action = actionSchema.parse(readString(formData, "action")) as ActionType;
  const time = timeSchema.parse(readString(formData, "time") || "night") as ActionTime;

  return {
    action,
    time,
  };
}

export async function startNewRunAction() {
  const result = await createServerDemoRun();
  redirect(`/game?runId=${result.run.id}`);
}

export async function submitActionTurnAction(formData: FormData) {
  const runId = z.string().min(1).parse(readString(formData, "runId"));
  const attendanceStrategy = attendanceSchema.parse(
    readString(formData, "attendanceStrategy"),
  ) as CourseAttendanceStrategy;
  const action = parseActionTurn(formData);
  const result = await advanceServerDemoTurn(runId, {
    attendanceStrategy,
    action,
  });

  if (result.monthCompleted) {
    redirect(`/settlement?runId=${runId}&year=${result.playedYear}&month=${result.playedMonth}`);
  }

  redirect(`/game?runId=${runId}`);
}

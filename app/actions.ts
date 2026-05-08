"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoSchema } from "@/db/ensure-schema";
import { generateAiReport } from "@/lib/ai/reports";
import {
  advanceServerDemoTurn,
  confirmServerWeek,
  createServerDemoRun,
  planServerWeekdayAction,
  setServerWeekAttendance,
} from "@/lib/demo/server";
import { endDemoWeek } from "@/lib/demo/run-service";
import { createServerSupabaseRepository } from "@/lib/supabase";
import type { ActionTime, ActionType, CourseAttendanceStrategy } from "@/types/game";

const attendanceSchema = z.enum([
  "serious",
  "mixed",
  "phone"
]);

const actionSchema = z.enum([
  "study",
  "job_prep",
  "part_time",
  "social",
  "relax",
  "big_meal",
  "student_activity",
  "remedy",
  "ask_family",
  "skip_class"
]);

const timeSchema = z.enum(["day", "night"]);
const weekdaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseActionTurn(formData: FormData) {
  const action = actionSchema.parse(readString(formData, "action")) as ActionType;
  const time = timeSchema.parse(readString(formData, "time") || "night") as ActionTime;
  const skipClassDays = formData
    .getAll("skipClassDays")
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => weekdaySchema.parse(value));

  return {
    action,
    time,
    skipClassDays,
  };
}

export async function startNewRunAction() {
  const result = await createServerDemoRun();
  redirect(`/game?runId=${result.run.id}`);
}

export async function submitActionTurnAction(formData: FormData) {
  const runId = z.string().min(1).parse(readString(formData, "runId"));
  const intent = readString(formData, "intent") || "act";
  const attendanceStrategy = attendanceSchema.parse(
    readString(formData, "attendanceStrategy"),
  ) as CourseAttendanceStrategy;

  if (intent === "set_attendance") {
    await setServerWeekAttendance(runId, attendanceStrategy);
    redirect(`/game?runId=${runId}`);
  }

  if (intent === "plan_day") {
    const weekday = weekdaySchema.parse(readString(formData, "weekday"));
    const optionId = z.string().min(1).parse(readString(formData, "optionId"));
    const skipClass = readString(formData, "skipClass") === "true";

    await planServerWeekdayAction(runId, {
      weekday,
      optionId,
      skipClass,
    });
    redirect(`/game?runId=${runId}`);
  }

  if (intent === "confirm_week") {
    const result = await confirmServerWeek(runId);

    if (result.monthCompleted) {
      redirect(`/settlement?runId=${runId}&year=${result.playedYear}&month=${result.playedMonth}`);
    }

    redirect(`/game?runId=${runId}`);
  }

  if (intent === "end_week") {
    await ensureDemoSchema();

    const result = await endDemoWeek({
      repository: createServerSupabaseRepository(),
      runId,
      attendanceStrategy,
      generateReport: generateAiReport,
    });

    if (result.monthCompleted) {
      redirect(`/settlement?runId=${runId}&year=${result.playedYear}&month=${result.playedMonth}`);
    }

    redirect(`/game?runId=${runId}`);
  }

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

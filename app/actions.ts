"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { buildPlannerDaysView } from "@/app/game/view-model";
import { ensureDemoSchema } from "@/db/ensure-schema";
import { generateAiReport } from "@/lib/ai/reports";
import { ACTIVE_RUN_COOKIE } from "@/lib/demo/active-run";
import { demoSavePresetIds } from "@/lib/demo/presets";
import {
  advanceServerDemoTurn,
  confirmServerWeek,
  createServerDemoPresetRun,
  createServerDemoRun,
  decideServerFutureOffer,
  planServerWeekdayAction,
  setServerWeekAttendance,
} from "@/lib/demo/server";
import { endDemoWeek } from "@/lib/demo/run-service";
import { createServerSupabaseRepository } from "@/lib/supabase";
import type { ActionTime, ActionType, CollegeTrack, CourseAttendanceStrategy } from "@/types/game";

const attendanceSchema = z.enum([
  "serious",
  "mixed",
  "phone"
]);

const actionSchema = z.enum([
  "study",
  "writing_research",
  "job_prep",
  "postgraduate_prep",
  "public_exam_prep",
  "competition_project",
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
const newRunSchema = z.object({
  name: z.string().trim().min(2).max(12),
  discipline: z.enum(["arts", "science", "engineering", "business", "medicine"]),
});
const demoPresetIdSchema = z.enum(demoSavePresetIds);
const offerDecisionSchema = z.enum(["accept", "reject"]);
const plannedActionSnapshotEntrySchema = z.object({
  weekday: weekdaySchema,
  optionId: z.string().min(1),
  skipClass: z.boolean().optional(),
});
const plannedActionSnapshotSchema = z.array(plannedActionSnapshotEntrySchema);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function persistActiveRun(runId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_RUN_COOKIE, runId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
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

function parsePlannedActionsSnapshot(formData: FormData) {
  const raw = readString(formData, "plannedActionsSnapshot");

  if (!raw) {
    return [];
  }

  try {
    const parsed = plannedActionSnapshotSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return [];
    }

    const latestByWeekday = new Map<string, z.infer<typeof plannedActionSnapshotEntrySchema>>();

    for (const entry of parsed.data) {
      latestByWeekday.set(entry.weekday, entry);
    }

    return [...latestByWeekday.values()];
  } catch {
    return [];
  }
}

export async function startNewRunAction(formData?: FormData) {
  if (!formData) {
    redirect("/new-game");
  }

  const parsed = newRunSchema.safeParse({
    name: readString(formData, "name"),
    discipline: readString(formData, "discipline"),
  });

  if (!parsed.success) {
    redirect("/new-game");
  }

  const result = await createServerDemoRun({
    name: parsed.data.name,
    discipline: parsed.data.discipline as CollegeTrack,
  });
  await persistActiveRun(result.run.id);
  redirect(`/admission?runId=${result.run.id}`);
}

export async function loadDemoSaveAction(formData: FormData) {
  const presetId = demoPresetIdSchema.safeParse(readString(formData, "presetId"));

  if (!presetId.success) {
    redirect("/demo-saves");
  }

  const result = await createServerDemoPresetRun(presetId.data);
  await persistActiveRun(result.run.id);
  redirect(`/game?runId=${result.run.id}`);
}

export async function decideFutureOfferAction(formData: FormData) {
  const runId = z.string().min(1).parse(readString(formData, "runId"));
  const offerId = z.string().min(1).parse(readString(formData, "offerId"));
  const decision = offerDecisionSchema.parse(readString(formData, "decision"));

  await persistActiveRun(runId);
  await decideServerFutureOffer(runId, {
    offerId,
    decision,
  });
  redirect(`/resume?runId=${runId}`);
}

export async function planWeekdayActionAction(input: {
  runId: string;
  weekday: z.infer<typeof weekdaySchema>;
  optionId: string;
  skipClass?: boolean;
}) {
  const runId = z.string().min(1).parse(input.runId);
  const weekday = weekdaySchema.parse(input.weekday);
  const optionId = z.string().min(1).parse(input.optionId);
  const skipClass = Boolean(input.skipClass);

  await persistActiveRun(runId);

  const result = await planServerWeekdayAction(runId, {
    weekday,
    optionId,
    skipClass,
  });
  const currentWeekState = result.run.activeMonth?.currentWeekState;
  const savedDay = currentWeekState
    ? buildPlannerDaysView(currentWeekState, result.run).find((day) => day.weekday === weekday) ?? null
    : null;

  return { savedDay };
}

export async function submitActionTurnAction(formData: FormData) {
  const runId = z.string().min(1).parse(readString(formData, "runId"));
  await persistActiveRun(runId);
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
    const plannedActionsSnapshot = parsePlannedActionsSnapshot(formData);
    const result = await confirmServerWeek(runId, plannedActionsSnapshot);

    if (result.monthCompleted) {
      redirect(`/settlement?runId=${runId}&year=${result.playedYear}&month=${result.playedMonth}`);
    }

    redirect(`/game?runId=${runId}&focus=weekly-settlement`);
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

"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitActionTurnAction } from "@/app/actions";
import type { CourseAttendanceStrategy } from "@/types/game";

type PlannerDayOptionView = {
  optionId: string;
  label: string;
  description: string;
  selected: boolean;
};

type PlannerDayView = {
  weekday: string;
  label: string;
  status: string;
  plannedActionLabel: string | null;
  baseTypeLabel: string;
  effectiveTypeLabel: string;
  skipClassAvailable: boolean;
  skipClassSelected: boolean;
  eventTitle: string | null;
  eventSummary: string | null;
  normalOptions: PlannerDayOptionView[];
  skipOptions: PlannerDayOptionView[];
};

type PlannerFeedback = {
  kind: "info" | "success" | "error";
  title: string;
  message: string;
};

type ActionPlanFormProps = {
  runId: string;
  currentWeek: number;
  attendanceLocked: boolean;
  defaultAttendanceStrategy: CourseAttendanceStrategy;
  plannerStatusText: string;
  plannerLines: string[];
  readyToConfirm: boolean;
  plannerFeedback?: PlannerFeedback;
  days: PlannerDayView[];
};

function PendingHint({ text }: { text: string }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return <p className="text-sm leading-6 text-amber-700">{text}</p>;
}

function SubmitButton(props: {
  label: string;
  pendingLabel: string;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || props.disabled} className={props.className}>
      {pending ? props.pendingLabel : props.label}
    </button>
  );
}

export function ActionPlanForm({
  runId,
  currentWeek,
  attendanceLocked,
  defaultAttendanceStrategy,
  plannerStatusText,
  plannerLines,
  readyToConfirm,
  plannerFeedback,
  days,
}: ActionPlanFormProps) {
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null);
  const selectedDay = days.find((day) => day.weekday === selectedWeekday) ?? null;
  const [skipClassDraft, setSkipClassDraft] = useState(false);
  const currentOptions = selectedDay
    ? skipClassDraft && selectedDay.skipClassAvailable
      ? selectedDay.skipOptions
      : selectedDay.normalOptions
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-6 text-stone-700">
        <p className="font-semibold text-stone-900">第 {currentWeek} 周</p>
        <p className="mt-2">{plannerStatusText}</p>
        {plannerLines.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            {plannerLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {plannerFeedback ? (
        <div
          className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
            plannerFeedback.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : plannerFeedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">{plannerFeedback.title}</p>
          <p className="mt-1">{plannerFeedback.message}</p>
        </div>
      ) : null}

      <form action={submitActionTurnAction} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/80 p-4">
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="intent" value="set_attendance" />
        <div className="space-y-3">
          <label className="text-sm font-semibold text-stone-800" htmlFor="attendanceStrategy">
            本周课程态度
          </label>
          <select
            id="attendanceStrategy"
            name="attendanceStrategy"
            defaultValue={defaultAttendanceStrategy}
            disabled={attendanceLocked}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-stone-800 disabled:bg-stone-100"
          >
            <option value="serious">认真上课</option>
            <option value="mixed">正常混课</option>
            <option value="phone">人在课堂，魂在手机</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label={attendanceLocked ? "本周课程态度已锁定" : "先确定本周课程态度"}
            pendingLabel="正在保存课程态度..."
            disabled={attendanceLocked}
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
          />
          <PendingHint text="正在保存这周的课程态度..." />
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => (
          <button
            key={day.weekday}
            type="button"
            disabled={!attendanceLocked}
            onClick={() => {
              setSelectedWeekday(day.weekday);
              setSkipClassDraft(day.skipClassSelected);
            }}
            className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/70 disabled:cursor-not-allowed disabled:bg-stone-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">{day.label}</p>
                <p className="mt-1 text-xs text-stone-500">{day.status}</p>
              </div>
              <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
                {day.eventTitle ? "有事" : "可排"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {day.plannedActionLabel ? `已排：${day.plannedActionLabel}` : day.effectiveTypeLabel}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-500">默认节奏：{day.baseTypeLabel}</p>
            {day.eventTitle ? <p className="mt-2 text-xs leading-5 text-amber-700">{day.eventTitle}</p> : null}
          </button>
        ))}
      </div>

      <form action={submitActionTurnAction} className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/80 p-4">
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="intent" value="confirm_week" />
        <input type="hidden" name="attendanceStrategy" value={defaultAttendanceStrategy} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label="确认本周安排"
            pendingLabel="正在结算本周安排 / 生成 AI 月记..."
            disabled={!readyToConfirm}
            className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          />
          {!readyToConfirm ? <span className="text-sm text-stone-500">要先把这一周 7 天都排完。</span> : null}
        </div>
        <PendingHint text="正在统一结算本周安排；如果这是月底，也会顺带生成 AI 月记 / 月度总结。" />
      </form>

      {selectedDay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(28,25,23,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{selectedDay.label}</p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-900">给这一天排一个行动</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  默认节奏：{selectedDay.baseTypeLabel}。当前可排：{skipClassDraft && selectedDay.skipClassAvailable ? "翘课后释放白天" : selectedDay.effectiveTypeLabel}。
                </p>
                {selectedDay.eventTitle ? (
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    {selectedDay.eventTitle}：{selectedDay.eventSummary}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeekday(null)}
                className="rounded-full border border-[var(--border)] px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              >
                关闭
              </button>
            </div>

            {selectedDay.skipClassAvailable ? (
              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-700">
                <input
                  type="checkbox"
                  checked={skipClassDraft}
                  onChange={(event) => setSkipClassDraft(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600"
                />
                <span>这天翘课，释放白天时间。代价是学业会掉一点、压力会涨一点。</span>
              </label>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {currentOptions.map((option) => (
                <form key={option.optionId} action={submitActionTurnAction} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4">
                  <input type="hidden" name="runId" value={runId} />
                  <input type="hidden" name="intent" value="plan_day" />
                  <input type="hidden" name="attendanceStrategy" value={defaultAttendanceStrategy} />
                  <input type="hidden" name="weekday" value={selectedDay.weekday} />
                  <input type="hidden" name="skipClass" value={String(skipClassDraft && selectedDay.skipClassAvailable)} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">{option.label}</h4>
                      {option.selected ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">上一次你排过类似行动</p>
                      ) : null}
                    </div>
                    <button
                      type="submit"
                      name="optionId"
                      value={option.optionId}
                      className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                    >
                      排到这一天
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{option.description}</p>
                </form>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

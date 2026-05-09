"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitActionTurnAction } from "@/app/actions";
import type { CourseAttendanceStrategy } from "@/types/game";

type PlannerDayOptionView = {
  optionId: string;
  label: string;
  description: string;
  selected: boolean;
};

export type PlannerDayView = {
  weekday: string;
  label: string;
  status: string;
  plannedActionLabel: string | null;
  justPlanned: boolean;
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
  onClick?: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={props.className}
      onClick={props.onClick}
    >
      {pending ? props.pendingLabel : props.label}
    </button>
  );
}

function FeedbackBanner({ feedback }: { feedback: PlannerFeedback }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
        feedback.kind === "error"
          ? "border-rose-200 bg-rose-50 text-rose-900"
          : feedback.kind === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="font-semibold">{feedback.title}</p>
      <p className="mt-1">{feedback.message}</p>
    </div>
  );
}

export function countUnplannedDays(days: PlannerDayView[]) {
  return days.filter((day) => !day.plannedActionLabel).length;
}

type OptimisticPlan = {
  optionLabel: string;
  skipClassSelected: boolean;
};

function clonePlannerDay(day: PlannerDayView): PlannerDayView {
  return {
    ...day,
    normalOptions: day.normalOptions.map((option) => ({ ...option })),
    skipOptions: day.skipOptions.map((option) => ({ ...option })),
  };
}

export function applyOptimisticPlan(
  days: PlannerDayView[],
  weekday: string,
  optionLabel: string,
  skipClassSelected: boolean,
): PlannerDayView[] {
  return days.map((day) => {
    if (day.weekday !== weekday) {
      return {
        ...day,
        justPlanned: false,
      };
    }

    const effectiveTypeLabel =
      skipClassSelected && day.skipClassAvailable ? "翘课后释放白天，可安排白天行动" : day.effectiveTypeLabel;

    return {
      ...day,
      status: "已安排",
      plannedActionLabel: optionLabel,
      justPlanned: true,
      skipClassSelected: skipClassSelected && day.skipClassAvailable,
      effectiveTypeLabel,
      normalOptions: day.normalOptions.map((option) => ({
        ...option,
        selected: option.label === optionLabel,
      })),
      skipOptions: day.skipOptions.map((option) => ({
        ...option,
        selected: option.label === optionLabel,
      })),
    };
  });
}

function applyOptimisticPlans(
  days: PlannerDayView[],
  optimisticPlans: Record<string, OptimisticPlan>,
): PlannerDayView[] {
  return days.map((sourceDay) => {
    const optimisticPlan = optimisticPlans[sourceDay.weekday];
    const day = clonePlannerDay(sourceDay);

    if (!optimisticPlan) {
      return day;
    }

    const [updatedDay] = applyOptimisticPlan(
      [day],
      sourceDay.weekday,
      optimisticPlan.optionLabel,
      optimisticPlan.skipClassSelected,
    );

    return updatedDay ?? day;
  });
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
  const [skipClassDraft, setSkipClassDraft] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<PlannerFeedback | null>(null);
  const [pendingPlan, setPendingPlan] = useState<{ weekday: string; label: string } | null>(null);
  const [optimisticPlans, setOptimisticPlans] = useState<Record<string, OptimisticPlan>>({});

  const plannerDays = useMemo(
    () => applyOptimisticPlans(days, optimisticPlans),
    [days, optimisticPlans],
  );

  const selectedDay = plannerDays.find((day) => day.weekday === selectedWeekday) ?? null;
  const currentOptions = selectedDay
    ? skipClassDraft && selectedDay.skipClassAvailable
      ? selectedDay.skipOptions
      : selectedDay.normalOptions
    : [];
  const activeFeedback = localFeedback ?? plannerFeedback ?? null;
  const missingCount = useMemo(() => countUnplannedDays(plannerDays), [plannerDays]);
  const readyToConfirmNow = attendanceLocked && (readyToConfirm || plannerDays.length > 0);
  const highlightedWeekday =
    pendingPlan?.weekday ?? plannerDays.find((day) => day.justPlanned)?.weekday ?? null;

  function openDayPlanner(day: PlannerDayView) {
    if (!attendanceLocked) {
      setLocalFeedback({
        kind: "info",
        title: "先确定这周课程态度",
        message: "课程态度还没锁定前，这些天还不能真正排进去。先保存本周的上课态度，再逐天点选。",
      });
      return;
    }

    setLocalFeedback(null);
    setPendingPlan(null);
    setSelectedWeekday(day.weekday);
    setSkipClassDraft(day.skipClassSelected);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-6 text-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-stone-900">第 {currentWeek} 周操作</p>
          {missingCount > 0 ? (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              还差 {missingCount} 天没点，确认时会自动补成摆烂 / 发呆
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              这一周已经全部排完
            </span>
          )}
        </div>
        <p className="mt-2">
          {attendanceLocked
            ? `这周已经排了 ${7 - missingCount} / 7 天，顶部计数、当天卡片和确认状态现在都会同步更新。`
            : plannerStatusText}
        </p>
        {plannerLines.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            {plannerLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {activeFeedback ? <FeedbackBanner feedback={activeFeedback} /> : null}

      {pendingPlan ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">
            {plannerDays.find((day) => day.weekday === pendingPlan.weekday)?.label} 已点上
          </p>
          <p className="mt-1">已经把“{pendingPlan.label}”排到这一天，正在保存并回填本周排程。</p>
        </div>
      ) : null}

      <form
        action={submitActionTurnAction}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/80 p-4"
      >
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
        {plannerDays.map((day) => {
          const isHighlighted = highlightedWeekday === day.weekday;
          const isPlanned = Boolean(day.plannedActionLabel);

          return (
            <button
              key={day.weekday}
              type="button"
              onClick={() => openDayPlanner(day)}
              className={`rounded-2xl border p-4 text-left transition ${
                isHighlighted
                  ? "border-emerald-300 bg-emerald-50/90 shadow-[0_16px_32px_rgba(16,185,129,0.15)]"
                  : isPlanned
                    ? "border-amber-300 bg-amber-50/70"
                    : "border-[var(--border)] bg-white/80 hover:border-amber-300 hover:bg-amber-50/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{day.label}</p>
                  <p className="mt-1 text-xs text-stone-500">{day.status}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    day.eventTitle
                      ? "bg-amber-100 text-amber-800"
                      : isPlanned
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-900 text-stone-50"
                  }`}
                >
                  {day.eventTitle ? "有事" : isPlanned ? "已安排" : "可排"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                {day.plannedActionLabel ? `已安排：${day.plannedActionLabel}` : day.effectiveTypeLabel}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-500">默认节奏：{day.baseTypeLabel}</p>
              {day.eventTitle ? <p className="mt-2 text-xs leading-5 text-amber-700">{day.eventTitle}</p> : null}
              {!attendanceLocked ? (
                <p className="mt-3 text-xs leading-5 text-stone-500">先定课程态度，再点这一天。</p>
              ) : null}
            </button>
          );
        })}
      </div>

      <form
        action={submitActionTurnAction}
        className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/80 p-4"
      >
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="intent" value="confirm_week" />
        <input type="hidden" name="attendanceStrategy" value={defaultAttendanceStrategy} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label="确认本周安排"
            pendingLabel="正在结算本周安排 / 生成 AI 月记..."
            disabled={!readyToConfirmNow}
            className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          />
          {attendanceLocked ? (
            <span className="text-sm text-stone-500">
              没点到的日期会自动补成“摆烂 / 发呆”，不会因为漏选卡住。
            </span>
          ) : (
            <span className="text-sm text-stone-500">先把这周课程态度锁定，系统才知道怎么结算这一周。</span>
          )}
        </div>
        <PendingHint text="正在统一结算本周安排；如果这是月末，也会顺带生成 AI 月记 / 月度总结。" />
      </form>

      {selectedDay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(28,25,23,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  {selectedDay.label}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-900">给这一天排一个行动</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  默认节奏：{selectedDay.baseTypeLabel}。当前可排：
                  {skipClassDraft && selectedDay.skipClassAvailable
                    ? "翘课后释放白天，可安排白天行动"
                    : selectedDay.effectiveTypeLabel}
                  。
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
                <span>这天翘课，释放白天时间。代价是学业会掉一点、压力会再上来一点。</span>
              </label>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {currentOptions.map((option) => (
                <form
                  key={option.optionId}
                  action={submitActionTurnAction}
                  className="rounded-2xl border border-[var(--border)] bg-white/90 p-4"
                >
                  <input type="hidden" name="runId" value={runId} />
                  <input type="hidden" name="intent" value="plan_day" />
                  <input type="hidden" name="attendanceStrategy" value={defaultAttendanceStrategy} />
                  <input type="hidden" name="weekday" value={selectedDay.weekday} />
                  <input type="hidden" name="optionId" value={option.optionId} />
                  <input
                    type="hidden"
                    name="skipClass"
                    value={String(skipClassDraft && selectedDay.skipClassAvailable)}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-stone-900">{option.label}</h4>
                      {option.selected ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">你上次排过类似行动</p>
                      ) : null}
                    </div>
                    <SubmitButton
                      label="排到这一天"
                      pendingLabel="正在保存..."
                      className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                      onClick={() => {
                        setOptimisticPlans((currentPlans) => ({
                          ...currentPlans,
                          [selectedDay.weekday]: {
                            optionLabel: option.label,
                            skipClassSelected: skipClassDraft && selectedDay.skipClassAvailable,
                          },
                        }));
                        setPendingPlan({
                          weekday: selectedDay.weekday,
                          label: option.label,
                        });
                        setLocalFeedback({
                          kind: "success",
                          title: `${selectedDay.label} 已点上`,
                          message: `已经把“${option.label}”排到这一天，顶部剩余天数和当天卡片会立刻同步更新。`,
                        });
                        setSelectedWeekday(null);
                      }}
                    />
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

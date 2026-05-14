"use client";

import { type KeyboardEvent, type ReactNode, useMemo, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { createPortal } from "react-dom";

import { submitActionTurnAction } from "@/app/actions";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import { buildPlannerEventNotice } from "@/lib/planner-option-priority";
import { buildStatusGuidance } from "@/lib/status-guidance";
import type { ActionType, CourseAttendanceStrategy } from "@/types/game";

type PlannerDayOptionView = {
  optionId: string;
  action: ActionType;
  label: string;
  description: string;
  selected: boolean;
  source: "default" | "weekly_event";
  sourceEventId?: string;
  badges: string[];
  isEventRelated: boolean;
  isCashRiskAction: boolean;
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
  eventAttendSummary?: string | null;
  eventSkipSummary?: string | null;
  hasCashRisk: boolean;
  normalOptions: PlannerDayOptionView[];
  skipOptions: PlannerDayOptionView[];
};

type PlannerFeedback = {
  kind: "info" | "success" | "error";
  title: string;
  message: string;
};

type PendingPlannerSubmission = {
  weekday: string;
  label: string;
};

type ActionPlanFormProps = {
  runId: string;
  currentWeek: number;
  currentMood: number;
  currentStress: number;
  attendanceLocked: boolean;
  defaultAttendanceStrategy: CourseAttendanceStrategy;
  plannerStatusText: string;
  plannerLines: string[];
  readyToConfirm: boolean;
  plannerFeedback?: PlannerFeedback;
  days: PlannerDayView[];
};

type OptimisticPlan = {
  optionLabel: string;
  skipClassSelected: boolean;
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
  testId?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={props.className}
      onClick={props.onClick}
      data-testid={props.testId}
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

export function resolvePendingPlanStatus(
  days: PlannerDayView[],
  pendingPlan: PendingPlannerSubmission | null,
  plannerFeedback?: PlannerFeedback,
) {
  if (!pendingPlan) {
    return "idle" as const;
  }

  const serverDay = days.find((day) => day.weekday === pendingPlan.weekday);

  if (serverDay?.plannedActionLabel === pendingPlan.label) {
    return "confirmed" as const;
  }

  if (plannerFeedback?.kind === "error") {
    return "rejected" as const;
  }

  return "waiting" as const;
}

function optionVisual(optionId: string) {
  if (optionId.includes("study") || optionId.includes("postgraduate")) {
    return { icon: "book" as const, tone: "teal" };
  }
  if (optionId.includes("job") || optionId.includes("part_time")) {
    return { icon: "chart" as const, tone: "amber" };
  }
  if (optionId.includes("social")) {
    return { icon: "users" as const, tone: "mint" };
  }
  if (optionId.includes("relax") || optionId.includes("big_meal")) {
    return { icon: "moon" as const, tone: "blue" };
  }

  return { icon: "spark" as const, tone: "teal" };
}

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
) {
  return days.map((day) => {
    if (day.weekday !== weekday) {
      return {
        ...day,
        justPlanned: false,
      };
    }

    const effectiveTypeLabel =
      skipClassSelected && day.skipClassAvailable
        ? day.baseTypeLabel.includes("半天")
          ? "翘掉半天课后补成完整白天，可安排白天行动"
          : "翘掉白天课后释放完整白天，可安排白天行动"
        : day.effectiveTypeLabel;

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

function applyOptimisticPlans(days: PlannerDayView[], optimisticPlans: Record<string, OptimisticPlan>) {
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

export function handlePlannerDayKeyDown(
  event: Pick<KeyboardEvent<HTMLElement>, "key" | "preventDefault">,
  onActivate: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onActivate();
}

export function buildPlannerDayAriaLabel(day: PlannerDayView, attendanceLocked: boolean) {
  const detail = day.plannedActionLabel ? `已安排 ${day.plannedActionLabel}` : day.effectiveTypeLabel;
  const eventLabel = day.eventTitle ? `，事件 ${day.eventTitle}` : "";
  const readinessLabel = attendanceLocked ? "" : "，需先确认本周课程态度";

  return `${day.label}，${day.status}，${detail}${eventLabel}${readinessLabel}`;
}

function badgeClassName(badge: string) {
  if (badge === "本日事件相关") {
    return "bg-amber-100 text-amber-900";
  }

  if (badge === "现金风险优先") {
    return "bg-rose-100 text-rose-900";
  }

  return "bg-emerald-100 text-emerald-900";
}

function GlobalPlannerDialog(props: {
  children: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return null;
  }

  return createPortal(props.children, document.body);
}

export function ActionPlanForm({
  runId,
  currentWeek,
  currentMood,
  currentStress,
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
  const [pendingPlan, setPendingPlan] = useState<PendingPlannerSubmission | null>(null);
  const [optimisticPlans, setOptimisticPlans] = useState<Record<string, OptimisticPlan>>({});

  const plannerDays = useMemo(() => applyOptimisticPlans(days, optimisticPlans), [days, optimisticPlans]);
  const selectedDay = plannerDays.find((day) => day.weekday === selectedWeekday) ?? null;
  const currentOptions = selectedDay
    ? skipClassDraft && selectedDay.skipClassAvailable
      ? selectedDay.skipOptions
      : selectedDay.normalOptions
    : [];
  const activeFeedback = localFeedback ?? plannerFeedback ?? null;
  const missingCount = useMemo(() => countUnplannedDays(plannerDays), [plannerDays]);
  const plannerSavePending = pendingPlan !== null;
  const readyToConfirmNow = attendanceLocked && !plannerSavePending && (readyToConfirm || plannerDays.length > 0);
  const highlightedWeekday =
    pendingPlan?.weekday ?? plannerDays.find((day) => day.justPlanned)?.weekday ?? null;
  const eventNotice = selectedDay
    ? buildPlannerEventNotice({
        eventTitle: selectedDay.eventTitle,
        eventSummary: selectedDay.eventSummary,
        eventAttendSummary: selectedDay.eventAttendSummary,
        eventSkipSummary: selectedDay.eventSkipSummary,
        options: currentOptions,
      })
    : null;
  const statusGuidance = buildStatusGuidance({
    mood: currentMood,
    stress: currentStress,
  });

  function openDayPlanner(day: PlannerDayView) {
    if (plannerSavePending) {
      setLocalFeedback({
        kind: "info",
        title: "正在保存上一天安排",
        message: "等这一天写回周排程后，再继续点下一天，能避免快速连点时把真实安排覆盖掉。",
      });
      return;
    }

    if (!attendanceLocked) {
      setLocalFeedback({
        kind: "info",
        title: "先确认这周课程态度",
        message: "课程态度还没锁定前，这些天还不能真正排进去。先保存本周课程态度，再逐天点选。",
      });
      return;
    }

    setLocalFeedback(null);
    setPendingPlan(null);
    setSelectedWeekday(day.weekday);
    setSkipClassDraft(day.skipClassSelected);
  }

  function markPlanAsPending(day: PlannerDayView, option: PlannerDayOptionView) {
    setOptimisticPlans((currentPlans) => ({
      ...currentPlans,
      [day.weekday]: {
        optionLabel: option.label,
        skipClassSelected: skipClassDraft && day.skipClassAvailable,
      },
    }));
    setPendingPlan({
      weekday: day.weekday,
      label: option.label,
    });
    setLocalFeedback({
      kind: "success",
      title: `${day.label} 已点入`,
      message: `已经把“${option.label}”排到这一天，顶部剩余天数和当天卡片会立刻同步更新。`,
    });
  }

  return (
    <div className="space-y-6">
      <span
        data-testid="planner-client-ready"
        data-ready={typeof window === "undefined" ? "false" : "true"}
        suppressHydrationWarning
        hidden
      />
      <span data-testid="planner-attendance-locked" data-locked={attendanceLocked ? "true" : "false"} hidden />

      <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-6 text-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-stone-900">第 {currentWeek} 周安排</p>
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
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
          <p className="font-semibold">{statusGuidance.summary}</p>
          <p className="mt-1">{statusGuidance.strategy}</p>
        </div>
      </div>

      {activeFeedback ? <FeedbackBanner feedback={activeFeedback} /> : null}

      {pendingPlan ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">
            {plannerDays.find((day) => day.weekday === pendingPlan.weekday)?.label} 已点入
          </p>
          <p className="mt-1">已经把“{pendingPlan.label}”排到这一天，正在保存并回填本周排程。</p>
        </div>
      ) : null}

      <form
        action={submitActionTurnAction}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/80 p-4"
        data-testid="attendance-form"
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
            disabled={attendanceLocked || plannerSavePending}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-stone-800 disabled:bg-stone-100"
          >
            <option value="serious">认真上课</option>
            <option value="mixed">正常混课</option>
            <option value="phone">人在课堂，魂在手机</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label={attendanceLocked ? "本周课程态度已锁定" : "先确认本周课程态度"}
            pendingLabel="正在保存课程态度..."
            disabled={attendanceLocked || plannerSavePending}
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            testId="set-attendance-submit"
          />
          <PendingHint text="正在保存这周的课程态度..." />
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {plannerDays.map((day) => {
          const isHighlighted = highlightedWeekday === day.weekday;
          const isPlanned = Boolean(day.plannedActionLabel);

          return (
            <div
              key={day.weekday}
              role="button"
              tabIndex={0}
               aria-haspopup="dialog"
               aria-expanded={selectedWeekday === day.weekday}
               aria-disabled={!attendanceLocked || plannerSavePending}
               aria-label={buildPlannerDayAriaLabel(day, attendanceLocked)}
               onClick={() => openDayPlanner(day)}
              onKeyDown={(event) => handlePlannerDayKeyDown(event, () => openDayPlanner(day))}
              data-testid={`planner-day-${day.weekday}`}
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
                  {day.eventTitle ? "有事件" : isPlanned ? "已安排" : "可排"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700" data-testid={`planner-day-action-${day.weekday}`}>
                {day.plannedActionLabel ? `已安排：${day.plannedActionLabel}` : day.effectiveTypeLabel}
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-500">默认节奏：{day.baseTypeLabel}</p>
              {day.eventTitle ? <p className="mt-2 text-xs leading-5 text-amber-700">{day.eventTitle}</p> : null}
              {day.hasCashRisk ? (
                <p className="mt-2 text-xs leading-5 text-rose-700">这周现金有点紧，赚钱或止损行动会优先显示。</p>
              ) : null}
              {!attendanceLocked ? (
                <p className="mt-3 text-xs leading-5 text-stone-500">先定课程态度，再点这一天。</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <form
        action={submitActionTurnAction}
        className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/80 p-4"
        data-testid="confirm-week-form"
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
            testId="confirm-week-submit"
          />
          {attendanceLocked ? (
            <span className="text-sm text-stone-500">
              没点到的日期会自动补成“摆烂 / 发呆”，不会因为漏选卡住。
            </span>
          ) : (
            <span className="text-sm text-stone-500">先把这周课程态度锁定，系统才能结算这一周。</span>
          )}
        </div>
        <PendingHint text="正在统一结算本周安排；如果这是月末，也会顺带生成 AI 月记 / 月度总结。" />
      </form>

      {selectedDay ? (
        <GlobalPlannerDialog>
          <div className="fm-dialog-backdrop">
            <div
              className="fm-dialog"
              data-testid="action-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="planner-action-dialog-title"
            >
            <div className="fm-dialog__header">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--fm-brand-dark)]">
                  {selectedDay.label}
                </p>
                <h2 id="planner-action-dialog-title" className="mt-2 text-2xl font-semibold text-stone-900">
                  给这一天排一个行动
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  默认节奏：{selectedDay.baseTypeLabel}。当前可排：
                  {skipClassDraft && selectedDay.skipClassAvailable
                    ? selectedDay.baseTypeLabel.includes("半天")
                      ? "翘掉半天课后补成完整白天"
                      : "翘掉白天课后释放完整白天时间"
                    : selectedDay.effectiveTypeLabel}
                  。
                </p>
                {selectedDay.eventTitle ? (
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    {selectedDay.eventTitle}：{selectedDay.eventSummary}
                  </p>
                ) : null}
                <p className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
                  {statusGuidance.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeekday(null)}
                className="fm-dialog__close"
                data-testid="action-modal-close"
              >
                <FmIcon name="chevron-right" className="h-4 w-4 rotate-180" />
              </button>
            </div>

            <div className="fm-dialog__body">
              {eventNotice ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                    eventNotice.tone === "amber"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-stone-200 bg-stone-50 text-stone-700"
                  }`}
                >
                  <p className="font-semibold">{eventNotice.title}</p>
                  <p className="mt-1">{eventNotice.body}</p>
                </div>
              ) : null}

              {selectedDay.skipClassAvailable ? (
                <label className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-700">
                  <input
                    type="checkbox"
                    checked={skipClassDraft}
                    onChange={(event) => setSkipClassDraft(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600"
                  />
                  <span>
                    {selectedDay.baseTypeLabel.includes("半天")
                      ? "这天翘掉半天课，把半天空档补成完整白天。代价较轻，学业、压力和风险都会小幅波动。"
                      : "这天翘掉白天课，释放白天时间。代价是学业会掉一点、压力会再上来一点。"}
                  </span>
                </label>
              ) : null}

              <div className="mt-4">
                {currentOptions.map((option) => {
                  const visual = optionVisual(option.optionId);

                  return (
                    <form
                      key={option.optionId}
                      action={submitActionTurnAction}
                      className={`fm-option-card ${option.selected ? "is-selected" : ""}`}
                      data-testid={`action-option-${option.optionId}`}
                      onSubmit={() => {
                        markPlanAsPending(selectedDay, option);
                        setSelectedWeekday(null);
                      }}
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
                      <div className={`fm-option-card__icon tone-${visual.tone}`}>
                        <FmIcon name={visual.icon} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 data-testid="action-option-label">{option.label}</h3>
                            {option.badges.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {option.badges.map((badge) => (
                                  <span
                                    key={`${option.optionId}-${badge}`}
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClassName(badge)}`}
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <SubmitButton
                            label="安排"
                            pendingLabel="保存中..."
                            disabled={plannerSavePending}
                            className="rounded-full bg-[var(--fm-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fm-brand-dark)]"
                            testId="action-option-submit"
                          />
                        </div>
                        <p>{option.description}</p>
                      </div>
                    </form>
                  );
                })}
              </div>
            </div>

            <div className="fm-dialog__footer">
              <button
                type="button"
                className="fm-outline-button"
                onClick={() => {
                  if (!plannerSavePending) {
                    setSelectedWeekday(null);
                  }
                }}
                data-testid="action-modal-cancel"
              >
                取消
              </button>
              <button type="button" className="fm-solid-button" disabled>
                点选卡片后立即保存
              </button>
            </div>
            </div>
          </div>
        </GlobalPlannerDialog>
      ) : null}
    </div>
  );
}

"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";

import { planWeekdayActionAction, submitActionTurnAction } from "@/app/actions";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import { LoadingOverlay } from "@/components/loading-overlay";
import { buildPlannerEventNotice } from "@/lib/planner-option-priority";
import { buildStatusGuidance } from "@/lib/status-guidance";
import type { ActionType, CourseAttendanceStrategy } from "@/types/game";

type PlannerDayOptionView = {
  optionId: string;
  action: ActionType;
  label: string;
  description: string;
  progressText?: string;
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

type QueuedPlannerSave = {
  weekday: string;
  dayLabel: string;
  optionId: string;
  optionLabel: string;
  skipClassSelected: boolean;
};

type DaySaveState = "saving" | "error";

export type PlannedActionSnapshot = {
  weekday: string;
  optionId: string;
  skipClass: boolean;
};

function PendingHint({ text }: { text: string }) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return <p className="text-sm leading-6 text-amber-700">{text}</p>;
}

function ConfirmWeekOverlay() {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <LoadingOverlay
      title="正在整理这个月的记录"
      body="系统正在结算本周安排。如果这是月末，AI 也在把本月经历写成月记，可能需要几秒钟。失败时会自动保留规则摘要。"
    />
  );
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

export function replacePlannerDay(days: PlannerDayView[], savedDay: PlannerDayView) {
  return days.map((day) => (day.weekday === savedDay.weekday ? clonePlannerDay(savedDay) : { ...day, justPlanned: false }));
}

export function buildPlannedActionsSnapshot(days: PlannerDayView[]): PlannedActionSnapshot[] {
  return days.flatMap((day) => {
    if (!day.plannedActionLabel) {
      return [];
    }

    const activeOptions = day.skipClassSelected && day.skipClassAvailable ? day.skipOptions : day.normalOptions;
    const selectedOption =
      activeOptions.find((option) => option.selected && option.label === day.plannedActionLabel) ??
      activeOptions.find((option) => option.label === day.plannedActionLabel);

    if (!selectedOption) {
      return [];
    }

    return [
      {
        weekday: day.weekday,
        optionId: selectedOption.optionId,
        skipClass: day.skipClassSelected && day.skipClassAvailable,
      },
    ];
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
  const [optimisticPlans, setOptimisticPlans] = useState<Record<string, OptimisticPlan>>({});
  const [daySaveState, setDaySaveState] = useState<Record<string, DaySaveState>>({});
  const [savedDayPatches, setSavedDayPatches] = useState<Record<string, { scopeKey: string; day: PlannerDayView }>>({});
  const [queuedSaveCount, setQueuedSaveCount] = useState(0);
  const pendingSaveQueueRef = useRef<QueuedPlannerSave[]>([]);
  const processingSaveRef = useRef(false);
  const plannerScopeKey = `${runId}:${currentWeek}`;
  const plannerBaseDays = useMemo(() => {
    const baseDays = days.map(clonePlannerDay);
    const scopedSavedDays = Object.values(savedDayPatches)
      .filter((item) => item.scopeKey === plannerScopeKey)
      .map((item) => item.day);

    return scopedSavedDays.reduce((currentDays, savedDay) => replacePlannerDay(currentDays, savedDay), baseDays);
  }, [days, plannerScopeKey, savedDayPatches]);
  const plannerDays = useMemo(() => applyOptimisticPlans(plannerBaseDays, optimisticPlans), [plannerBaseDays, optimisticPlans]);
  const selectedDay = plannerDays.find((day) => day.weekday === selectedWeekday) ?? null;
  const currentOptions = selectedDay
    ? skipClassDraft && selectedDay.skipClassAvailable
      ? selectedDay.skipOptions
      : selectedDay.normalOptions
    : [];
  const activeFeedback = localFeedback ?? plannerFeedback ?? null;
  const missingCount = useMemo(() => countUnplannedDays(plannerDays), [plannerDays]);
  const plannedActionsSnapshot = useMemo(() => JSON.stringify(buildPlannedActionsSnapshot(plannerDays)), [plannerDays]);
  const plannerSavePending = queuedSaveCount > 0;
  const readyToConfirmNow = attendanceLocked && !plannerSavePending && (readyToConfirm || plannerDays.length > 0);
  const highlightedWeekday = plannerDays.find((day) => day.justPlanned)?.weekday ?? null;
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

  async function flushPlannerSaveQueue() {
    if (processingSaveRef.current) {
      return;
    }

    processingSaveRef.current = true;

    while (pendingSaveQueueRef.current.length > 0) {
      const request = pendingSaveQueueRef.current[0]!;

      try {
        const result = await planWeekdayActionAction({
          runId,
          weekday: request.weekday as "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
          optionId: request.optionId,
          skipClass: request.skipClassSelected,
        });
        const hasAnotherPendingForSameDay = pendingSaveQueueRef.current
          .slice(1)
          .some((item) => item.weekday === request.weekday);

        setSavedDayPatches((currentPatches) => ({
          ...currentPatches,
          [request.weekday]: {
            scopeKey: plannerScopeKey,
            day:
              result.savedDay ??
              applyOptimisticPlan(days.map(clonePlannerDay), request.weekday, request.optionLabel, request.skipClassSelected)
                .find((day) => day.weekday === request.weekday)!,
          },
        }));

        if (!hasAnotherPendingForSameDay) {
          setOptimisticPlans((currentPlans) => {
            const nextPlans = { ...currentPlans };
            delete nextPlans[request.weekday];
            return nextPlans;
          });
          setDaySaveState((currentState) => {
            const nextState = { ...currentState };
            delete nextState[request.weekday];
            return nextState;
          });
        }

        setLocalFeedback({
          kind: "success",
          title: `${request.dayLabel} 已保存`,
          message: `“${request.optionLabel}”已经写回本周安排。你可以继续安排后面的日期。`,
        });
      } catch {
        setOptimisticPlans((currentPlans) => {
          const nextPlans = { ...currentPlans };
          delete nextPlans[request.weekday];
          return nextPlans;
        });
        setDaySaveState((currentState) => ({
          ...currentState,
          [request.weekday]: "error",
        }));
        setLocalFeedback({
          kind: "error",
          title: `${request.dayLabel} 保存失败`,
          message: "这一天的安排还没有写回存档，你可以重新点开这一天再试一次。",
        });
      } finally {
        pendingSaveQueueRef.current = pendingSaveQueueRef.current.slice(1);
        setQueuedSaveCount(pendingSaveQueueRef.current.length);
      }
    }

    processingSaveRef.current = false;
  }

  function openDayPlanner(day: PlannerDayView) {
    if (!attendanceLocked) {
      setLocalFeedback({
        kind: "info",
        title: "先确认这周课程态度",
        message: "课程态度还没锁定前，这些天还不能真正排进去。先保存本周课程态度，再逐天点选。",
      });
      return;
    }

    setLocalFeedback(null);
    setSelectedWeekday(day.weekday);
    setSkipClassDraft(day.skipClassSelected);
  }

  function queuePlannerSave(day: PlannerDayView, option: PlannerDayOptionView) {
    const skipClassSelected = skipClassDraft && day.skipClassAvailable;
    const nextRequest: QueuedPlannerSave = {
      weekday: day.weekday,
      dayLabel: day.label,
      optionId: option.optionId,
      optionLabel: option.label,
      skipClassSelected,
    };
    const currentQueue = pendingSaveQueueRef.current;
    const hasActiveRequest = processingSaveRef.current && currentQueue.length > 0;
    const preservedActive = hasActiveRequest ? [currentQueue[0]!] : [];
    const remainingQueue = (hasActiveRequest ? currentQueue.slice(1) : currentQueue).filter(
      (item) => item.weekday !== day.weekday,
    );

    pendingSaveQueueRef.current = [...preservedActive, ...remainingQueue, nextRequest];
    setQueuedSaveCount(pendingSaveQueueRef.current.length);
    setOptimisticPlans((currentPlans) => ({
      ...currentPlans,
      [day.weekday]: {
        optionLabel: option.label,
        skipClassSelected,
      },
    }));
    setDaySaveState((currentState) => ({
      ...currentState,
      [day.weekday]: "saving",
    }));
    setLocalFeedback({
      kind: "success",
      title: `${day.label} 已安排`,
      message: `已经把“${option.label}”排到这一天，后台会按顺序写回存档。`,
    });
    setSelectedWeekday(null);
    setSkipClassDraft(false);

    void flushPlannerSaveQueue();
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

      {plannerSavePending ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">正在保存最近安排</p>
          <p className="mt-1">后台还在写回 {queuedSaveCount} 天安排。你可以继续点开下一天，但确认本周前会先全部保存完成。</p>
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
          const saveState = daySaveState[day.weekday];
          const badgeText =
            saveState === "saving"
              ? "保存中"
              : saveState === "error"
                ? "待重试"
                : day.eventTitle
                  ? "有事件"
                  : isPlanned
                    ? "已安排"
                    : "可排";
          const badgeClassName =
            saveState === "saving"
              ? "bg-sky-100 text-sky-800"
              : saveState === "error"
                ? "bg-rose-100 text-rose-800"
                : day.eventTitle
                  ? "bg-amber-100 text-amber-800"
                  : isPlanned
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-stone-900 text-stone-50";

          return (
            <div
              key={day.weekday}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-expanded={selectedWeekday === day.weekday}
              aria-disabled={!attendanceLocked}
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
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}>{badgeText}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700" data-testid={`planner-day-action-${day.weekday}`}>
                {day.plannedActionLabel ? `已安排：${day.plannedActionLabel}` : day.effectiveTypeLabel}
              </p>
              {day.eventTitle ? <p className="mt-2 text-xs leading-5 text-amber-700">{day.eventTitle}</p> : null}
              {saveState === "saving" ? (
                <p className="mt-2 text-xs leading-5 text-sky-700">这一天正在写回存档，可以先继续安排别的日期。</p>
              ) : null}
              {saveState === "error" ? (
                <p className="mt-2 text-xs leading-5 text-rose-700">上一次保存没有成功，重新点开这一天后可以再试一次。</p>
              ) : null}
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
        <input type="hidden" name="plannedActionsSnapshot" value={plannedActionsSnapshot} />
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
        <ConfirmWeekOverlay />
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
                    可安排时间：
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
                    const selectedDaySavePending = daySaveState[selectedDay.weekday] === "saving";

                    return (
                      <article
                        key={option.optionId}
                        className={`fm-option-card ${option.selected ? "is-selected" : ""}`}
                        data-testid={`action-option-${option.optionId}`}
                      >
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
                            <button
                              type="button"
                              onClick={() => queuePlannerSave(selectedDay, option)}
                              disabled={selectedDaySavePending}
                              className="rounded-full bg-[var(--fm-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fm-brand-dark)] disabled:cursor-not-allowed disabled:bg-stone-400"
                              data-testid="action-option-submit"
                            >
                              {selectedDaySavePending ? "保存中..." : "安排"}
                            </button>
                          </div>
                          <p>{option.description}</p>
                          {option.progressText ? (
                            <p className="mt-2 text-xs leading-5 text-stone-500">{option.progressText}</p>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="fm-dialog__footer">
                <button
                  type="button"
                  className="fm-outline-button"
                  onClick={() => setSelectedWeekday(null)}
                  data-testid="action-modal-cancel"
                >
                  取消
                </button>
                <button type="button" className="fm-solid-button" disabled>
                  点选后自动后台保存
                </button>
              </div>
            </div>
          </div>
        </GlobalPlannerDialog>
      ) : null}
    </div>
  );
}

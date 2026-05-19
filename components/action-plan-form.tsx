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
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmLoadingState } from "@/components/fm-ui/FmLoadingState";
import { FmIcon } from "@/components/fm-ui/FmScaffold";
import { LoadingOverlay } from "@/components/loading-overlay";
import type { ActionType, CourseAttendanceStrategy, WeeklyDayType } from "@/types/game";

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
  baseDayTypeKey: WeeklyDayType;
  baseTypeLabel: string;
  effectiveDayTypeKey: WeeklyDayType;
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
  attendanceLocked: boolean;
  defaultAttendanceStrategy: CourseAttendanceStrategy;
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
      title="这周结束了，稍等一下。"
      body="正在把这段时间记下来……"
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
      className={`fm-card fm-card--pad text-sm leading-6 ${
        feedback.kind === "error"
          ? "fm-card--danger"
          : feedback.kind === "success"
            ? "fm-card--completed"
            : "fm-card--warning"
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

type ActionEffectTone = "academic" | "money" | "mood" | "stress" | "resume" | "event";
type ActionEffect = {
  label: string;
  tone: ActionEffectTone;
  direction: "up" | "down" | "flat";
};

function buildActionEffects(action: ActionType): ActionEffect[] {
  switch (action) {
    case "study":
      return [
        { label: "学业", tone: "academic", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
        { label: "心情", tone: "mood", direction: "down" },
      ];
    case "writing_research":
      return [
        { label: "学业", tone: "academic", direction: "up" },
        { label: "履历", tone: "resume", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    case "job_prep":
      return [
        { label: "履历", tone: "resume", direction: "up" },
        { label: "金钱", tone: "money", direction: "down" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    case "postgraduate_prep":
      return [
        { label: "学业", tone: "academic", direction: "up" },
        { label: "深造", tone: "resume", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    case "public_exam_prep":
      return [
        { label: "公考", tone: "resume", direction: "up" },
        { label: "金钱", tone: "money", direction: "down" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    case "competition_project":
      return [
        { label: "履历", tone: "resume", direction: "up" },
        { label: "学业", tone: "academic", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    case "part_time":
      return [
        { label: "金钱", tone: "money", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
        { label: "心情", tone: "mood", direction: "down" },
      ];
    case "social":
      return [
        { label: "社交", tone: "event", direction: "up" },
        { label: "心情", tone: "mood", direction: "up" },
        { label: "金钱", tone: "money", direction: "down" },
      ];
    case "relax":
      return [
        { label: "心情", tone: "mood", direction: "up" },
        { label: "压力", tone: "stress", direction: "down" },
      ];
    case "big_meal":
      return [
        { label: "心情", tone: "mood", direction: "up" },
        { label: "压力", tone: "stress", direction: "down" },
        { label: "金钱", tone: "money", direction: "down" },
      ];
    case "student_activity":
      return [
        { label: "社交", tone: "event", direction: "up" },
        { label: "履历", tone: "resume", direction: "up" },
        { label: "压力", tone: "stress", direction: "down" },
      ];
    case "remedy":
      return [
        { label: "学业", tone: "academic", direction: "flat" },
        { label: "压力", tone: "stress", direction: "down" },
        { label: "金钱", tone: "money", direction: "down" },
      ];
    case "ask_family":
      return [
        { label: "金钱", tone: "money", direction: "up" },
        { label: "压力", tone: "stress", direction: "up" },
      ];
    default:
      return [{ label: "状态", tone: "event", direction: "flat" }];
  }
}

function badgeTone(badge: string) {
  if (badge.includes("事件")) {
    return "event" as const;
  }

  if (badge.includes("现金")) {
    return "warning" as const;
  }

  return "ending" as const;
}

function formatActionEffectLabel(effect: ActionEffect) {
  if (effect.direction === "flat") {
    return effect.label;
  }

  if (effect.direction === "up") {
    if (effect.label === "压力") {
      return "压力上升";
    }

    if (effect.label === "心情") {
      return "心情回升";
    }

    if (effect.label === "金钱") {
      return "手头变宽";
    }

    return `${effect.label}提升`;
  }

  if (effect.label === "压力") {
    return "压力缓和";
  }

  if (effect.label === "心情") {
    return "心情下降";
  }

  if (effect.label === "金钱") {
    return "花钱";
  }

  return `${effect.label}下降`;
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
  attendanceLocked,
  defaultAttendanceStrategy,
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
          title: `${request.dayLabel} 已记下`,
          message: `“${request.optionLabel}”已经留在这一天了。`,
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
          title: `${request.dayLabel} 还没记上`,
          message: "这一天的安排没留住，再点开试一次就行。",
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
        message: "先把这周怎么上课定下来，再给每天留安排。",
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
      message: `“${option.label}”已经留在这一天了。`,
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

      <div className="fm-planner-summary text-sm leading-6 text-stone-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-stone-900">第 {currentWeek} 周安排</p>
          {missingCount > 0 ? (
            <FmBadge tone="neutral">还剩 {missingCount} 天没安排</FmBadge>
          ) : (
            <FmBadge tone="academic">这一周已经排满</FmBadge>
          )}
        </div>
        {attendanceLocked ? <p className="mt-2">{`这周已经排了 ${7 - missingCount} / 7 天。`}</p> : null}
      </div>

      {activeFeedback ? <FeedbackBanner feedback={activeFeedback} /> : null}

      {plannerSavePending ? (
        <div className="fm-planner-save-note">
          <FmLoadingState
            inline
            title="刚定下来的安排还在落稳"
            body={`还有 ${queuedSaveCount} 天正在记下，你可以先继续看下一天。`}
          />
        </div>
      ) : null}

      <form
        action={submitActionTurnAction}
        className="fm-form-card space-y-4"
        data-testid="attendance-form"
      >
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="intent" value="set_attendance" />
        <div className="space-y-3">
          <label className="text-sm font-semibold text-stone-800" htmlFor="attendanceStrategy">
            这周怎么上课
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
            label="这周就这样上课"
            pendingLabel="正在记下这周怎么上课……"
            disabled={attendanceLocked || plannerSavePending}
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
            testId="set-attendance-submit"
          />
          <PendingHint text="正在记下这周怎么上课……" />
        </div>
      </form>

      <div className="fm-day-grid">
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
          const cardClassName = `fm-day-card ${isHighlighted ? "fm-day-card--highlight" : ""} ${isPlanned ? "fm-day-card--planned" : ""} ${
            !attendanceLocked ? "fm-day-card--disabled" : ""
          }`.trim();

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
              className={cardClassName}
            >
              <div className="fm-day-card__top">
                <div>
                  <p className="fm-day-card__title">{day.label}</p>
                  <p className="fm-day-card__status">{day.status}</p>
                </div>
                <FmBadge
                  tone={
                    saveState === "saving"
                      ? "ending"
                      : saveState === "error"
                        ? "danger"
                        : day.eventTitle
                          ? "event"
                          : isPlanned
                            ? "academic"
                            : "neutral"
                  }
                >
                  {badgeText}
                </FmBadge>
              </div>
              <p className="fm-day-card__body" data-testid={`planner-day-action-${day.weekday}`}>
                {day.plannedActionLabel ? `已安排：${day.plannedActionLabel}` : day.effectiveTypeLabel}
              </p>
              {day.eventTitle ? <p className="fm-day-card__meta">{day.eventTitle}</p> : null}
              {saveState === "saving" ? (
                <p className="fm-day-card__meta">先留在这里了，去看下一天吧。</p>
              ) : null}
              {saveState === "error" ? (
                <p className="fm-day-card__meta">这一下没记住，再点一次试试。</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <form
        action={submitActionTurnAction}
        className="fm-confirm-card space-y-3"
        data-testid="confirm-week-form"
      >
        <input type="hidden" name="runId" value={runId} />
        <input type="hidden" name="intent" value="confirm_week" />
        <input type="hidden" name="attendanceStrategy" value={defaultAttendanceStrategy} />
        <input type="hidden" name="plannedActionsSnapshot" value={plannedActionsSnapshot} />
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton
            label="确认"
            pendingLabel="这周结束了，稍等一下。"
            disabled={!readyToConfirmNow}
            className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            testId="confirm-week-submit"
          />
          {!attendanceLocked ? (
            <span className="text-sm text-stone-500">先把这周怎么上课定下来。</span>
          ) : null}
        </div>
        <PendingHint text="这周结束了，稍等一下。" />
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
                    给这一天留一个安排
                  </h2>
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
                {selectedDay.skipClassAvailable ? (
                  <label className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-700">
                    <input
                      type="checkbox"
                      checked={skipClassDraft}
                      onChange={(event) => setSkipClassDraft(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600"
                    />
                    <span>
                      {selectedDay.baseDayTypeKey === "half_day"
                        ? "翘掉半天课，腾出更完整的白天。学业会受一点影响。"
                        : "翘掉白天课，腾出一整天。学业会受影响，压力也会更明显。"}
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
                                    <FmBadge key={`${option.optionId}-${badge}`} tone={badgeTone(badge)}>
                                      {badge}
                                    </FmBadge>
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
                          <div className="fm-option-effects">
                            {buildActionEffects(option.action).map((effect) => (
                              <span key={`${option.optionId}-${effect.label}`} className={`fm-option-effect fm-option-effect--${effect.tone}`}>
                                {formatActionEffectLabel(effect)}
                              </span>
                            ))}
                          </div>
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
                  确认
                </button>
              </div>
            </div>
          </div>
        </GlobalPlannerDialog>
      ) : null}
    </div>
  );
}

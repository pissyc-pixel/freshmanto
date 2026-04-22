import { submitActionTurnAction } from "@/app/actions";
import {
  actionTimeOptions,
  attendanceStrategyOptions,
  formatReleasedClassDayList,
} from "@/lib/demo/options";
import { actionOptions, skipClassDayOptions } from "@/components/action-plan-form-options";
import type { CourseAttendanceStrategy, Weekday } from "@/types/game";

type ActionPlanFormProps = {
  runId: string;
  currentWeek: number;
  remainingTimeUnits: number;
  totalTimeUnits: number;
  releasedClassDays: Weekday[];
  defaultAttendanceStrategy?: CourseAttendanceStrategy;
};

export function ActionPlanForm({
  runId,
  currentWeek,
  remainingTimeUnits,
  totalTimeUnits,
  releasedClassDays,
  defaultAttendanceStrategy = "mixed",
}: ActionPlanFormProps) {
  return (
    <form action={submitActionTurnAction} className="space-y-5">
      <input type="hidden" name="runId" value={runId} />

      <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-6 text-stone-700">
        <p className="font-semibold text-stone-900">
          第 {currentWeek} 周，剩余 {remainingTimeUnits} / {totalTimeUnits} 个半天
        </p>
        <p className="mt-2">
          现在每次只推进一个动作。普通动作会消耗本周时间池；时间池耗尽时自动结束本周。
          如果你不想把这一周的时间全部用完，也可以直接提前结束本周。
        </p>
        <p className="mt-2 text-xs text-stone-500">
          已释放的白天课程日：
          {releasedClassDays.length > 0 ? ` ${formatReleasedClassDayList(releasedClassDays)}` : " 暂无"}
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-stone-800" htmlFor="attendanceStrategy">
          本周课程策略
        </label>
        <select
          id="attendanceStrategy"
          name="attendanceStrategy"
          defaultValue={defaultAttendanceStrategy}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-stone-800"
        >
          {attendanceStrategyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
        <p className="text-sm font-semibold text-stone-900">执行一个动作</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <select
            name="action"
            defaultValue="study"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-800"
          >
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
          <select
            name="time"
            defaultValue="night"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-800"
          >
            {actionTimeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-stone-50/80 p-4">
          <p className="text-sm font-semibold text-stone-900">
            `skip_class` 只在选择该动作时生效
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            这一步不会直接扣学业值，只会把本周还被课程锁住的白天整块释放出来，并把代价转成点名风险、
            平时分风险、代签花费和后续补救压力。
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {skipClassDayOptions.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-700"
              >
                <input
                  type="checkbox"
                  name="skipClassDays"
                  value={option.value}
                  defaultChecked={releasedClassDays.includes(option.value)}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </article>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-3 text-sm leading-6 text-stone-600">
        周一 / 三 / 五默认只有夜间，周二 / 四有白天 + 夜间，周六 / 日是完整双时段。
        `job_prep` 和 `part_time` 会消耗 2 个半天；`big_meal`、`ask_family`、`skip_class`
        都是 0 时间动作。
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="act"
          className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
        >
          结算这个动作
        </button>
        <button
          type="submit"
          name="intent"
          value="end_week"
          className="rounded-full border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          提前结束本周
        </button>
      </div>
    </form>
  );
}

import { submitActionTurnAction } from "@/app/actions";
import {
  actionOptions,
  actionTimeOptions,
  attendanceStrategyOptions,
} from "@/lib/demo/options";
import type { CourseAttendanceStrategy } from "@/types/game";

type ActionPlanFormProps = {
  runId: string;
  currentWeek: number;
  defaultAttendanceStrategy?: CourseAttendanceStrategy;
};

export function ActionPlanForm({
  runId,
  currentWeek,
  defaultAttendanceStrategy = "mixed",
}: ActionPlanFormProps) {
  return (
    <form action={submitActionTurnAction} className="space-y-5">
      <input type="hidden" name="runId" value={runId} />

      <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4 text-sm leading-6 text-stone-700">
        <p className="font-semibold text-stone-900">当前回合：第 {currentWeek} 周</p>
        <p className="mt-2">
          每次只提交 1 个行动，系统会立刻结算并刷新状态。普通行动会推进到下一周；
          “吃大餐”属于即时消费，不会额外占掉本周的时间。
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
        <p className="text-sm font-semibold text-stone-900">本周行动</p>
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
      </article>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-3 text-sm leading-6 text-stone-600">
        周六、周日为完全空闲，周二、周四为半天空档，其余工作日白天默认忙碌。
        兼职不能安排在夜间；翘课的代价也不再是直接扣学业值，而是通过点名风险、平时分风险、
        代签花费和后续补救压力体现出来。
      </div>

      <button
        type="submit"
        className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
      >
        结算这一轮
      </button>
    </form>
  );
}

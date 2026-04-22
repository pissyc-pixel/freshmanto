import { submitMonthlyPlanAction } from "@/app/actions";
import { actionOptions, actionTimeOptions, attendanceStrategyOptions } from "@/lib/demo/options";
import type { CourseAttendanceStrategy } from "@/types/game";

type ActionPlanFormProps = {
  runId: string;
  defaultAttendanceStrategy?: CourseAttendanceStrategy;
};

export function ActionPlanForm({
  runId,
  defaultAttendanceStrategy = "mixed"
}: ActionPlanFormProps) {
  return (
    <form action={submitMonthlyPlanAction} className="space-y-5">
      <input type="hidden" name="runId" value={runId} />

      <div className="space-y-3">
        <label className="text-sm font-semibold text-stone-800" htmlFor="attendanceStrategy">
          本月课程策略
        </label>
        <select
          id="attendanceStrategy"
          name="attendanceStrategy"
          defaultValue={defaultAttendanceStrategy}
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-stone-800"
        >
          {attendanceStrategyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}：{option.description}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((slot) => (
          <article
            key={slot}
            className="rounded-2xl border border-[var(--border)] bg-white/80 p-4"
          >
            <p className="text-sm font-semibold text-stone-900">行动槽位 {slot}</p>
            <div className="mt-3 space-y-3">
              <select
                name={`action-${slot}`}
                defaultValue={slot === 1 ? "study" : slot === 2 ? "social" : "relax"}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-800"
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                name={`time-${slot}`}
                defaultValue={slot === 1 ? "day" : "night"}
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
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-3 text-sm leading-6 text-stone-600">
        夜间至少支持娱乐和复习；兼职不能安排在夜间。投简历、社交、补救都可以在任意时段尝试，
        最终是否合法与收益由规则层结算。
      </div>

      <button
        type="submit"
        className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
      >
        结算这个月
      </button>
    </form>
  );
}


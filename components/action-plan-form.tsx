import { submitActionTurnAction } from "@/app/actions";
import type { CourseAttendanceStrategy } from "@/types/game";

type ActionPlanFormProps = {
  runId: string;
  currentWeek: number;
  defaultAttendanceStrategy?: CourseAttendanceStrategy;
};

const attendanceOptions: Array<{
  value: CourseAttendanceStrategy;
  label: string;
  description: string;
}> = [
  { value: "serious", label: "认真上课", description: "课堂收益最高，也最稳妥。" },
  { value: "mixed", label: "正常混课", description: "稳步推进，保留一点灵活度。" },
  { value: "skip_sometimes", label: "偶尔翘课", description: "轻松一些，但会积累点名和平时分风险。" },
  { value: "skip_often", label: "经常翘课", description: "风险会滚得很快，只适合高压玩法。" },
  { value: "proxy", label: "代签 / 代到", description: "花钱买出勤，但后续补救成本更高。" },
  { value: "phone", label: "人在课堂刷手机", description: "不直接掉点名，但平时分和信息会慢慢流失。" },
];

const actionOptions = [
  { value: "study", label: "复习 / 学习" },
  { value: "job_prep", label: "实习 / 求职准备" },
  { value: "part_time", label: "兼职 / 赚钱" },
  { value: "social", label: "社交 / 关系" },
  { value: "relax", label: "娱乐 / 放松" },
  { value: "student_activity", label: "学生活动 / 讲座 / 社团" },
  { value: "remedy", label: "补救 / 应急处理" },
  { value: "ask_family", label: "向家里要钱" },
] as const;

const timeOptions = [
  { value: "day", label: "白天窗口" },
  { value: "night", label: "夜间窗口" },
] as const;

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
          每次只提交 1 个行动。结算后会立刻推进到下一周；只有第 4 周结束时才生成整月结算和月报。
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
          {attendanceOptions.map((option) => (
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
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="time"
            defaultValue="night"
            className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-800"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </article>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-3 text-sm leading-6 text-stone-600">
        周二、周四白天只有半天空档，周末白天完全空闲，其余工作日默认只有夜间窗口。
        兼职不能安排在夜间；翘课的代价不再直接扣学业值，而会通过点名、平时分、代签花费和补救压力体现。
      </div>

      <button
        type="submit"
        className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
      >
        结算这一周
      </button>
    </form>
  );
}

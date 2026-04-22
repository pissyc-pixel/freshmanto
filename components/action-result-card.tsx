import {
  formatActionType,
  formatAttendanceStrategy,
} from "@/lib/demo/options";
import type { ActionTurnSummary } from "@/types/game";

type ActionResultCardProps = {
  turn: ActionTurnSummary;
  eventLines?: string[];
  nextStepHint: string;
  title?: string;
};

const timeLabels = {
  day: "白天",
  night: "夜间",
} as const;

function formatSignedValue(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function buildOutcomeSentence(turn: ActionTurnSummary): string {
  const actionLabel = formatActionType(turn.resolvedAction.action);
  const attendanceLabel = formatAttendanceStrategy(turn.attendanceStrategy);

  if (!turn.resolvedAction.accepted) {
    return `这一步原本想做「${actionLabel}」，但最后没有做成。课程这边还是按「${attendanceLabel}」往前走，这一轮更像是临时停了一下。`;
  }

  if (!turn.advancesCalendar) {
    return `这次做的是「${actionLabel}」这种即时安排，状态已经立刻变化，但本周时间还没往前走，所以你还能继续安排正式行动。`;
  }

  return `这次把「${actionLabel}」正式落在了本周里，课程这边走的是「${attendanceLabel}」，这一轮已经结算进本月进度。`;
}

function buildTimeChangeLabel(turn: ActionTurnSummary): string {
  return turn.advancesCalendar ? "本周已推进" : "本周还没推进";
}

export function ActionResultCard({
  turn,
  eventLines = [],
  nextStepHint,
  title = "本次行动结果",
}: ActionResultCardProps) {
  const stats = [
    { label: "时间", value: buildTimeChangeLabel(turn), emphasis: false },
    { label: "金钱", value: formatSignedValue(turn.statsDelta.money), emphasis: true },
    { label: "心情", value: formatSignedValue(turn.statsDelta.mood), emphasis: true },
    { label: "压力", value: formatSignedValue(turn.statsDelta.stress), emphasis: true },
    { label: "学业", value: formatSignedValue(turn.statsDelta.semesterAcademics), emphasis: true },
  ];
  const statusBadge = turn.advancesCalendar ? "本周进度已结算" : "本周进度未结算";
  const eventBadge = eventLines.length > 0 ? `额外变化 ${eventLines.length}` : "额外变化 0";

  return (
    <article className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.98))] p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">{title}</span>
        <span className="rounded-full bg-stone-900/90 px-3 py-1 text-xs font-medium text-stone-50">
          {turn.slotLabel}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700">
          {timeLabels[turn.chosenAction.time]}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold text-stone-900">{formatActionType(turn.resolvedAction.action)}</h3>
        <p className="text-sm leading-6 text-stone-700">{buildOutcomeSentence(turn)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
        <span className="rounded-full bg-white px-3 py-1">{statusBadge}</span>
        <span className="rounded-full bg-white px-3 py-1">{eventBadge}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white/85 px-4 py-3">
            <p className="text-xs font-medium tracking-[0.16em] text-stone-500">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {item.label} {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-stone-700">
          <p className="font-semibold text-stone-900">这一轮之后还能做什么</p>
          <p className="mt-1">{nextStepHint}</p>
        </div>

        {eventLines.length > 0 ? (
          <div className="rounded-2xl bg-stone-100/85 px-4 py-3 text-sm leading-6 text-stone-700">
            <p className="font-semibold text-stone-900">额外变化</p>
            <ul className="mt-2 space-y-2">
              {eventLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl bg-stone-100/85 px-4 py-3 text-sm leading-6 text-stone-700">
            这一轮没有额外事件，主要就是状态和时间安排立刻发生了变化。
          </div>
        )}
      </div>
    </article>
  );
}

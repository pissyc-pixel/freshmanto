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

  if (!turn.resolvedAction.accepted) {
    return `这次原本想做“${actionLabel}”，但最后没做成，所以这一轮更像是临时停顿了一下。`;
  }

  if (!turn.advancesCalendar) {
    return `这次做的是“${actionLabel}”这种即时安排，状态已经立刻变化了，但周历还留在原地。`;
  }

  return `这次把行动落在“${actionLabel}”上，系统已经把这一轮正式结算进本月进度里。`;
}

export function ActionResultCard({
  turn,
  eventLines = [],
  nextStepHint,
  title = "本次行动结果",
}: ActionResultCardProps) {
  const stats = [
    { label: "金钱", value: turn.statsDelta.money },
    { label: "心情", value: turn.statsDelta.mood },
    { label: "压力", value: turn.statsDelta.stress },
    { label: "学业", value: turn.statsDelta.semesterAcademics },
  ];
  const statusBadge = turn.advancesCalendar ? "周历已推进" : "周历未推进";
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
        <p className="text-sm leading-6 text-stone-700">
          这一轮按“{formatAttendanceStrategy(turn.attendanceStrategy)}”走课。{buildOutcomeSentence(turn)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
        <span className="rounded-full bg-white px-3 py-1">{statusBadge}</span>
        <span className="rounded-full bg-white px-3 py-1">{eventBadge}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white/85 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {item.label} {formatSignedValue(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-6 text-stone-700">
          <p className="font-semibold text-stone-900">这一轮之后</p>
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
            这一轮没有额外事件，主要就是状态和节奏立刻发生了变化。
          </div>
        )}
      </div>
    </article>
  );
}

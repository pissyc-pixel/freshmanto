export type HistoryEntry = {
  monthLabel: string;
  title: string;
  summary: string;
  tone: "up" | "flat" | "down";
};

type HistoryTimelineProps = {
  entries: HistoryEntry[];
};

const toneStyles: Record<HistoryEntry["tone"], string> = {
  up: "bg-emerald-100 text-emerald-900",
  flat: "bg-stone-200 text-stone-800",
  down: "bg-rose-100 text-rose-900"
};

const toneLabels: Record<HistoryEntry["tone"], string> = {
  up: "状态回升",
  flat: "平稳推进",
  down: "压力上来了"
};

export function HistoryTimeline({ entries }: HistoryTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm text-stone-600">
        还没有足够的月份记录可以串成成长时间线。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <article
          key={`${entry.monthLabel}-${entry.title}`}
          className="rounded-2xl border border-[var(--border)] bg-white/75 p-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-amber-700">{entry.monthLabel}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneStyles[entry.tone]}`}>
              {toneLabels[entry.tone]}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-stone-900">{entry.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{entry.summary}</p>
        </article>
      ))}
    </div>
  );
}

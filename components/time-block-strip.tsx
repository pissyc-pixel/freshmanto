import type { TimeBlockKind } from "@/types/game";

export type TimeBlockView = {
  label: string;
  kind: TimeBlockKind;
  detail: string;
};

export type WeeklyTimeBlockView = {
  label: string;
  detail: string;
  isCurrent?: boolean;
  days: TimeBlockView[];
};

type TimeBlockStripProps = {
  blocks: WeeklyTimeBlockView[];
};

const kindStyles: Record<TimeBlockView["kind"], string> = {
  free: "bg-emerald-100 text-emerald-900",
  half_free: "bg-amber-100 text-amber-900",
  busy_day: "bg-stone-800 text-stone-50",
};

const kindLabels: Record<TimeBlockView["kind"], string> = {
  free: "全天空闲",
  half_free: "半天空档",
  busy_day: "白天忙碌",
};

export function TimeBlockStrip({ blocks }: TimeBlockStripProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {blocks.map((block) => (
        <article
          key={block.label}
          className={`rounded-2xl border bg-white/70 p-4 ${
            block.isCurrent
              ? "border-amber-400 shadow-[0_12px_32px_rgba(217,119,6,0.14)]"
              : "border-[var(--border)]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-stone-900">{block.label}</h3>
            {block.isCurrent ? (
              <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                当前周
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{block.detail}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {block.days.map((day) => (
              <div
                key={`${block.label}-${day.label}`}
                className="rounded-2xl border border-[var(--border)] bg-white/80 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-900">{day.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kindStyles[day.kind]}`}>
                    {kindLabels[day.kind]}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-600">{day.detail}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

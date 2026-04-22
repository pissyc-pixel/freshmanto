import type { TimeBlockKind } from "@/types/game";

export type TimeBlockView = {
  label: string;
  kind: TimeBlockKind;
  detail: string;
};

type TimeBlockStripProps = {
  blocks: TimeBlockView[];
};

const kindStyles: Record<TimeBlockView["kind"], string> = {
  free: "bg-emerald-100 text-emerald-900",
  half_free: "bg-amber-100 text-amber-900",
  busy_day: "bg-stone-800 text-stone-50"
};

const kindLabels: Record<TimeBlockView["kind"], string> = {
  free: "完全空闲",
  half_free: "半空闲",
  busy_day: "白天全忙"
};

export function TimeBlockStrip({ blocks }: TimeBlockStripProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {blocks.map((block) => (
        <article key={block.label} className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-stone-900">{block.label}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${kindStyles[block.kind]}`}>
              {kindLabels[block.kind]}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{block.detail}</p>
        </article>
      ))}
    </div>
  );
}


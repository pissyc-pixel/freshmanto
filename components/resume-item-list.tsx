import type { ResumeItem } from "@/types/game";

type ResumeItemListProps = {
  items: ResumeItem[];
};

export function ResumeItemList({ items }: ResumeItemListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-700">M{item.month}</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-900">{item.title}</h3>
            </div>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
              {item.category}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{item.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

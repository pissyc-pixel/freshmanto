import type { DemoActionOption } from "@/app/demo-content";

type ActionOptionListProps = {
  items: DemoActionOption[];
};

export function ActionOptionList({ items }: ActionOptionListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
              {item.type}
            </span>
          </div>
          <dl className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
            <div>
              <dt className="font-medium text-stone-800">时间成本</dt>
              <dd>{item.cost}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">潜在收益</dt>
              <dd>{item.payoff}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-800">注意点</dt>
              <dd>{item.risk}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

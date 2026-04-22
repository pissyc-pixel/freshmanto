type StatItem = {
  label: string;
  value: number;
  change?: number;
};

type StatsGridProps = {
  items: StatItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const tone =
          item.change === undefined ? "text-stone-500" : item.change >= 0 ? "text-emerald-700" : "text-rose-700";

        return (
          <article key={item.label} className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
            <p className="text-sm text-stone-500">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="text-3xl font-semibold text-stone-900">{item.value}</strong>
              {item.change !== undefined ? (
                <span className={`text-sm font-semibold ${tone}`}>{item.change >= 0 ? `+${item.change}` : item.change}</span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

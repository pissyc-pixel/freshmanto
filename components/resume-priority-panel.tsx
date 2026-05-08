type ResumePriorityItem = {
  label: string;
  value: string;
  hint: string;
};

type ResumePriorityPanelProps = {
  items: ResumePriorityItem[];
};

export function ResumePriorityPanel({ items }: ResumePriorityPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold text-stone-900">{item.value}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">{item.hint}</p>
        </article>
      ))}
    </div>
  );
}

type ActionOption = {
  value: string;
  label: string;
  description: string;
};

type ActionOptionListProps = {
  items: ActionOption[];
};

export function ActionOptionList({ items }: ActionOptionListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.value} className="rounded-2xl border border-[var(--border)] bg-white/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-stone-900">{item.label}</h3>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
              {item.value}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">{item.description}</p>
        </article>
      ))}
    </div>
  );
}


type FactListProps = {
  items: string[];
};

export function FactList({ items }: FactListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm text-stone-600">
        暂时还没有可展示的事实摘要。
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-[var(--border)] bg-white/65 px-4 py-3 text-sm leading-6 text-stone-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

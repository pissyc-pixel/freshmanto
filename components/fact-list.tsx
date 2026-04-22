type FactListProps = {
  items: string[];
};

export function FactList({ items }: FactListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="rounded-2xl border border-[var(--border)] bg-white/65 px-4 py-3 text-sm leading-6 text-stone-700">
          {item}
        </li>
      ))}
    </ul>
  );
}

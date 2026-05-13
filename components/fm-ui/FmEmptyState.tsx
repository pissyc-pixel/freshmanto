type FmEmptyStateProps = {
  title: string;
  body: string;
};

export function FmEmptyState({ title, body }: FmEmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/72 px-5 py-6 shadow-[0_14px_34px_rgba(17,55,58,0.06)]">
      <p className="text-base font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
    </div>
  );
}

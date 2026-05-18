type FmEmptyStateProps = {
  title: string;
  body: string;
};

export function FmEmptyState({ title, body }: FmEmptyStateProps) {
  return (
    <div className="fm-empty-state">
      <p className="text-base font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
    </div>
  );
}

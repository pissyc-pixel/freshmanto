type FmPartialNoticeProps = {
  title: string;
  body: string;
};

export function FmPartialNotice({ title, body }: FmPartialNoticeProps) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(223,244,240,0.92),rgba(255,255,255,0.95))] px-5 py-5 shadow-[0_14px_34px_rgba(17,55,58,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">partial</p>
      <p className="mt-2 text-base font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
    </div>
  );
}

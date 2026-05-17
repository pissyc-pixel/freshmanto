type FmComingSoonProps = {
  title: string;
  body: string;
};

export function FmComingSoon({ title, body }: FmComingSoonProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/80 px-5 py-6 shadow-[0_14px_34px_rgba(17,55,58,0.05)]">
      <p className="text-base font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm leading-7 text-stone-600">{body}</p>
    </div>
  );
}

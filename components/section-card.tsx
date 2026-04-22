import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  eyebrow,
  aside,
  children
}: SectionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[0_16px_45px_rgba(84,51,16,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{eyebrow}</p>
          ) : null}
          <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
          {description ? <p className="max-w-2xl text-sm leading-6 text-stone-600">{description}</p> : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

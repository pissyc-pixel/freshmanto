import { ReactNode } from "react";

type PlaceholderPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PlaceholderPanel({
  title,
  description,
  children
}: PlaceholderPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-amber-900/10 bg-[var(--surface-strong)] p-6 shadow-[0_16px_45px_rgba(84,51,16,0.06)]">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}


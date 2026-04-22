import { ReactNode } from "react";
import { NavBar } from "@/components/nav-bar";

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children
}: AppShellProps) {
  return (
    <main className="min-h-screen px-6 py-8 text-stone-900 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <NavBar />
        <section className="rounded-[2rem] border border-amber-900/10 bg-[var(--surface)] p-8 shadow-[0_24px_60px_rgba(84,51,16,0.08)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">{eyebrow}</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">{title}</h1>
              <p className="max-w-2xl text-base leading-7 text-stone-700">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}


type ReportPreviewProps = {
  title: string;
  contractLabel: string;
  promptInput: unknown;
  markdown: string;
};

export function ReportPreview({
  title,
  contractLabel,
  promptInput,
  markdown
}: ReportPreviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-2xl border border-[var(--border)] bg-stone-950 p-5 text-stone-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{contractLabel}</p>
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        <pre className="mt-4 overflow-x-auto text-xs leading-6 text-stone-200">
          {JSON.stringify(promptInput, null, 2)}
        </pre>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">AI 输出预览</p>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{markdown}</div>
      </article>
    </div>
  );
}


type ReportPreviewProps = {
  title: string;
  contractLabel: string;
  markdown: string;
  promptInput?: unknown;
  showPromptInput?: boolean;
};

export function ReportPreview({
  title,
  contractLabel,
  markdown,
  promptInput,
  showPromptInput = false,
}: ReportPreviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="rounded-2xl border border-[var(--border)] bg-stone-950 p-5 text-stone-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{contractLabel}</p>
        <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-stone-300">
          AI 只能读取规则层已经算出来的结构化事实来组织语言，不能新增关键事件，也不能参与任何规则判定。
        </p>
        {showPromptInput && promptInput !== undefined ? (
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-stone-900/80 p-4 text-xs leading-6 text-stone-200">
            {JSON.stringify(promptInput, null, 2)}
          </pre>
        ) : (
          <div className="mt-4 rounded-2xl bg-stone-900/80 p-4 text-sm leading-6 text-stone-200">
            这一侧默认隐藏后台结构化原文，避免把系统字段、事件标记和内部摘要直接塞给玩家。
          </div>
        )}
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">玩家可见正文</p>
        <h3 className="mt-2 text-lg font-semibold text-stone-900">{title}</h3>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{markdown}</div>
      </article>
    </div>
  );
}

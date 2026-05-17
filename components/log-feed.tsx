import { formatMonthLabel, formatSystemLogType } from "@/lib/demo/options";
import { sanitizePlayerFacingText, sanitizePlayerFacingTextList } from "@/lib/player-facing-text";

type LogItem = {
  id?: string;
  logType?: string;
  badge?: string;
  title?: string;
  message: string;
  details?: string[];
  periodLabel?: string;
  year?: number;
  month?: number;
};

type LogFeedProps = {
  items: LogItem[];
  variant?: "system" | "player";
  emptyMessage?: string;
};

export function LogFeed({
  items,
  variant = "system",
  emptyMessage = "这里暂时还没有可回看的记录。",
}: LogFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm text-stone-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const periodLabel =
          item.periodLabel ?? (item.year && item.month ? formatMonthLabel(item.year, item.month) : undefined);
        const badge =
          variant === "player"
            ? item.badge ?? "本月回顾"
            : formatSystemLogType(item.logType ?? "record");
        const articleClass =
          variant === "player"
            ? "rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,247,237,0.85),rgba(255,255,255,0.96))] px-4 py-4"
            : "rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-4";
        const badgeClass =
          variant === "player"
            ? "rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
            : "rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50";

        return (
          <article
            key={item.id ?? `${badge}-${periodLabel ?? "unknown"}-${index}`}
            className={articleClass}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className={badgeClass}>{badge}</span>
              {periodLabel ? <span className="text-sm font-medium text-amber-700">{periodLabel}</span> : null}
            </div>
            {item.title ? <h3 className="mt-3 text-base font-semibold text-stone-900">{item.title}</h3> : null}
            <p className="mt-3 text-sm leading-6 text-stone-700">{sanitizePlayerFacingText(item.message)}</p>
            {variant === "player" && item.details && item.details.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-semibold tracking-[0.12em] text-stone-500">这几件事我还记得</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-600">
                  {sanitizePlayerFacingTextList(item.details).map((detail) => (
                    <li key={detail} className="rounded-2xl bg-white/90 px-3 py-2">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {variant === "system" && item.details && item.details.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                {sanitizePlayerFacingTextList(item.details).map((detail) => (
                  <li key={detail} className="rounded-2xl bg-stone-100/80 px-3 py-2">
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

type LogItem = {
  id: string;
  logType: string;
  message: string;
  year: number;
  month: number;
};

type LogFeedProps = {
  items: LogItem[];
};

export function LogFeed({ items }: LogFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm text-stone-600">
        这局目前还没有写入日志。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
              {item.logType}
            </span>
            <span className="text-sm font-medium text-amber-700">
              Y{item.year} M{item.month}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">{item.message}</p>
        </article>
      ))}
    </div>
  );
}


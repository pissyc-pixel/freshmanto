type WeeklySettlementLine = {
  id: string;
  label: string;
  actionLabel: string;
  summary: string;
  statsDelta: {
    money: number;
    mood: number;
    stress: number;
    semesterAcademics: number;
    social: number;
    fulfillment: number;
  };
};

type WeeklySettlementCardProps = {
  title: string;
  subtitle: string;
  eventTitle?: string | null;
  eventSummary?: string | null;
  dayLines: WeeklySettlementLine[];
  totalLines: Array<{
    label: string;
    value: number;
  }>;
  budgetLines: string[];
  riskLines: string[];
};

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function WeeklySettlementCard(props: WeeklySettlementCardProps) {
  return (
    <article className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,247,237,0.94),rgba(255,255,255,0.98))] p-6 shadow-[0_20px_60px_rgba(84,51,16,0.12)]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">本周结算</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700">{props.subtitle}</span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-stone-900">{props.title}</h3>
      {props.eventTitle ? (
        <p className="mt-2 text-sm leading-6 text-amber-700">
          本周事件：{props.eventTitle}。{props.eventSummary}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {props.dayLines.map((line) => (
          <div key={line.id} className="rounded-2xl border border-[var(--border)] bg-white/90 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">{line.label}</p>
                <p className="mt-1 text-base font-medium text-amber-800">{line.actionLabel}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-700">
                <span className="rounded-full bg-stone-100 px-3 py-1">钱 {formatSignedValue(line.statsDelta.money)}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">心情 {formatSignedValue(line.statsDelta.mood)}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">压力 {formatSignedValue(line.statsDelta.stress)}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">学业 {formatSignedValue(line.statsDelta.semesterAcademics)}</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700">{line.summary}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white/85 p-4">
        <p className="text-sm font-semibold text-stone-900">本周总变化</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {props.totalLines.map((item) => (
            <div key={item.label} className="rounded-2xl bg-stone-50 px-4 py-3">
              <p className="text-xs font-medium tracking-[0.16em] text-stone-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-stone-900">{formatSignedValue(item.value)}</p>
            </div>
          ))}
        </div>
      {props.budgetLines.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/90 p-4 text-sm leading-6 text-stone-700">
          <p className="font-semibold text-stone-900">\u672c\u5468\u6536\u652f\u62c6\u89e3</p>
          <ul className="mt-2 space-y-2">
            {props.budgetLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      </div>

      {props.riskLines.length > 0 ? (
        <div className="mt-6 rounded-2xl bg-stone-100/90 p-4 text-sm leading-6 text-stone-700">
          <p className="font-semibold text-stone-900">本周新增风险 / 机会</p>
          <ul className="mt-2 space-y-2">
            {props.riskLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

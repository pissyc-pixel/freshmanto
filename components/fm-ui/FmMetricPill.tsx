type FmMetricPillState = "normal" | "warning" | "danger";

type FmMetricPillProps = {
  label: string;
  value: string;
  note?: string;
  state?: FmMetricPillState;
};

export function FmMetricPill({ label, value, note, state = "normal" }: FmMetricPillProps) {
  return (
    <div className={`fm-metric-pill fm-metric-pill--${state}`}>
      <div className="fm-metric-pill__label">{label}</div>
      <div className="fm-metric-pill__value">{value}</div>
      {note ? <div className="fm-metric-pill__note">{note}</div> : null}
    </div>
  );
}

import { FloatingActionButton, Icon, InlineStat, LabShell } from "@/app/ui-lab/_components";
import { journalEntries } from "@/app/ui-lab/mock-data";

const toneMap = {
  warm: "tone-rose",
  cool: "tone-cyan",
  peach: "tone-orange",
};

export default function UiLabJournalPage() {
  return (
    <LabShell
      active="journal"
      header="成长日志"
      subheader="记录你在这里的每一个瞬间"
      topRight={
        <div className="fm-journal-topright">
          <div className="fm-counter">
            <div className="fm-counter__label">学期倒计时</div>
            <div className="fm-counter__value">42 天</div>
          </div>
          <div className="fm-icon-square text-[var(--fm-brand-dark)]">
            <Icon name="calendar" className="h-8 w-8" />
          </div>
        </div>
      }
    >
      <section className="fm-timeline">
        {journalEntries.map((entry) => (
          <article className="fm-timeline-item" key={entry.title}>
            <div className={`fm-timeline-node ${toneMap[entry.tone as keyof typeof toneMap]}`}>
              <Icon name={entry.icon as never} className="h-4 w-4" />
            </div>
            <div className="fm-journal-card">
              <div className="fm-journal-card__month">{entry.month}</div>
              <div className="fm-journal-card__head">
                <div>
                  <h3>{entry.title}</h3>
                </div>
                <div className="fm-journal-card__status">
                  {entry.tone === "warm" ? (
                    <>
                      <InlineStat tone="rose" icon="spark" label="压力" value="中等" />
                      <InlineStat tone="amber" icon="bookmark" label="学业" value="优良" />
                    </>
                  ) : entry.tone === "cool" ? (
                    <>
                      <InlineStat tone="cyan" icon="smile" label="心情" value="平静" />
                      <InlineStat tone="blue" icon="map-pin" label="探索" value="25%" />
                    </>
                  ) : (
                    <InlineStat tone="rose" icon="spark" label="心情" value="兴奋" />
                  )}
                </div>
              </div>
              <p>{entry.body}</p>
            </div>
          </article>
        ))}
      </section>
      <FloatingActionButton icon="close" />
    </LabShell>
  );
}

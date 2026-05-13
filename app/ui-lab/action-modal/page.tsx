import { FloatingActionButton, Icon, LabShell, MetricStrip, WeekCard } from "@/app/ui-lab/_components";
import { actionOptions, plannerMetrics, plannerWeeks } from "@/app/ui-lab/mock-data";

export default function UiLabActionModalPage() {
  return (
    <LabShell
      active="planner"
      header={
        <div className="flex items-center gap-4">
          <Icon name="calendar" className="mt-1 h-10 w-10" />
          <span className="text-[2.7rem] font-bold text-[#20262b]">本周周历</span>
        </div>
      }
      subheader={
        <>
          默认时间窗口来自课程安排，
          <br />
          skip_class 会把你被课占住的白天即时释放。
        </>
      }
    >
      <div className="relative">
        <MetricStrip items={plannerMetrics} />
        <section className="fm-week-grid">
          {plannerWeeks.map((item) => (
            <WeekCard key={item.week} title={item.week} caption={item.caption} current={item.current} />
          ))}
        </section>

        <div className="fm-modal-overlay">
          <section className="fm-dialog">
            <header className="fm-dialog__header">
              <div>
                <h2>周四 · 半天空档</h2>
                <p>选择今天下午的安排</p>
              </div>
              <button type="button" className="fm-dialog__close">
                <Icon name="close" />
              </button>
            </header>

            <div className="fm-dialog__body">
              {actionOptions.map((option) => (
                <article
                  className={`fm-option-card ${option.selected ? "is-selected" : ""}`}
                  key={option.title}
                >
                  <div className={`fm-option-card__icon tone-${option.tone}`}>
                    <Icon name={option.icon as never} className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className={option.tone === "orange" ? "text-[#d76622]" : "text-[var(--fm-brand-dark)]"}>
                      {option.title}
                    </h3>
                    <p>{option.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <footer className="fm-dialog__footer">
              <button type="button" className="fm-outline-button">
                取消
              </button>
              <button type="button" className="fm-solid-button">
                确认选择
              </button>
            </footer>
          </section>
        </div>
      </div>
      <FloatingActionButton />
    </LabShell>
  );
}

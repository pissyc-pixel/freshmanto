import { Icon, LabShell, MetricStrip, WeekCard } from "@/app/ui-lab/_components";
import { plannerMetrics, plannerWeeks } from "@/app/ui-lab/mock-data";

export default function UiLabPlannerPage() {
  return (
    <LabShell
      active="planner"
      header={
        <div className="flex items-center gap-4">
          <Icon name="calendar" className="mt-1 h-10 w-10" />
          <span className="text-[2.7rem] font-bold text-[#20262b]">本月周历</span>
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
      <MetricStrip items={plannerMetrics} />
      <section className="fm-week-grid">
        {plannerWeeks.map((item) => (
          <WeekCard key={item.week} title={item.week} caption={item.caption} current={item.current} />
        ))}
      </section>
    </LabShell>
  );
}

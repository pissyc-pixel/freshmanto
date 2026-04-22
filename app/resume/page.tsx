import { demoMonthlyHistory, demoResumeItems } from "@/app/demo-content";
import { AppShell } from "@/components/app-shell";
import { HistoryTimeline } from "@/components/history-timeline";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";

export default function ResumePage() {
  return (
    <AppShell
      eyebrow="履历查看区"
      title="轻量履历与成长轨迹"
      description="履历页面只关心结构化条目展示，不决定条目增删；后续可以直接接规则层产出的履历结果。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="履历条目" description="后续只需传入 `ResumeItem[]`，页面就能按类别和月份展示。">
          <ResumeItemList items={demoResumeItems} />
        </SectionCard>
        <SectionCard title="阶段轨迹" description="用于回看每个关键月份的节奏变化，也适合作为结局页摘要来源之一。">
          <HistoryTimeline entries={demoMonthlyHistory} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

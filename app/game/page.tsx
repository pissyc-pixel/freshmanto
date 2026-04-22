import { demoActionOptions, demoStatsAfter, demoStatsBefore, demoTimeBlocks } from "@/app/demo-content";
import { AppShell } from "@/components/app-shell";
import { ActionOptionList } from "@/components/action-option-list";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { TimeBlockStrip } from "@/components/time-block-strip";

export default function GamePage() {
  const stats = [
    { label: "金钱", value: demoStatsAfter.money, change: demoStatsAfter.money - demoStatsBefore.money },
    { label: "心情", value: demoStatsAfter.mood, change: demoStatsAfter.mood - demoStatsBefore.mood },
    { label: "压力", value: demoStatsAfter.stress, change: demoStatsAfter.stress - demoStatsBefore.stress },
    {
      label: "成就感",
      value: demoStatsAfter.fulfillment,
      change: demoStatsAfter.fulfillment - demoStatsBefore.fulfillment
    },
    { label: "社交", value: demoStatsAfter.social, change: demoStatsAfter.social - demoStatsBefore.social },
    {
      label: "学期学业",
      value: demoStatsAfter.semesterAcademics,
      change: demoStatsAfter.semesterAcademics - demoStatsBefore.semesterAcademics
    }
  ];

  return (
    <AppShell
      eyebrow="主游戏页"
      title="月度循环从这里展开"
      description="主游戏页负责承接规则层给出的当前状态、可用时间块与行动候选。这里先用 demo 数据搭起后续接线形状。"
    >
      <div className="space-y-6">
        <SectionCard
          title="当前状态"
          description="展示层只关心数值本身与变化量，不关心这些数值是如何被规则层计算出来的。"
        >
          <StatsGrid items={stats} />
        </SectionCard>

        <SectionCard
          title="本月时间块"
          description="规则层后续只需要提供 `TimeBlockKind` 和文案说明，页面即可按块渲染。"
        >
          <TimeBlockStrip blocks={demoTimeBlocks} />
        </SectionCard>

        <SectionCard
          title="行动入口"
          description="每个行动卡片只显示结构化的成本、收益和风险提示，最终结算仍交给规则层。"
        >
          <ActionOptionList items={demoActionOptions} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

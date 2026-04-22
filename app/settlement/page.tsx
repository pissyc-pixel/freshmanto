import { demoJournalMarkdown, demoMonthlySummary } from "@/app/demo-content";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";

export default function SettlementPage() {
  const statChanges = [
    {
      label: "金钱结余",
      value: demoMonthlySummary.statsAfter.money,
      change: demoMonthlySummary.statsAfter.money - demoMonthlySummary.statsBefore.money
    },
    {
      label: "心情",
      value: demoMonthlySummary.statsAfter.mood,
      change: demoMonthlySummary.statsAfter.mood - demoMonthlySummary.statsBefore.mood
    },
    {
      label: "压力",
      value: demoMonthlySummary.statsAfter.stress,
      change: demoMonthlySummary.statsAfter.stress - demoMonthlySummary.statsBefore.stress
    },
    {
      label: "学期学业",
      value: demoMonthlySummary.statsAfter.semesterAcademics,
      change: demoMonthlySummary.statsAfter.semesterAcademics - demoMonthlySummary.statsBefore.semesterAcademics
    }
  ];

  return (
    <AppShell
      eyebrow="月结算页"
      title="月末事实先结算，再交给 AI 书写"
      description="这里展示的是规则层结算后的结构化摘要，AI 层只能消费这些事实并生成可读文本。"
    >
      <div className="space-y-6">
        <SectionCard title="属性变化" description="这部分适合作为月结算总览，也可直接映射为后续存档记录。">
          <StatsGrid items={statChanges} />
        </SectionCard>

        <SectionCard
          title="本月事实摘要"
          description="这些字段由规则层给出，页面只负责展示，AI prompt 也只能读取这些内容。"
        >
          <FactList items={demoMonthlySummary.notableFacts} />
        </SectionCard>

        <SectionCard
          title="AI 月记调用预览"
          description="左侧是传给 prompt 的结构化输入，右侧是最小 mock/fallback 输出，便于联调。"
        >
          <ReportPreview
            title="monthly-journal"
            contractLabel="structured summary only"
            promptInput={{
              runId: "demo-run-ui",
              year: 1,
              month: demoMonthlySummary.month,
              summary: demoMonthlySummary
            }}
            markdown={demoJournalMarkdown}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}

import { demoJournalMarkdown, demoMonthlySummary } from "@/app/demo-content";
import { AppShell } from "@/components/app-shell";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";

export default function JournalPage() {
  return (
    <AppShell
      eyebrow="月记查看区"
      title="月记归档与原始摘要对照"
      description="月记页适合查看 AI 最终文本，同时保留生成时消费的结构化摘要，方便检查是否越界。"
    >
      <SectionCard
        title="月记详情"
        description="展示层支持直接查看 prompt 输入与输出，后续也能很自然地接入数据库中的归档记录。"
      >
        <ReportPreview
          title={`Year 1 Month ${demoMonthlySummary.month}`}
          contractLabel="no rules in prompt"
          promptInput={demoMonthlySummary}
          markdown={demoJournalMarkdown}
        />
      </SectionCard>
    </AppShell>
  );
}

import { demoEndingMarkdown, demoEndingSummary } from "@/app/demo-content";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";

export default function EndingPage() {
  return (
    <AppShell
      eyebrow="结局页"
      title="先判定结局，再生成毕业报告"
      description="结局标签、长期均分和履历亮点来自规则层；AI 只把这些事实整理成可阅读的总结。"
    >
      <div className="space-y-6">
        <SectionCard title="规则层结局摘要" description="这里展示的是 AI 生成前的原始依据。">
          <FactList items={demoEndingSummary.notableFacts} />
        </SectionCard>

        <SectionCard title="履历亮点" description="结局报告可引用这些结构化亮点，但不允许捏造未出现的经历。">
          <ResumeItemList items={demoEndingSummary.resumeHighlights} />
        </SectionCard>

        <SectionCard title="AI 结局报告预览" description="prompt 输入只包含结构化摘要，报告文本由最小封装生成。">
          <ReportPreview
            title="ending-report"
            contractLabel="facts only"
            promptInput={{
              runId: "demo-run-ui",
              summary: demoEndingSummary
            }}
            markdown={demoEndingMarkdown}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}

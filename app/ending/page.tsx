import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";
import {
  formatGraduationOutcome,
  formatMonthLabel
} from "@/lib/demo/options";
import { getServerEndingPreview } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type EndingPageProps = {
  searchParams: DemoPageSearchParams;
};

export default async function EndingPage({ searchParams }: EndingPageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerEndingPreview(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="结局"
        title="还没有可以查看的结局。"
        description="结局页会展示规则层输出的结局标签，以及毕业后保存的 AI 结局报告。"
      >
        <SectionCard title="暂无结局" description="先创建 run 并推进月份。">
          <p className="text-sm leading-6 text-stone-600">在四年完整结束前，这里只会显示当前的规则层预估。</p>
        </SectionCard>
      </AppShell>
    );
  }

  const predictedOutcome = formatGraduationOutcome(bundle.endingSummary.outcome);
  const savedReport = bundle.savedEndingReport;

  return (
    <AppShell
      eyebrow="结局"
      title={bundle.run.status === "completed" ? "正式结局报告" : "当前结局预览"}
      description="规则层先决定结局标签与事实摘要；只有在毕业结算落地后，AI 才会把这些事实转写成结局报告。"
    >
      <div className="space-y-6">
        <SectionCard
          title="规则层结局摘要"
          description={`当前判定：${predictedOutcome}。长期学业均值 ${bundle.endingSummary.longTermAcademicAverage}。`}
        >
          <FactList
            items={[
              `当前学年位置：${formatMonthLabel(Math.min(bundle.run.currentYear, 4), Math.min(bundle.run.currentMonth, 12))}`,
              ...bundle.endingSummary.notableFacts
            ]}
          />
        </SectionCard>

        <SectionCard title="履历亮点" description="结局报告只能引用这些已经存在的结构化履历。">
          <ResumeItemList items={bundle.endingSummary.resumeHighlights} />
        </SectionCard>

        <SectionCard
          title={savedReport ? "已保存的 AI 结局报告" : "结局报告尚未落地"}
          description={
            savedReport
              ? "这份报告来自已保存的 ending_report 记录。"
              : "当前 run 还未走完四年，所以这里只展示规则层预估，不提前生成正式结局文案。"
          }
        >
          {savedReport ? (
            <ReportPreview
              title="ending-report"
              contractLabel={savedReport.model ?? "fallback"}
              promptInput={savedReport.input_summary_json}
              markdown={savedReport.output_markdown}
            />
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              当第 4 学年第 12 月完成结算后，系统会自动生成并保存正式结局报告。
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}


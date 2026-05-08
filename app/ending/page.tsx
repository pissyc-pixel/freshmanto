import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";
import {
  formatEndingNotableFact,
  formatGraduationOutcome,
  formatMonthLabel,
} from "@/lib/demo/options";
import { getServerEndingPreview } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type EndingPageProps = {
  searchParams: DemoPageSearchParams;
};

function formatPathLabel(path?: string) {
  switch (path) {
    case "employment":
      return "就业";
    case "recommendation":
      return "推免 / 保研";
    case "postgraduate_exam":
      return "考研";
    case "public_exam":
      return "考公";
    default:
      return "仍未定型";
  }
}

function formatPathResultLabel(result?: string) {
  switch (result) {
    case "success":
      return "走势比较稳";
    case "ordinary":
      return "已经成形，但还不算特别稳";
    case "failure":
      return "有明显风险";
    case "pivot":
      return "后面大概率还会转向";
    default:
      return "还在继续变化";
  }
}

export default async function EndingPage({ searchParams }: EndingPageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerEndingPreview(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="结局"
        title="还没有可查看的结局"
        description="结局页会展示目前已经能确定的走向，以及毕业后保存下来的 AI 回望。"
      >
        <SectionCard title="暂无结局" description="先创建 run 并继续推进月份。">
          <p className="text-sm leading-6 text-stone-600">
            在四年完整结束前，这里只会显示当前规则层已经能看出来的结局预估。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const predictedOutcome = formatGraduationOutcome(bundle.endingSummary.outcome);
  const savedReport = bundle.savedEndingReport;
  const endingFacts = bundle.endingSummary.notableFacts.map(formatEndingNotableFact);
  const pathLabel = formatPathLabel(bundle.endingSummary.graduationPath);
  const pathResultLabel = formatPathResultLabel(bundle.endingSummary.pathResult);

  return (
    <AppShell
      eyebrow="结局"
      title={bundle.run.status === "completed" ? "正式结局回望" : "当前结局预览"}
      description="这里先展示目前已经能确定的结局线索；等毕业结算真正落地后，AI 才会把这些事实整理成完整回望。"
    >
      <div className="space-y-6">
        <SectionCard
          title="当前已经能确定的结局线索"
          description={`眼下更像会走到：${predictedOutcome}。长期学业均值大约是 ${bundle.endingSummary.longTermAcademicAverage}。`}
        >
          <FactList
            items={[
              `当前学年位置：${formatMonthLabel(Math.min(bundle.run.currentYear, 4), Math.min(bundle.run.currentMonth, 12))}`,
              `后期主路径：${pathLabel}`,
              `这条路径现在的状态：${pathResultLabel}`,
              ...endingFacts,
            ]}
          />
        </SectionCard>

        <SectionCard
          title="后期路径画像"
          description="这一块只把当前已经能看出来的主方向翻出来，不提前替玩家把人生盖棺定论。"
        >
          <FactList
            items={[
              bundle.endingSummary.recommendationQualification
                ? `推免资格状态：${bundle.endingSummary.recommendationQualification}`
                : "推免资格还没有形成明确结论。",
              typeof bundle.endingSummary.publicExamProgress === "number"
                ? `公考进度：${bundle.endingSummary.publicExamProgress}`
                : "公考线目前还没有形成稳定进度。",
              bundle.endingSummary.dominantDirection
                ? `长期主导倾向：${bundle.endingSummary.dominantDirection}`
                : "长期倾向还没有完全定型。",
            ]}
          />
        </SectionCard>

        <SectionCard title="履历亮点" description="结局回望只能引用已经存在的结构化履历。">
          <ResumeItemList items={bundle.endingSummary.resumeHighlights} />
        </SectionCard>

        <SectionCard
          title={savedReport ? "已保存的结局回望" : "结局回望尚未落地"}
          description={
            savedReport
              ? "这份回望来自已经保存的 ending_report 记录。"
              : "当前 run 还没走完四年，所以这里只展示规则层预估，不会提前生成正式结局文案。"
          }
        >
          {savedReport ? (
            <ReportPreview
              title="毕业回望"
              contractLabel={savedReport.model ?? "fallback"}
              markdown={savedReport.output_markdown}
            />
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              等到第 4 学年 第 12 月完成结算后，系统才会自动生成并保存正式结局回望。
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

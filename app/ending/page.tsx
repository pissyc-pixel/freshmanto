import { ActiveRunSync } from "@/components/active-run-sync";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";
import { deriveAcademicProfile } from "@/core/resolvers/progression";
import {
  formatEndingNotableFact,
  formatGraduationOutcome,
  formatMonthLabel,
} from "@/lib/demo/options";
import { resolveActiveRunId } from "@/lib/demo/active-run";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerEndingPreview } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type EndingPageProps = {
  searchParams: DemoPageSearchParams;
};

function formatDirectionLabel(direction?: string) {
  switch (direction) {
    case "employment":
      return "就业";
    case "recommendation":
      return "推免 / 保研";
    case "postgraduate":
      return "考研";
    case "public_exam":
      return "公考";
    default:
      return "仍未定型";
  }
}

function formatRecommendationQualificationLabel(status?: string) {
  switch (status) {
    case "pending":
      return "还在积累阶段";
    case "eligible":
      return "已具备推免竞争力";
    case "borderline":
      return "已经摸到推免边缘";
    case "unlikely":
      return "离推免线还有距离";
    case "accepted":
      return "推免已经落定";
    case "declined_to_postgraduate":
      return "放下推免，转向考研";
    case "declined_to_employment":
      return "放下推免，转向就业";
    default:
      return "还没有明确结论";
  }
}

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
      return "成功落地";
    case "ordinary":
      return "普通完成";
    case "failure":
      return "结果不太理想";
    case "pivot":
      return "中途转向";
    default:
      return "还在继续变化";
  }
}

function formatEndingPosition(input: {
  status: "active" | "completed";
  currentYear: number;
  currentMonth: number;
  finalYear: number;
}) {
  if (input.status === "completed") {
    return formatMonthLabel(input.finalYear, 12);
  }

  return formatMonthLabel(Math.min(input.currentYear, 4), Math.min(input.currentMonth, 12));
}

export default async function EndingPage({ searchParams }: EndingPageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const bundle = runId ? await getServerEndingPreview(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        runId={runId}
        eyebrow="结局"
        title="还没有可查看的结局"
        description="结局页会展示目前已经能确定的走向，以及毕业后保存下来的 AI 回望。"
      >
        <SectionCard title="暂无结局" description="先创建存档并继续推进月份。">
          <p className="text-sm leading-6 text-stone-600">
            在四年完整结束前，这里只会显示当前规则层已经能看出来的结局预估。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const predictedOutcome = formatGraduationOutcome(bundle.endingSummary.outcome);
  const savedReport = bundle.savedEndingReport;
  const academicProfile = deriveAcademicProfile(bundle.run);
  const endingFacts = bundle.endingSummary.notableFacts.map(formatEndingNotableFact);
  const pathLabel = formatPathLabel(bundle.endingSummary.graduationPath);
  const pathResultLabel = formatPathResultLabel(bundle.endingSummary.pathResult);
  const positionLabel = formatEndingPosition({
    status: bundle.run.status,
    currentYear: bundle.run.currentYear,
    currentMonth: bundle.run.currentMonth,
    finalYear: bundle.endingSummary.finalYear,
  });
  const completed = bundle.run.status === "completed";
  const reviewFacts = [
    academicProfile.gpa !== null
      ? `最终已结算 GPA：${academicProfile.gpa.toFixed(2)}`
      : "最终 GPA：暂无已结算成绩",
    `长期学业均值：${bundle.endingSummary.longTermAcademicAverage}`,
    `毕业时手头余额：${bundle.run.stats.money} 元`,
    `毕业时心情 / 压力：${bundle.run.stats.mood} / ${bundle.run.stats.stress}`,
    `累积履历条目：${bundle.run.resume.length} 条`,
    `长期主导倾向：${formatDirectionLabel(bundle.endingSummary.dominantDirection)}`,
  ];

  return (
    <AppShell
      runId={runId}
      eyebrow="结局"
      title={completed ? "正式结局回望" : "当前结局预览"}
      description={
        completed
          ? "四年已经走完，这里只回顾规则层已经真实落地的毕业结果、去向与关键轨迹。"
          : "这里先展示目前已经能确定的结局线索；等毕业结算真正落地后，AI 才会把这些事实整理成完整回望。"
      }
    >
      <div className="space-y-6">
        <ActiveRunSync runId={bundle.run.id} />
        <SectionCard
          title={completed ? "毕业结果" : "当前已经能确定的结局线索"}
          description={
            completed
              ? `这局最后落在"${predictedOutcome}"，主去向更像是"${pathLabel}"，结果层属于"${pathResultLabel}"。`
              : `眼下更像会走到：${predictedOutcome}。长期学业均值大约是 ${bundle.endingSummary.longTermAcademicAverage}。`
          }
        >
          <FactList
            items={[
              `当前学年位置：${positionLabel}`,
              `主去向：${pathLabel}`,
              `结果层：${pathResultLabel}`,
              ...endingFacts,
            ]}
          />
        </SectionCard>

        <SectionCard
          title={completed ? "四年轨迹回看" : "后期路径画像"}
          description={
            completed
              ? "这里只回看已经沉淀下来的学业、状态、履历和方向变化，不把没实现的系统写成发生过。"
              : "这一块只把当前已经能看出来的主方向翻出来，不提前替玩家把人生盖棺定论。"
          }
        >
          <FactList
            items={[
              ...reviewFacts,
              bundle.endingSummary.recommendationQualification
                ? `推免资格状态：${formatRecommendationQualificationLabel(bundle.endingSummary.recommendationQualification)}`
                : "推免资格还没有形成明确结论。",
              typeof bundle.endingSummary.publicExamProgress === "number"
                ? `公考准备进度：${bundle.endingSummary.publicExamProgress}`
                : "公考线目前还没有形成稳定进度。",
            ]}
          />
        </SectionCard>

        <SectionCard title="履历亮点" description="结局回望只能引用已经存在的结构化履历。">
          <ResumeItemList items={bundle.endingSummary.resumeHighlights} />
        </SectionCard>

        <SectionCard
          title={
            savedReport
              ? "已保存的结局回望"
              : bundle.run.status === "completed"
                ? "正式结局回望暂未存档"
                : "结局回望尚未落地"
          }
          description={
            savedReport
              ? "这份回望来自已经保存的 ending_report 记录。"
              : bundle.run.status === "completed"
                ? "正式结局已经落定，但这份回望暂时还没有保存成功，现在先看规则层的结果摘要。"
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
              {bundle.run.status === "completed"
                ? "当前先根据结构化结局摘要查看毕业结果；正式回望缺失时，不会把它误说成“还没毕业”。"
                : "等到第 4 学年 第 12 月完成结算后，系统才会自动生成并保存正式结局回望。"}
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

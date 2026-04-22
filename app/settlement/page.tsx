import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { formatActionType, formatMonthLabel, formatStatLabel } from "@/lib/demo/options";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats } from "@/types/game";

export const dynamic = "force-dynamic";

type SettlementPageProps = {
  searchParams: DemoPageSearchParams;
};

function buildDeltaItems(statsAfter: DynamicStats, statsDelta: DynamicStats) {
  return (Object.entries(statsAfter) as Array<[keyof DynamicStats, number]>).map(([key, value]) => ({
    label: formatStatLabel(key),
    value,
    change: statsDelta[key]
  }));
}

export default async function SettlementPage({ searchParams }: SettlementPageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const year = Number(readSearchParam(params.year) ?? 0);
  const month = Number(readSearchParam(params.month) ?? 0);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="月结算"
        title="还没有可以查看的月结算。"
        description="请先创建 run 并在主游戏页提交一次月度计划。"
      >
        <SectionCard title="需要一个真实 run" description="月结算页只展示数据库中已经保存的快照与 AI 报告。">
          <Link href="/" className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline">
            返回开局页
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  const monthlyState =
    bundle.monthlyStates.find((item) => item.year === year && item.month === month) ??
    bundle.monthlyStates.at(-1);
  const report =
    bundle.aiReports.find(
      (item) =>
        item.report_type === "monthly_journal" &&
        (year ? item.year === year : true) &&
        (month ? item.month === month : true)
    ) ??
    [...bundle.aiReports].reverse().find((item) => item.report_type === "monthly_journal");

  if (!monthlyState || !report) {
    return (
      <AppShell
        eyebrow="月结算"
        title="这局还没有月结算记录。"
        description="提交一次月度行动之后，这里会显示规则层快照和对应的 AI 月记。"
      >
        <SectionCard title="当前没有可展示数据" description="回到主游戏页完成一次月结算后再查看这里。">
          <Link
            href={`/game?runId=${runId}`}
            className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
          >
            返回主游戏页
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  const summary = monthlyState.snapshot_json;

  return (
    <AppShell
      eyebrow="月结算"
      title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结算`}
      description="规则层先给出结构化事实，再把同一份摘要交给 AI 写成月记。这里展示的所有内容都能回溯到数据库中的快照与报告。"
      actions={
        <>
          <Link
            href={`/journal?runId=${runId}`}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看月记归档
          </Link>
          <Link
            href={`/game?runId=${runId}`}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            继续下个月
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <SectionCard title="数值变化" description="这里显示本月结算后的真实状态和相对本月初的变化量。">
          <StatsGrid items={buildDeltaItems(summary.statsAfter, summary.statsDelta)} />
        </SectionCard>

        <SectionCard
          title="本月发生了什么"
          description="这些事实来自规则层快照，是 AI 月记唯一允许引用的依据。"
        >
          <FactList
            items={[
              `课程策略：${summary.attendanceStrategy}`,
              `选择行动：${summary.actions.map(formatActionType).join("、")}`,
              `学业状态：${summary.academicFeedback}`,
              ...summary.notableFacts
            ]}
          />
        </SectionCard>

        <SectionCard
          title="AI 月记"
          description="左侧是写给模型的结构化摘要，右侧是已经保存的最终输出。"
        >
          <ReportPreview
            title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 月记`}
            contractLabel="structured summary only"
            promptInput={{
              runId,
              year: monthlyState.year,
              month: monthlyState.month,
              summary
            }}
            markdown={report.output_markdown}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}


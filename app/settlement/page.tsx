import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { LogFeed } from "@/components/log-feed";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import {
  buildPlayerFacingMonthlyLog,
  formatActionType,
  formatAttendanceStrategy,
  formatMonthLabel,
  formatSemesterFeedback,
  formatStatLabel
} from "@/lib/demo/options";
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
        title="还没有可查看的月结算。"
        description="先创建一个 run，并在主游戏页提交一次月度计划，这里才会出现真实结算。"
      >
        <SectionCard title="需要一个真实 run" description="月结算页只展示已经写入数据库的月度快照和 AI 月记。">
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
        description="完成至少一次月结算后，这里会显示结构化快照、玩家回顾和对应的 AI 月记。"
      >
        <SectionCard title="当前没有可展示内容" description="先回到主游戏页推进一个月。">
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
  const playerLog = buildPlayerFacingMonthlyLog(summary, monthlyState.year, monthlyState.month);
  const systemLogs = bundle.logs
    .filter((item) => item.year === monthlyState.year && item.month === monthlyState.month)
    .map((item) => ({
      id: item.id,
      logType: item.log_type,
      message: item.message,
      year: item.year,
      month: item.month
    }));

  return (
    <AppShell
      eyebrow="月结算"
      title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结算`}
      description="同一个月会拆成两套视角：前台给玩家看“这个月我过得怎么样”，后台保留开发与系统留档。AI 月记只能引用规则层给出的结构化摘要。"
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
        <SectionCard title="结算总览" description="这里先告诉你这个月最后落成了什么状态，方便快速理解自己做了什么。">
          <StatsGrid items={buildDeltaItems(summary.statsAfter, summary.statsDelta)} />
        </SectionCard>

        <SectionCard
          title="前台日志：这个月发生了什么"
          description="这是面向玩家的月度回顾，只重述已结算的事实，不展示系统内部记录口吻。"
        >
          <LogFeed items={[playerLog]} variant="player" />
        </SectionCard>

        <SectionCard
          title="规则层事实清单"
          description="下面这些是 AI 可以引用的事实来源。它只能组织表达，不能改写判定。"
        >
          <FactList
            items={[
              `课程策略：${formatAttendanceStrategy(summary.attendanceStrategy)}`,
              `本月行动：${summary.actions.map(formatActionType).join("、") || "无"}`,
              `学业反馈：${formatSemesterFeedback(summary.academicFeedback)}`,
              ...summary.notableFacts
            ]}
          />
        </SectionCard>

        <SectionCard
          title="AI 月记"
          description="左侧是写给 AI 的结构化摘要，右侧是最后保存下来的玩家月记。"
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

        <SectionCard
          title="后台日志：系统留档"
          description="这部分保留开发和系统记录，方便追查结算过程，不直接替代玩家回顾。"
        >
          <LogFeed
            items={systemLogs}
            emptyMessage="这个月还没有额外的后台记录。"
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}

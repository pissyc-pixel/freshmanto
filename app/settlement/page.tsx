import Link from "next/link";
import { ActionResultCard } from "@/components/action-result-card";
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
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatSemesterFeedback,
  formatStatLabel,
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
    change: statsDelta[key],
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
        title="还没有可查看的月结算"
        description="先创建 run，并在主游戏页至少推进完整一个月，这里才会出现真实结算。"
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
        (month ? item.month === month : true),
    ) ??
    [...bundle.aiReports].reverse().find((item) => item.report_type === "monthly_journal");

  if (!monthlyState || !report) {
    return (
      <AppShell
        eyebrow="月结算"
        title="这一局还没有月结算记录"
        description="完成至少一次月结算之后，这里才会显示结构化快照、玩家回顾和 AI 月记。"
      >
        <SectionCard title="当前没有可展示内容" description="先回到主游戏页继续推进。">
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
  const lastTurn = summary.turns.at(-1);
  const systemLogs = bundle.logs
    .filter((item) => item.year === monthlyState.year && item.month === monthlyState.month)
    .map((item) => ({
      id: item.id,
      logType: item.log_type,
      message: item.message,
      year: item.year,
      month: item.month,
    }));
  const factItems = [
    `课程策略：${formatAttendanceStrategy(summary.attendanceStrategy)}`,
    `本月行动：${summary.actions.map(formatActionType).join("、") || "无"}`,
    `学业反馈：${formatSemesterFeedback(summary.academicFeedback)}`,
    ...summary.notableFacts.map(formatPlayerFacingFact),
    ...summary.flags.map(formatPlayerFacingFlag),
  ];
  const actionEventLines =
    summary.eventIds.length > 0
      ? [
          `这次收束之后，这个月还额外触发了 ${summary.eventIds.length} 个变化，它们已经并进下面的月度回顾里。`,
        ]
      : [];

  return (
    <AppShell
      eyebrow="月结算"
      title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结算`}
      description="同一个月拆成两套视角：前台日志给玩家看“这个月我过得怎么样”，后台日志保留开发与系统留档。AI 月记只能基于规则层已经算好的结构化事实。"
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
        <SectionCard title="结算总览" description="先看这个月最后落在了什么状态上。">
          <StatsGrid items={buildDeltaItems(summary.statsAfter, summary.statsDelta)} />
        </SectionCard>

        {lastTurn ? (
          <SectionCard
            title="最近一次行动"
            description="先看把这个月真正收束起来的最后一轮行动，它改了什么、接下来又能做什么。"
          >
            <ActionResultCard
              turn={lastTurn}
              eventLines={actionEventLines}
              nextStepHint="这轮已经把本月推进成结算了。接下来可以先读月记，也可以直接进入下个月。"
            />
          </SectionCard>
        ) : null}

        <SectionCard
          title="前台日志：这个月发生了什么"
          description="这一列只给玩家看，尽量说人话，不直接复读系统字段。"
        >
          <LogFeed items={[playerLog]} variant="player" />
        </SectionCard>

        <SectionCard
          title="规则层事实清单"
          description="下面这些是 AI 可以引用的真实事实来源，但当前页面只展示已经翻译过的玩家可读版本。"
        >
          <FactList items={factItems} />
        </SectionCard>

        <SectionCard
          title="AI 月记"
          description="这里展示的是最终保存下来的月记正文。结构化原始摘要默认不向玩家直接暴露。"
        >
          <ReportPreview
            title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 月记`}
            contractLabel={report.model ?? "fallback"}
            markdown={report.output_markdown}
          />
        </SectionCard>

        <SectionCard
          title="后台日志：系统留档"
          description="这里保留开发和系统记录，方便追踪结算过程，但不直接替代玩家回顾。"
        >
          <LogFeed items={systemLogs} emptyMessage="这个月还没有额外的后台记录。" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

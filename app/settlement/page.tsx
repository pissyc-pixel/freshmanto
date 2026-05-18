import Link from "next/link";

import { ActiveRunSync } from "@/components/active-run-sync";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { LogFeed } from "@/components/log-feed";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import {
  buildPublicExamExplanationFromSummary,
  buildRecommendationExplanationFromSummary,
  buildScholarshipExplanationFromSummary,
} from "@/core/resolvers/progression";
import { buildRunHref, resolveActiveRunId } from "@/lib/demo/active-run";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import { formatMonthLabel, formatStatLabel } from "@/lib/demo/options";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
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
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const year = Number(readSearchParam(params.year) ?? 0);
  const month = Number(readSearchParam(params.month) ?? 0);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        runId={runId}
        eyebrow="月结算"
        title="这里会展示月底结算"
        description="月底结算会把状态总览、成长日志、AI 月记和系统留档分开展示。"
      >
        <SectionCard title="还没有可查询的存档" description="先回到首页创建一局，再从主游戏推进到月底。">
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

  if (!monthlyState) {
    return (
      <AppShell
        runId={runId}
        eyebrow="月结算"
        title="这局还没有月结算记录"
        description="完成至少一次月底结算之后，这里才会出现结构化快照、成长日志和 AI 月记。"
      >
        <SectionCard title="当前没有可展示内容" description="先回到主游戏页继续推进。">
          <Link
            href={buildRunHref("/game", runId)}
            className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline"
          >
            返回主游戏页
          </Link>
        </SectionCard>
      </AppShell>
    );
  }

  const report = bundle.aiReports.find(
    (item) =>
      item.report_type === "monthly_journal" &&
      item.year === monthlyState.year &&
      item.month === monthlyState.month,
  );
  const summary = monthlyState.snapshot_json;
  if (!summary || typeof summary !== "object") {
    return (
      <AppShell
        runId={runId}
        eyebrow="月结算"
        title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结算`}
        description="这条月度记录的快照数据不完整，无法生成完整结算页。"
        actions={
          <Link
            href={buildRunHref(bundle.run.status === "completed" ? "/ending" : "/game", runId)}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            {bundle.run.status === "completed" ? "查看正式结局" : "继续下个月"}
          </Link>
        }
      >
        <ActiveRunSync runId={bundle.run.id} />
        <p className="text-stone-500">快照数据缺失，无法显示本月结算详情。</p>
      </AppShell>
    );
  }
  const growthLog = buildGrowthJournalEntry(summary, monthlyState.year, monthlyState.month);
  const digest = buildMonthlyDiaryDigest(summary, monthlyState.year, monthlyState.month);
  const scholarshipExplanation = buildScholarshipExplanationFromSummary(summary);
  const recommendationExplanation = buildRecommendationExplanationFromSummary(summary);
  const publicExamExplanation = buildPublicExamExplanationFromSummary(summary);
  const systemLogs = bundle.logs
    .filter((item) => item.year === monthlyState.year && item.month === monthlyState.month)
    .map((item) => ({
      id: item.id,
      logType: item.log_type,
      message: item.message,
      year: item.year,
      month: item.month,
    }));

  return (
    <AppShell
      runId={runId}
      eyebrow="月结算"
      title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结算`}
      description="成长日志偏事实层，月记偏体验层；这页会把两者拆开，也顺手解释这个月正在把你推向哪里。"
      actions={
        <>
          <Link
            href={buildRunHref("/journal", runId)}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看月记归档
          </Link>
          <Link
            href={buildRunHref(bundle.run.status === "completed" ? "/ending" : "/game", runId)}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            {bundle.run.status === "completed" ? "查看正式结局" : "继续下个月"}
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <ActiveRunSync runId={bundle.run.id} />
        <SectionCard title="结算总览" description="先看这个月最后落在了什么状态上。">
          <StatsGrid items={buildDeltaItems(summary.statsAfter, summary.statsDelta)} />
        </SectionCard>

        <SectionCard
          title="这个月正在把你推向哪里"
          description="这不是最后定案，只是把本月最明显的方向趋势和现实含义先说清楚。"
        >
          <FactList
            items={[
              digest.directionSignal,
              ...digest.futureSignals,
              recommendationExplanation.summary,
              publicExamExplanation.summary,
            ]}
          />
        </SectionCard>

        <SectionCard
          title="成长日志"
          description="成长日志偏事实整理：这个月主要做了什么，最明显的变化和关键经历是什么。"
        >
          <LogFeed items={[growthLog]} variant="player" />
        </SectionCard>

        <SectionCard
          title="结果为什么会这样"
          description="奖学金、推免和公考线都不再是黑箱掉落，这里只挑当前最关键的解释给你看。"
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4 text-sm leading-6 text-stone-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">奖学金</p>
              {scholarshipExplanation ? (
                <div className="mt-3 space-y-2">
                  <p className="font-semibold text-stone-900">{scholarshipExplanation.title}</p>
                  <p>{scholarshipExplanation.summary}</p>
                  {scholarshipExplanation.reasons.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="mt-3">目前还没有奖学金结果，通常要再等学年结算把前期积累落下来。</p>
              )}
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4 text-sm leading-6 text-stone-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">推免资格</p>
              <div className="mt-3 space-y-2">
                <p>{recommendationExplanation.summary}</p>
                {recommendationExplanation.strengths.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {recommendationExplanation.gaps.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4 text-sm leading-6 text-stone-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">公考进度</p>
              <div className="mt-3 space-y-2">
                <p>{publicExamExplanation.summary}</p>
                {publicExamExplanation.signals.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </article>
          </div>
        </SectionCard>

        <SectionCard
          title="给月记的结构化摘要"
          description="AI 月记只负责表达，不负责规则判定；这里展示的是喂给它的月度摘要骨架。"
        >
          <FactList
            items={[
              `主线行动：${digest.mainActions.join("、") || "本月主要在调整节奏"}`,
              `课程态度：${digest.attendanceStrategy}`,
              `方向趋势：${digest.directionSignal}`,
              `情绪线：${digest.emotionalArc}`,
              `学业线：${digest.academicArc}`,
              `钱和生活：${digest.moneyArc}`,
              ...digest.futureSignals,
              ...digest.keyMoments,
            ]}
          />
        </SectionCard>

        <SectionCard title="AI 月记" description="月记偏体验层，更像“我这个月到底是怎么过来的”。">
          {report ? (
            <ReportPreview
              title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 月记`}
              contractLabel={report.model ?? "fallback"}
              markdown={report.output_markdown}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm leading-6 text-stone-600">
              正在生成 AI 月记 / 月度总结。如果你刚结束月底结算，稍等一下再刷新这里。
            </div>
          )}
        </SectionCard>

        <SectionCard title="后台日志" description="这里保留系统层面的动作、事件和结算留档，方便追踪本月结算过程。">
          <LogFeed items={systemLogs} emptyMessage="这个月还没有额外的后台日志留档。" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

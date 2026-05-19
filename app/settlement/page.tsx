import Link from "next/link";

import { ActiveRunSync } from "@/components/active-run-sync";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { buildMonthlyJournalRulesFallback } from "@/lib/ai/reports";
import { normalizeMonthlyDiaryBody } from "@/lib/action-narratives";
import { buildRunHref, resolveActiveRunId } from "@/lib/demo/active-run";
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
        title="这里会收下刚过去的一个月"
        description="先回到开局页开始这一段大学生活。"
      >
        <SectionCard title="还没有可回看的月份">
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
        title="这局还没有月末记录"
        description="先把一个月过完，再回来看看。"
      >
        <SectionCard title="现在还没有可展示的内容">
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

  const summary = monthlyState.snapshot_json;

  if (!summary || typeof summary !== "object") {
    return (
      <AppShell
        runId={runId}
        eyebrow="月结算"
        title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结束`}
        description=""
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
        <SectionCard title="这个月的记录还不完整">
          <p className="text-sm leading-6 text-stone-600">这页暂时还没法完整展开，先继续往前走吧。</p>
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

  const fallbackDiary = buildMonthlyJournalRulesFallback({
    kind: "monthly_journal",
    runId: bundle.run.id,
    year: monthlyState.year,
    month: monthlyState.month,
    summary,
  });
  const diaryBody = normalizeMonthlyDiaryBody(report?.output_markdown ?? fallbackDiary.diary);

  return (
    <AppShell
      runId={runId}
      eyebrow="月结算"
      title={`${formatMonthLabel(monthlyState.year, monthlyState.month)} 已结束`}
      description=""
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

        <SectionCard title="这个月结束时">
          <StatsGrid items={buildDeltaItems(summary.statsAfter, summary.statsDelta)} />
        </SectionCard>

        <SectionCard title="这个月的月记">
          <article className="rounded-2xl border border-[var(--border)] bg-white/80 px-5 py-5 text-sm leading-8 text-stone-700">
            {diaryBody.split("\n\n").map((paragraph, index) => (
              <p key={`${monthlyState.id}-paragraph-${index}`} className={index === 0 ? "" : "mt-4"}>
                {paragraph}
              </p>
            ))}
          </article>
        </SectionCard>
      </div>
    </AppShell>
  );
}

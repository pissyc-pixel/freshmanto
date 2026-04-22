import Link from "next/link";
import { createMonthlySchedule } from "@/core/game-engine";
import { AppShell } from "@/components/app-shell";
import { ActionPlanForm } from "@/components/action-plan-form";
import { LogFeed } from "@/components/log-feed";
import { ProfileSummary } from "@/components/profile-summary";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { TimeBlockStrip } from "@/components/time-block-strip";
import { getServerDemoBundle } from "@/lib/demo/server";
import {
  formatMonthLabel,
  formatStatLabel,
  formatTimeBlockKind
} from "@/lib/demo/options";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats } from "@/types/game";

export const dynamic = "force-dynamic";

type GamePageProps = {
  searchParams: DemoPageSearchParams;
};

function buildStatItems(stats: DynamicStats) {
  return (Object.entries(stats) as Array<[keyof DynamicStats, number]>).map(([key, value]) => ({
    label: formatStatLabel(key),
    value
  }));
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="主游戏页"
        title="先创建一局新游戏。"
        description="主游戏页需要一个真实 runId 才能展示随机开局、当前状态和月度行动表单。"
        actions={
          <Link
            href="/"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            回到开局页
          </Link>
        }
      >
        <SectionCard title="还没有活动中的 run" description="从开局页点击“开新档”后，这里会自动展示真实随机开局结果。">
          <p className="text-sm leading-6 text-stone-600">
            为了让日志、状态快照和 AI 报告都能写入数据库，这个页面不会再使用静态 demo 数据。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const schedule = createMonthlySchedule(bundle.run.currentMonth).map((day) => ({
    label: `Day ${day.day}`,
    kind: day.dayType,
    detail:
      day.dayType === "busy_day"
        ? "白天被课程或义务占满，夜间仍能做轻量行为。"
        : `${formatTimeBlockKind(day.dayType)}，可安排白天和夜间行动。`
  }));
  const latestLogs = bundle.logs.slice(-5).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month
  }));

  return (
    <AppShell
      eyebrow="主游戏页"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的行动决策`}
      description="这里展示真实开局、当前状态、月度时间分布和行动入口。页面只负责收集选择，结算与持久化都在服务层完成。"
      actions={
        <>
          <Link
            href={`/settlement?runId=${bundle.run.id}`}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看最近月结算
          </Link>
          <Link
            href={`/resume?runId=${bundle.run.id}`}
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看履历
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <SectionCard
          title="随机开局"
          description="这些都是新建 run 时落下来的真实开局属性，会随整局保存到数据库。"
        >
          <ProfileSummary profile={bundle.run.profile} />
        </SectionCard>

        <SectionCard title="当前状态" description="每次月结算后，这里的状态会来自最新持久化 run 快照。">
          <StatsGrid items={buildStatItems(bundle.run.stats)} />
        </SectionCard>

        <SectionCard
          title="本月时间结构"
          description="每月固定 30 天：8 天完全空闲、8 天半空闲、14 天白天全忙。夜间永远保留至少娱乐和复习的空间。"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="提交月度计划"
          description="先选课程策略，再给本月安排 3 个行动槽位。规则层会负责处理合法性、收益、事件与学业风险。"
        >
          <ActionPlanForm runId={bundle.run.id} />
        </SectionCard>

        <SectionCard
          title="最近日志"
          description="这里显示已经写入数据库的最近几条关键日志，方便对照这局到底发生了什么。"
        >
          <LogFeed items={latestLogs} />
        </SectionCard>
      </div>
    </AppShell>
  );
}


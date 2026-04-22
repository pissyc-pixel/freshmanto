import Link from "next/link";
import { createWeeklyCalendar } from "@/core/game-engine";
import { AppShell } from "@/components/app-shell";
import { ActionPlanForm } from "@/components/action-plan-form";
import { LogFeed } from "@/components/log-feed";
import { ProfileSummary } from "@/components/profile-summary";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { TimeBlockStrip } from "@/components/time-block-strip";
import { getServerDemoBundle } from "@/lib/demo/server";
import {
  buildPlayerFacingMonthlyLog,
  formatMonthLabel,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatPlayerFacingTurn,
  formatStatLabel,
  formatTimeBlockKind,
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
    value,
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
        title="先创建一局新的校园人生"
        description="主游戏页需要真实的 runId，才能展示当前状态、周历和行动入口。"
        actions={
          <Link
            href="/"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            返回开局页
          </Link>
        }
      >
        <SectionCard
          title="还没有进行中的 run"
          description="从开局页创建新档之后，这里会展示当前 run 的实时快照。"
        >
          <p className="text-sm leading-6 text-stone-600">
            页面只负责展示和收集输入，核心结算仍然由规则层和整合层完成。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const activeMonth = bundle.run.activeMonth;
  const weeklyCalendar = activeMonth?.weeklyCalendar ?? createWeeklyCalendar(bundle.run.currentMonth);
  const currentWeek = activeMonth?.currentWeek ?? 1;
  const lastTurn = activeMonth?.lastResolvedTurn;
  const latestMonthlyState = bundle.monthlyStates.at(-1);
  const latestPlayerLog = latestMonthlyState
    ? buildPlayerFacingMonthlyLog(latestMonthlyState.snapshot_json, latestMonthlyState.year, latestMonthlyState.month)
    : null;

  const schedule = weeklyCalendar.map((week) => ({
    label: `第 ${week.week} 周`,
    isCurrent: week.week === currentWeek,
    detail: "周二、周四有半天空档；周六、周日是完整空闲日；其他工作日白天默认被课程或义务占满。",
    days: week.days.map((day) => ({
      label: day.label,
      kind: day.dayType,
      detail: formatTimeBlockKind(day.dayType),
    })),
  }));

  const latestSystemLogs = bundle.logs.slice(-5).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month,
  }));

  const lastTurnDetails = lastTurn
    ? [
        ...lastTurn.notableFacts.map(formatPlayerFacingFact),
        ...lastTurn.flags.map(formatPlayerFacingFlag),
      ]
    : [];

  return (
    <AppShell
      eyebrow="主游戏页"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周度推进`}
      description="现在改成了按次行动、即时结算。每次提交 1 个动作后，系统会立刻更新状态；完成 4 个推进周之后才会生成整月快照和 AI 月记。"
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
            查看履历与日志
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <SectionCard title="随机开局" description="这些固定属性会跟着整局游戏保留下去。">
          <ProfileSummary profile={bundle.run.profile} />
        </SectionCard>

        <SectionCard title="当前状态" description="每次行动结算后，这里的数值都会立即刷新。">
          <StatsGrid items={buildStatItems(bundle.run.stats)} />
        </SectionCard>

        <SectionCard
          title="本月周历"
          description="1 个月固定为 4 周。你可以边看周历边决定这一轮该怎么过。"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="上一轮反馈"
          description="这一块会直接告诉你刚才那一步到底发生了什么。"
        >
          {lastTurn ? (
            <div className="space-y-3 text-sm leading-6 text-stone-700">
              <p>{formatPlayerFacingTurn(lastTurn)}</p>
              {lastTurnDetails.length > 0 ? (
                <ul className="space-y-2">
                  {lastTurnDetails.map((detail) => (
                    <li key={detail} className="rounded-2xl bg-stone-100/80 px-3 py-2">
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              这个月还没有结算过任何行动。先做第 1 周的决定，系统会立刻给出反馈。
            </p>
          )}
        </SectionCard>

        {latestPlayerLog ? (
          <SectionCard
            title="最近一次月度回顾"
            description="这是上一份已经落库的前台日志，方便你回头看上个月是怎么过来的。"
          >
            <LogFeed items={[latestPlayerLog]} variant="player" />
          </SectionCard>
        ) : null}

        <SectionCard
          title="提交本轮行动"
          description="每次只做 1 个决定。普通行动会推进到下一周；即时消费动作会立刻生效，但不推进周历。"
        >
          <ActionPlanForm
            runId={bundle.run.id}
            currentWeek={Math.min(currentWeek, 4)}
            defaultAttendanceStrategy={lastTurn?.attendanceStrategy ?? "mixed"}
          />
        </SectionCard>

        <SectionCard
          title="后台日志"
          description="这一列保留系统留档，方便核对当前 run 的推进过程。"
        >
          <LogFeed items={latestSystemLogs} emptyMessage="目前还没有系统日志留档。" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

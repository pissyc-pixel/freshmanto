import Link from "next/link";
import { createWeeklyCalendar } from "@/core/game-engine";
import { ActionResultCard } from "@/components/action-result-card";
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
  formatAttendanceStrategy,
  formatMonthLabel,
  formatReleasedClassDayList,
  formatStatLabel,
} from "@/lib/demo/options";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats } from "@/types/game";
import {
  buildCurrentActionFeedback,
  buildWeeklyScheduleBlocks,
  resolveCurrentWeekState,
} from "@/app/game/view-model";

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
        description="主游戏页需要真实的 runId，才能展示当前周内剩余时间、行动入口和最近结算。"
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
            页面层只负责展示状态与收集输入，时间池、课程风险和月结算仍然都在规则层里处理。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const activeMonth = bundle.run.activeMonth;
  const weeklyCalendar = activeMonth?.weeklyCalendar ?? createWeeklyCalendar(bundle.run.currentMonth);
  const currentWeek = activeMonth?.currentWeek ?? 1;
  const currentWeekState = resolveCurrentWeekState(weeklyCalendar, activeMonth);
  const lastTurn = activeMonth?.lastResolvedTurn;
  const latestMonthlyState = bundle.monthlyStates.at(-1);
  const latestPlayerLog = latestMonthlyState
    ? buildPlayerFacingMonthlyLog(latestMonthlyState.snapshot_json, latestMonthlyState.year, latestMonthlyState.month)
    : null;
  const schedule = buildWeeklyScheduleBlocks({
    weeklyCalendar,
    currentWeek,
    currentWeekState,
  });
  const latestSystemLogs = bundle.logs.slice(-5).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month,
  }));
  const latestActionFeedback = lastTurn
    ? buildCurrentActionFeedback({
        turn: lastTurn,
        currentWeekState,
      })
    : null;

  return (
    <AppShell
      eyebrow="主游戏页"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周内行动`}
      description="现在是一周一个时间池。你可以在同一周连续做多个动作，直到时间耗尽，或者主动提前结束本周。"
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
        <SectionCard title="随机开局" description="这些固定属性会贯穿整局游戏。">
          <ProfileSummary profile={bundle.run.profile} />
        </SectionCard>

        <SectionCard title="当前状态" description="每做完一个动作就即时刷新。">
          <StatsGrid items={buildStatItems(bundle.run.stats)} />
        </SectionCard>

        <SectionCard
          title="本周时间池"
          description={`第 ${currentWeek} 周还剩 ${currentWeekState.remainingTimeUnits} / ${currentWeekState.totalTimeUnits} 个半天，可继续决策。`}
        >
          <div className="space-y-3 text-sm leading-6 text-stone-700">
            <p>
              当前周课程策略：
              <strong>{formatAttendanceStrategy(lastTurn?.attendanceStrategy ?? currentWeekState.attendanceStrategy)}</strong>
            </p>
            <p>
              已释放的课程白天：
              {currentWeekState.releasedClassDays.length > 0
                ? ` ${formatReleasedClassDayList(currentWeekState.releasedClassDays)}`
                : " 暂无"}
            </p>
            <p>
              {currentWeekState.remainingTimeUnits > 0
                ? "这一周还可以继续安排行动，也可以直接结束本周。"
                : "本周时间已经耗尽，系统会自动推进到下一周。"}
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="本月周历"
          description="默认时间窗口来自课程安排，skip_class 会把仍被课占住的白天即时释放。"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="上一轮反馈"
          description="这里直接显示最近一次动作的即时结果，以及你接下来还能怎么安排这一周。"
        >
          {lastTurn && latestActionFeedback ? (
            <ActionResultCard
              turn={lastTurn}
              eventLines={latestActionFeedback.eventLines}
              nextStepHint={latestActionFeedback.nextStepHint}
            />
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              这个月还没有结算过任何动作。先做一个决定，系统会立刻更新剩余时间和当前状态。
            </p>
          )}
        </SectionCard>

        {latestPlayerLog ? (
          <SectionCard
            title="最近一次月度回顾"
            description="这是上一份已经落库的前台日志，方便回头看上个月是怎么过来的。"
          >
            <LogFeed items={[latestPlayerLog]} variant="player" />
          </SectionCard>
        ) : null}

        <SectionCard
          title="提交本轮行动"
          description="每次只推进一个动作；如果这周不想继续安排，也可以直接提前结束本周。"
        >
          <ActionPlanForm
            runId={bundle.run.id}
            currentWeek={Math.min(currentWeek, 4)}
            remainingTimeUnits={currentWeekState.remainingTimeUnits}
            totalTimeUnits={currentWeekState.totalTimeUnits}
            releasedClassDays={currentWeekState.releasedClassDays}
            defaultAttendanceStrategy={lastTurn?.attendanceStrategy ?? currentWeekState.attendanceStrategy}
          />
        </SectionCard>

        <SectionCard
          title="后台日志"
          description="这里保留系统留档，方便核对当前 run 的推进过程。"
        >
          <LogFeed items={latestSystemLogs} emptyMessage="目前还没有系统日志留档。" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { startNewRunAction } from "@/app/actions";
import {
  buildPlannerDaysView,
  buildPlannerFeedbackLines,
  buildPlannerStatusText,
  buildWeeklyScheduleBlocks,
  buildWeeklySettlementView,
  resolveCurrentWeekState,
} from "@/app/game/view-model";
import { ActionPlanForm } from "@/components/action-plan-form";
import { AppShell } from "@/components/app-shell";
import { LogFeed } from "@/components/log-feed";
import { ProfileSummary } from "@/components/profile-summary";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { TimeBlockStrip } from "@/components/time-block-strip";
import { WeeklySettlementCard } from "@/components/weekly-settlement-card";
import { createWeeklyCalendar } from "@/core/game-engine";
import { ensureProgressionState, summarizeDirectionSignals } from "@/core/resolvers/progression";
import {
  formatMonthLabel,
  formatStatLabel,
} from "@/lib/demo/options";
import { buildGrowthJournalEntry } from "@/lib/demo/monthly-digest";
import { getServerDemoBundle } from "@/lib/demo/server";
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
        eyebrow="主游戏"
        title="先开一局新的大学生活"
        description="这里会承载每周课程态度、逐日安排、统一周结算，以及月底的成长日志和月记。"
        actions={
          <Link
            href="/"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            返回开局页
          </Link>
        }
      >
        <SectionCard title="还没有进行中的 run" description="先回到首页创建一局，再从这里继续排每一周。">
          <p className="text-sm leading-6 text-stone-600">
            这次改版后的主流程已经换成“先定课程态度，再逐日排周历，最后统一结算”。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const hydratedRun = ensureProgressionState(bundle.run);
  const activeMonth = hydratedRun.activeMonth;
  const weeklyCalendar = activeMonth?.weeklyCalendar ?? createWeeklyCalendar(hydratedRun.currentMonth);
  const currentWeek = activeMonth?.currentWeek ?? 1;
  const currentWeekState = resolveCurrentWeekState(weeklyCalendar, activeMonth);
  const schedule = buildWeeklyScheduleBlocks({
    weeklyCalendar,
    currentWeek,
    currentWeekState,
  });
  const plannerDays = buildPlannerDaysView(currentWeekState, hydratedRun);
  const plannerStatusText = buildPlannerStatusText(currentWeekState);
  const plannerLines = buildPlannerFeedbackLines(currentWeekState);
  const weeklySettlement = buildWeeklySettlementView(activeMonth?.latestWeekSettlement);
  const latestMonthlyState = bundle.monthlyStates.at(-1);
  const latestGrowthLog = latestMonthlyState
    ? buildGrowthJournalEntry(latestMonthlyState.snapshot_json, latestMonthlyState.year, latestMonthlyState.month)
    : null;
  const latestSystemLogs = bundle.logs.slice(-6).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month,
  }));
  const directionSignals = summarizeDirectionSignals(hydratedRun);

  return (
    <AppShell
      eyebrow="主游戏"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周历安排`}
      description="这一轮周历会先让你定课程态度，再逐天给这一周的每天排一个行动；等 7 天都排完，点一次“确认本周安排”，系统再统一结算。"
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
            履历与成长日志
          </Link>
          <form action={startNewRunAction}>
            <button
              type="submit"
              className="rounded-full border border-red-900/15 bg-red-50/80 px-5 py-3 font-semibold text-red-900 transition hover:bg-red-100"
            >
              重新开局
            </button>
          </form>
        </>
      }
    >
      <div className="space-y-6">
        <SectionCard title="开局底子" description="这些基础属性会贯穿整局游戏。">
          <ProfileSummary profile={hydratedRun.profile} />
        </SectionCard>

        <SectionCard title="当前状态" description="每次周结算后，状态都会在这里更新。">
          <StatsGrid items={buildStatItems(hydratedRun.stats)} />
        </SectionCard>

        <SectionCard title="后半程方向" description="这轮先把大学后半程的人生导向接进来，让方向在过程中慢慢形成。">
          <div className="space-y-2 text-sm leading-6 text-stone-700">
            <p>
              当前主导倾向：
              <span className="font-semibold text-stone-900"> {hydratedRun.progression?.dominantDirection ?? "undecided"}</span>
              。公考进度 {hydratedRun.progression?.publicExam.progress ?? 0}，就业准备 {hydratedRun.progression?.employmentReadiness ?? 0}，深造准备 {hydratedRun.progression?.postgraduateProgress ?? 0}。
            </p>
            {directionSignals.length > 0 ? directionSignals.map((line) => <p key={line}>{line}</p>) : <p>目前方向感还比较分散，更多是在积累底子。</p>}
          </div>
        </SectionCard>

        {weeklySettlement ? (
          <SectionCard title="上一周结算" description="这一周已经统一结算完，可以先看看逐日反馈和总变化。">
            <WeeklySettlementCard {...weeklySettlement} />
          </SectionCard>
        ) : null}

        <SectionCard
          title="本月周历"
          description="保留原来的周历承载，但玩家主视角不再直接面对半天槽计数，而是看每天能不能排、排了什么。"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="安排这一周"
          description="先定本周课程态度，再点击每一天。周一 / 三 / 五默认白天被课程占用；如果这天决定翘课，会释放白天，但会吃学业和压力代价。"
        >
          <ActionPlanForm
            runId={bundle.run.id}
            currentWeek={Math.min(currentWeek, 4)}
            attendanceLocked={Boolean(currentWeekState.attendanceLocked)}
            defaultAttendanceStrategy={currentWeekState.attendanceStrategy}
            plannerStatusText={plannerStatusText}
            plannerLines={plannerLines}
            readyToConfirm={Boolean(currentWeekState.readyToConfirm)}
            plannerFeedback={currentWeekState.plannerFeedback}
            days={plannerDays}
          />
        </SectionCard>

        {latestGrowthLog ? (
          <SectionCard
            title="最近一条成长日志"
            description="成长日志偏事实层，帮你回看上个月到底发生了什么，不直接照搬后台流水。"
          >
            <LogFeed items={[latestGrowthLog]} variant="player" />
          </SectionCard>
        ) : null}

        <SectionCard
          title="后台日志"
          description="这里保留系统层面的动作、事件和结算留档，方便排查当前 run 的推进过程。"
        >
          <LogFeed items={latestSystemLogs} emptyMessage="目前还没有系统日志留档。" />
        </SectionCard>
      </div>
    </AppShell>
  );
}

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
import { ScrollIntoView } from "@/components/scroll-into-view";
import { SectionCard } from "@/components/section-card";
import { StatsGrid } from "@/components/stats-grid";
import { TimeBlockStrip } from "@/components/time-block-strip";
import { WeeklySettlementCard } from "@/components/weekly-settlement-card";
import { createWeeklyCalendar } from "@/core/game-engine";
import {
  buildDirectionPerception,
  buildPublicExamExplanation,
  ensureProgressionState,
  summarizeDirectionSignals,
} from "@/core/resolvers/progression";
import { formatMonthLabel, formatStatLabel } from "@/lib/demo/options";
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

function formatDirectionStage(stage: "undecided" | "forming" | "clear") {
  switch (stage) {
    case "clear":
      return "方向已经更清楚了";
    case "forming":
      return "方向正在成形";
    default:
      return "还在慢慢定下来";
  }
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const focusParam = readSearchParam(params.focus);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="主游戏"
        title="先开一局新的大学生活"
        description="这里会承载每周课程态度、逐日排周历、统一周结算，以及月底的成长日志和月记。"
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
            现在的主流程已经换成“先定课程态度，再逐天安排一周，最后统一结算”。
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
  const directionPerception = buildDirectionPerception(hydratedRun);
  const publicExamExplanation = buildPublicExamExplanation(hydratedRun);

  return (
    <AppShell
      eyebrow="主游戏"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周历安排`}
      description="这一轮周历会先让你定课程态度，再逐天给这一周的每一天排一个行动；等 7 天都排完，点一次“确认本周安排”，系统再统一结算。"
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

        <SectionCard
          title="后半程方向"
          description="这里不会提前剧透最终结局，只会把你最近正在成形的方向和它为什么会这样慢慢提示出来。"
          aside={
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {formatDirectionStage(directionPerception.stage)}
            </span>
          }
        >
          <div className="space-y-4 text-sm leading-6 text-stone-700">
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">近期趋势</p>
              <p className="mt-3 text-lg font-semibold text-stone-900">
                你最近最像在往“{directionPerception.primary.label}”这条路靠
                {directionPerception.secondary ? `，同时也还带着一点 ${directionPerception.secondary.label} 的可能。` : "。"}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{directionPerception.summary}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">为什么会往这边偏</p>
                <div className="mt-3 space-y-2">
                  {directionPerception.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                  {directionSignals.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">现在最值得留意的线索</p>
                <div className="mt-3 space-y-2">
                  <p>{publicExamExplanation.summary}</p>
                  {directionPerception.blockers.length > 0 ? (
                    directionPerception.blockers.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>这条路已经有趋势了，但还没到完全定案的时候，后面的周安排还会继续改变它。</p>
                  )}
                </div>
              </article>
            </div>
          </div>
        </SectionCard>

                {weeklySettlement ? (
          <>
            <ScrollIntoView targetId="weekly-settlement" active={focusParam === "weekly-settlement"} />
            <div id="weekly-settlement">
              <SectionCard title="\u4e0a\u5468\u7ed3\u7b97" description="\u8fd9\u4e00\u5468\u5df2\u7ecf\u7edf\u4e00\u7ed3\u7b97\u5b8c\uff0c\u53ef\u4ee5\u76f4\u63a5\u770b\u9010\u65e5\u53cd\u9988\u548c\u672c\u5468\u603b\u53d8\u5316\u3002">
                <WeeklySettlementCard {...weeklySettlement} />
              </SectionCard>
            </div>
          </>
        ) : null}

        <SectionCard
          title="\u672c\u6708\u6982\u89c8"
          description="\u8fd9\u91cc\u5148\u770b\u8fd9\u4e2a\u6708 4 \u5468\u7684\u6574\u4f53\u8282\u594f\u548c\u5f53\u524d\u5468\u4f4d\u7f6e\uff1b\u771f\u6b63\u7684\u9010\u5929\u70b9\u9009\u5165\u53e3\u653e\u5728\u4e0b\u4e00\u5757\u3002"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="\u5b89\u6392\u8fd9\u4e00\u5468"
          description="\u8fd9\u91cc\u624d\u662f\u672c\u5468\u7684\u5b9e\u9645\u64cd\u4f5c\u5165\u53e3\u3002\u5148\u5b9a\u8bfe\u7a0b\u6001\u5ea6\uff0c\u518d\u9010\u5929\u70b9\u9009\uff1b\u5468\u4e00 / \u4e09 / \u4e94\u9ed8\u8ba4\u767d\u5929\u6ee1\u8bfe\uff0c\u7fd8\u8bfe\u624d\u4f1a\u91ca\u653e\u767d\u5929\u3002"
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

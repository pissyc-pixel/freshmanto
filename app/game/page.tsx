import Link from "next/link";

import {
  buildPlannerDaysView,
  buildPlannerFeedbackLines,
  buildPlannerStatusText,
  buildWeeklyScheduleBlocks,
  buildWeeklySettlementView,
  resolveCurrentWeekState,
} from "@/app/game/view-model";
import { ActiveRunSync } from "@/components/active-run-sync";
import { ActionPlanForm } from "@/components/action-plan-form";
import { LogFeed } from "@/components/log-feed";
import { ScrollIntoView } from "@/components/scroll-into-view";
import { WeeklySettlementCard } from "@/components/weekly-settlement-card";
import {
  FmInlineStat,
  FmMetricStrip,
  FmPanel,
  FmSectionHead,
  FmShellLayout,
} from "@/components/fm-ui/FmScaffold";
import { createWeeklyCalendar } from "@/core/game-engine";
import { isVacationMonth } from "@/core/resolvers/schedule";
import {
  buildDirectionPerception,
  buildPublicExamExplanation,
  ensureProgressionState,
  summarizeDirectionSignals,
} from "@/core/resolvers/progression";
import { buildRunHref, resolveActiveRunId } from "@/lib/demo/active-run";
import { buildGrowthJournalEntry } from "@/lib/demo/monthly-digest";
import { formatMonthLabel } from "@/lib/demo/options";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerGameBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats, TimeBlockKind } from "@/types/game";

export const dynamic = "force-dynamic";

type GamePageProps = {
  searchParams: DemoPageSearchParams;
};

function clampProgress(value: number, max = 100) {
  return Math.max(0, Math.min(value / max, 1));
}

function buildMetricItems(stats: DynamicStats) {
  return [
    {
      label: "金钱",
      value: `${stats.money}`,
      tone: stats.money < 300 ? "amber" : "teal",
      icon: "chart" as const,
      progress: clampProgress(stats.money, 2400),
    },
    {
      label: "心情",
      value: `${stats.mood}`,
      tone: "mint",
      icon: "moon" as const,
      progress: clampProgress(stats.mood),
    },
    {
      label: "压力",
      value: `${stats.stress}`,
      tone: stats.stress >= 70 ? "rose" : "blue",
      icon: "alert" as const,
      progress: clampProgress(stats.stress),
    },
    {
      label: "学业",
      value: `${stats.semesterAcademics}`,
      tone: "cyan",
      icon: "book" as const,
      progress: clampProgress(stats.semesterAcademics),
    },
    {
      label: "社交",
      value: `${stats.social}`,
      tone: "amber",
      icon: "calendar" as const,
      progress: clampProgress(stats.social),
    },
  ];
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

function toneForDay(kind: TimeBlockKind) {
  switch (kind) {
    case "free":
      return "mint";
    case "half_free":
      return "blue";
    default:
      return "amber";
  }
}

function labelForDayKind(kind: TimeBlockKind, released?: boolean) {
  if (released) {
    return "已释放";
  }

  switch (kind) {
    case "free":
      return "全天";
    case "half_free":
      return "半天";
    default:
      return "排课";
  }
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const focusParam = readSearchParam(params.focus);
  const bundle = runId ? await getServerGameBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmShellLayout
        active="game"
        runId={runId}
        title="本周周历"
        subtitle="先创建一局真实存档，再从这里进入逐天排周历和统一周结算。"
        headerMeta={<FmInlineStat tone="teal" icon="calendar" label="当前进度" value="未开局" />}
      >
        <FmPanel>
          <FmSectionHead
            title="还没有进行中的存档"
            copy="当前主流程已经换成“先定课程态度，再逐天安排一周，最后统一结算”。"
          />
          <div className="mt-6">
            <Link href="/" className="fm-button-secondary">
              返回开局页
            </Link>
          </div>
        </FmPanel>
      </FmShellLayout>
    );
  }

  const hydratedRun = ensureProgressionState(bundle.run);
  const activeMonth = hydratedRun.activeMonth;
  const weeklyCalendar = activeMonth?.weeklyCalendar ?? createWeeklyCalendar(hydratedRun.currentMonth);
  const currentWeek = activeMonth?.currentWeek ?? 1;
  const currentWeekState = resolveCurrentWeekState(weeklyCalendar, activeMonth);
  const vacationMonth = isVacationMonth(bundle.run.currentMonth);
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
    <FmShellLayout
      active="game"
      runId={runId}
      title={vacationMonth ? "假期安排" : "本周周历"}
      subtitle={
        vacationMonth
          ? `${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 处在假期阶段，这个月不再按普通上课周锁白天，主要安排休息、兼职、实践和后续准备。`
          : `${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周排程与统一周结算都在这里完成。`
      }
      sidebarSummary="这里只承接当前存档的真实周流程，不靠前端内存猜状态。"
      headerMeta={
        <>
          <FmInlineStat tone="teal" icon="calendar" label="当前月份" value={formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} />
          <FmInlineStat tone="cyan" icon="book" label="当前周次" value={`第 ${Math.min(currentWeek, 4)} 周`} />
          <FmInlineStat
            tone="amber"
            icon="alert"
            label="待排天数"
            value={`${plannerDays.filter((day) => !day.plannedActionLabel).length} 天`}
          />
        </>
      }
    >
      <div className="fm-stack" data-testid="game-page">
        <ActiveRunSync runId={bundle.run.id} />
        <FmMetricStrip items={buildMetricItems(hydratedRun.stats)} />

        <div className="fm-grid-2">
          <div className="fm-stack">
            <FmPanel>
              <FmSectionHead
                title={vacationMonth ? "安排这个假期周" : "安排这一周"}
                copy={
                  vacationMonth
                    ? "假期周不再按普通课表锁白天，但依然按周逐天安排，再统一确认这一周。"
                    : "先确定这周课程态度，再逐天安排行动。没点到的日期会在确认本周时自动补成默认安排。"
                }
              />
              <div className="mt-6">
                <ActionPlanForm
                  runId={bundle.run.id}
                  currentWeek={Math.min(currentWeek, 4)}
                  currentMood={hydratedRun.stats.mood}
                  currentStress={hydratedRun.stats.stress}
                  attendanceLocked={Boolean(currentWeekState.attendanceLocked)}
                  defaultAttendanceStrategy={currentWeekState.attendanceStrategy}
                  plannerStatusText={plannerStatusText}
                  plannerLines={plannerLines}
                  readyToConfirm={Boolean(currentWeekState.readyToConfirm)}
                  plannerFeedback={currentWeekState.plannerFeedback}
                  days={plannerDays}
                />
              </div>
            </FmPanel>

            {weeklySettlement ? (
              <>
                <ScrollIntoView targetId="weekly-settlement" active={focusParam === "weekly-settlement"} />
                <div id="weekly-settlement">
                  <FmPanel>
                    <FmSectionHead title="上周结算" copy="这里只读取已经落地的统一周结算结果，不会重算，也不会猜玩家选择。" />
                    <div className="mt-6">
                      <WeeklySettlementCard {...weeklySettlement} />
                    </div>
                  </FmPanel>
                </div>
              </>
            ) : null}
          </div>

          <div className="fm-stack">
            <FmPanel>
              <FmSectionHead
                title={vacationMonth ? "本月假期节奏" : "本月周历"}
                copy={
                  vacationMonth
                    ? "假期月不再按普通上课周处理，四周都会以可自由支配时间为主。"
                    : "四周节奏做成总览卡，当前周会高亮；具体逐天选择仍在左侧操作区完成。"
                }
              />
              <div className="mt-6 fm-week-grid">
                {schedule.map((week) => (
                  <section key={week.label} className={`fm-panel fm-week-card ${week.isCurrent ? "is-current" : ""}`}>
                    <div className="fm-week-card__header">
                      <div>
                        <h3>{week.label}</h3>
                        <p>{week.detail}</p>
                      </div>
                      {week.isCurrent ? <span className="fm-week-badge">当前周</span> : null}
                    </div>

                    <div className="fm-week-card__grid">
                      <div className="fm-day-stack">
                        {week.days.slice(0, 4).map((day) => (
                          <div key={`${week.label}-${day.label}`} className="fm-day-chip">
                            <div className="fm-day-chip__row">
                              <strong>{day.label}</strong>
                              <span className={`fm-pill tone-${toneForDay(day.kind)}`}>
                                {labelForDayKind(day.kind, day.released)}
                              </span>
                            </div>
                            <p>{day.detail}</p>
                          </div>
                        ))}
                      </div>

                      <div className="fm-day-stack">
                        {week.days.slice(4).map((day) => (
                          <div key={`${week.label}-${day.label}`} className="fm-day-chip">
                            <div className="fm-day-chip__row">
                              <strong>{day.label}</strong>
                              <span className={`fm-pill tone-${toneForDay(day.kind)}`}>
                                {labelForDayKind(day.kind, day.released)}
                              </span>
                            </div>
                            <p>{day.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </FmPanel>

            <FmPanel>
              <FmSectionHead
                title="后半程方向"
                copy="这里只帮你看清当前的倾向变化，不会提前把这一局的最终去向说死。"
                aside={<span className="fm-chip fm-chip--brand">{formatDirectionStage(directionPerception.stage)}</span>}
              />
              <div className="mt-6 fm-stack">
                <article className="fm-stat-card">
                  <div className="fm-stat-card__label">最近趋势</div>
                  <div className="fm-stat-card__value">{directionPerception.primary.label}</div>
                  <div className="fm-stat-card__copy">{directionPerception.summary}</div>
                </article>
                <article className="fm-stat-card">
                  <div className="fm-stat-card__label">为什么会往这边偏</div>
                  <div className="fm-stat-card__copy">{[...directionPerception.reasons, ...directionSignals].join(" ")}</div>
                </article>
                <article className="fm-stat-card">
                  <div className="fm-stat-card__label">当前最值得留意</div>
                  <div className="fm-stat-card__copy">
                    {publicExamExplanation.summary}{" "}
                    {directionPerception.blockers.length > 0
                      ? directionPerception.blockers.join(" ")
                      : "后面的周安排还会继续影响这条线。"}
                  </div>
                </article>
              </div>
            </FmPanel>

            {latestGrowthLog ? (
              <FmPanel>
                <FmSectionHead title="最近一条成长日志" copy="这里只读取最近一次真实月结算留下来的记录。" />
                <div className="mt-6">
                  <LogFeed items={[latestGrowthLog]} variant="player" />
                </div>
              </FmPanel>
            ) : null}

            <FmPanel>
              <FmSectionHead title="最近动态" copy="这里会保留最近的行动、事件和结算记录，方便你回看这局刚刚发生了什么。" />
              <div className="mt-6">
                <LogFeed items={latestSystemLogs} emptyMessage="目前还没有系统日志留档。" />
              </div>
            </FmPanel>

            <div className="flex flex-wrap gap-3">
              <Link href={buildRunHref("/settlement", bundle.run.id)} className="fm-button-secondary">
                查看最近月结算
              </Link>
              <Link href={buildRunHref("/resume", bundle.run.id)} className="fm-button-secondary">
                履历与成长日志
              </Link>
              <Link href="/new-game" className="fm-button-secondary">
                重新开局
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FmShellLayout>
  );
}

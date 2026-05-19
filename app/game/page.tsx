import Link from "next/link";

import {
  buildPlannerDaysView,
  buildWeeklyScheduleBlocks,
  buildWeeklySettlementView,
  resolveCurrentWeekState,
} from "@/app/game/view-model";
import { ActiveRunSync } from "@/components/active-run-sync";
import { ActionPlanForm } from "@/components/action-plan-form";
import { FormalArtifactCards } from "@/components/formal-artifacts";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmMotionSection } from "@/components/fm-ui/FmMotionSection";
import { LogFeed } from "@/components/log-feed";
import { ScrollIntoView } from "@/components/scroll-into-view";
import { WeeklySettlementCard } from "@/components/weekly-settlement-card";
import { WeeklySettlementModalHost } from "@/components/weekly-settlement-modal-host";
import { WeeklyKickoffModal, type WeeklyKickoffNotice } from "@/components/weekly-kickoff-modal";
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
import { buildGameSpotlightArtifacts } from "@/lib/demo/formal-artifacts";
import { buildGrowthJournalEntry } from "@/lib/demo/monthly-digest";
import { formatMonthLabel } from "@/lib/demo/options";
import { getWeeklyLivingExpense } from "@/data/events";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { normalizeSaveState } from "@/lib/demo/save-state";
import { getServerGameBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats, GameRun, TimeBlockKind } from "@/types/game";

export const dynamic = "force-dynamic";

type GamePageProps = {
  searchParams: DemoPageSearchParams;
};

const weekdayLabels = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
} as const;

function clampProgress(value: number, max = 100) {
  return Math.max(0, Math.min(value / max, 1));
}

function buildMetricItems(stats: DynamicStats, run?: GameRun) {
  const weeklyLivingCost = run ? getWeeklyLivingExpense(run) : 200;
  return [
    {
      label: "金钱",
      value: `${stats.money}`,
      tone: stats.money < weeklyLivingCost ? "red" : stats.money < weeklyLivingCost * 1.2 ? "amber" : "teal",
      icon: "chart" as const,
      progress: clampProgress(stats.money, 2400),
      warning: stats.money < weeklyLivingCost ? "本周可能不够花" : stats.money < weeklyLivingCost * 1.2 ? "现金有点紧" : undefined,
      state: stats.money < weeklyLivingCost ? ("danger" as const) : stats.money < weeklyLivingCost * 1.2 ? ("warning" as const) : ("normal" as const),
    },
    {
      label: "心情",
      value: `${stats.mood}`,
      tone: stats.mood <= 35 ? "rose" : stats.mood <= 50 ? "amber" : "mint",
      icon: "moon" as const,
      progress: clampProgress(stats.mood),
      warning: stats.mood <= 35 ? "状态很低" : stats.mood <= 50 ? "有点疲惫" : undefined,
      state: stats.mood <= 35 ? ("danger" as const) : stats.mood <= 50 ? ("warning" as const) : ("normal" as const),
    },
    {
      label: "压力",
      value: `${stats.stress}`,
      tone: stats.stress >= 75 ? "rose" : stats.stress >= 60 ? "amber" : "blue",
      icon: "alert" as const,
      progress: clampProgress(stats.stress),
      warning: stats.stress >= 75 ? "压力过高" : stats.stress >= 60 ? "压力偏高" : undefined,
      state: stats.stress >= 75 ? ("danger" as const) : stats.stress >= 60 ? ("warning" as const) : ("normal" as const),
    },
    {
      label: "学业",
      value: `${stats.semesterAcademics}`,
      tone: "cyan",
      icon: "book" as const,
      progress: clampProgress(stats.semesterAcademics),
      state: "normal" as const,
    },
    {
      label: "社交",
      value: `${stats.social}`,
      tone: "amber",
      icon: "calendar" as const,
      progress: clampProgress(stats.social),
      state: "normal" as const,
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
      return "还只是个苗头";
  }
}

function buildFinalDemoMilestone(run: GameRun) {
  const monthIndex = (run.currentYear - 1) * 12 + run.currentMonth;
  const milestones: Record<number, { title: string; body: string; tone: "ending" | "event" | "warning" }> = {
    4: {
      title: "竞赛评奖月",
      body: "有些努力会在月底被看见。",
      tone: "event",
    },
    10: {
      title: "竞赛评奖月",
      body: "月底会回头看看，这段时间到底推进了多少。",
      tone: "event",
    },
    13: {
      title: "奖学金评定月",
      body: "上一学年的用力，会在这个月慢慢有回音。",
      tone: "ending",
    },
    16: {
      title: "竞赛评奖月",
      body: "月底会有人回头看看，这学期做出来了什么。",
      tone: "event",
    },
    22: {
      title: "竞赛评奖月",
      body: "这一阵子的投入，到月底会慢慢见分晓。",
      tone: "event",
    },
    25: {
      title: "奖学金评定月",
      body: "第二学年的表现，会在这个月被重新翻出来看。",
      tone: "ending",
    },
    28: {
      title: "考研准备月",
      body: "有些念头会在这个月变得更认真一点。",
      tone: "warning",
    },
    34: {
      title: "推免申请月",
      body: "之前攒下来的东西，会在这里被一起端出来看。",
      tone: "ending",
    },
    36: {
      title: "考研结果月",
      body: "前面那段长长的准备，会在这里慢慢落下来。",
      tone: "warning",
    },
    37: {
      title: "求职季开始",
      body: "快毕业了，有些门会在这时候慢慢打开。",
      tone: "event",
    },
    40: {
      title: "竞赛评奖月",
      body: "如果还有想补的一笔，这个月会是最后几次机会之一。",
      tone: "event",
    },
    46: {
      title: "最后一轮竞赛评奖",
      body: "临近毕业，很多事都快到最后一眼了。",
      tone: "event",
    },
    48: {
      title: "毕业月",
      body: "这四年会在这里慢慢合上。",
      tone: "ending",
    },
  };

  const current = milestones[monthIndex];
  if (current) {
    return { monthIndex, ...current };
  }

  const nextMonth = Object.keys(milestones)
    .map(Number)
    .find((item) => item > monthIndex);

  return nextMonth
    ? {
        monthIndex: nextMonth,
        title: `第 ${nextMonth} 月｜${milestones[nextMonth]!.title}`,
        body: "这个月有些日子值得留意。",
        tone: milestones[nextMonth]!.tone,
      }
    : null;
}

type MonthCalendarItem = {
  title: string;
  body: string;
  tone: "event" | "warning" | "ending";
  label: "关键节点" | "机会事件" | "临时占用";
};

function buildMonthCalendarItems(run: GameRun, currentWeekState: ReturnType<typeof resolveCurrentWeekState>) {
  const items: MonthCalendarItem[] = [];
  const milestone = buildFinalDemoMilestone(run);
  const activeProjects = (run.competitionProjects ?? []).filter((project) => project.status === "active");

  if (milestone) {
    items.push({
      title: milestone.title,
      body: milestone.body,
      tone: milestone.tone,
      label: "关键节点",
    });
  }

  if (currentWeekState.event) {
    items.push({
      title: currentWeekState.event.title,
      body: "那天可能要给它留点时间。",
      tone: "event",
      label: "机会事件",
    });
  } else {
    items.push({
      title: "这个月也许会冒出新机会",
      body: "有些事不会提前说满，但值得你留一点心。",
      tone: "event",
      label: "机会事件",
    });
  }

  if (run.stats.money < getWeeklyLivingExpense(run) || run.stats.stress >= 60 || run.stats.mood <= 45) {
    items.push({
      title: "这阵子节奏有点挤",
      body: "这个月可能会有几天不太由你自己说了算。",
      tone: "warning",
      label: "临时占用",
    });
  }

  if (activeProjects.length > 0) {
    items.push({
      title: `${activeProjects.length} 个项目在推进`,
      body: "如果愿意继续投时间，这个月会很有存在感。",
      tone: "event",
      label: "机会事件",
    });
  }

  return items.slice(0, 4);
}

function buildWeeklyKickoffNotices(
  currentWeekState: ReturnType<typeof resolveCurrentWeekState>,
): WeeklyKickoffNotice[] {
  if (!currentWeekState.event) {
    return [];
  }

  return [
    {
      id: `event-${currentWeekState.event.id}`,
      title: "本周提醒",
      subtitle: `${weekdayLabels[currentWeekState.event.weekday]}｜${currentWeekState.event.title}`,
      bodyLines: [
        currentWeekState.event.summary,
        "那天的安排可能要稍微挪一挪。",
      ],
    },
  ];
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
      return "全天空档";
    case "half_free":
      return "下午有空";
    default:
      return "白天有课";
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
        subtitle="从这一周开始，把大学慢慢过出来。"
        headerMeta={<FmInlineStat tone="teal" icon="calendar" label="当前进度" value="未开局" />}
      >
        <FmPanel>
          <FmSectionHead
            title="还没有进行中的存档"
            copy="先去开一局，再回来安排这一周。"
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

  const hydratedRun = ensureProgressionState(normalizeSaveState(bundle.run));
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
  const weeklySettlement = buildWeeklySettlementView(activeMonth?.latestWeekSettlement);
  const latestMonthlyState = bundle.monthlyStates.at(-1);
  const latestGrowthLog = latestMonthlyState?.snapshot_json
    ? buildGrowthJournalEntry(latestMonthlyState.snapshot_json, latestMonthlyState.year, latestMonthlyState.month)
    : null;
  const directionSignals = summarizeDirectionSignals(hydratedRun);
  const directionPerception = buildDirectionPerception(hydratedRun);
  const publicExamExplanation = buildPublicExamExplanation(hydratedRun);
  const spotlightArtifacts = buildGameSpotlightArtifacts(hydratedRun);
  const finalDemoMilestone = buildFinalDemoMilestone(hydratedRun);
  const weeklyKickoffNotices = buildWeeklyKickoffNotices(currentWeekState);
  const monthIndex = (hydratedRun.currentYear - 1) * 12 + hydratedRun.currentMonth;

  return (
    <FmShellLayout
      active="game"
      runId={runId}
      title={vacationMonth ? "假期安排" : "本周周历"}
      subtitle={
        vacationMonth
          ? "假期到了，看看这周想怎么过。"
          : "先看课表，再安排这一周。"
      }
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
        <ActiveRunSync runId={bundle.run.id} snapshot={hydratedRun} />
        <WeeklyKickoffModal
          runId={bundle.run.id}
          monthIndex={monthIndex}
          week={currentWeek}
          notices={weeklyKickoffNotices}
        />
        <WeeklySettlementModalHost
          focusParam={focusParam}
          settlement={weeklySettlement}
        />
        <FmMotionSection delay={40}>
          <FmMetricStrip items={buildMetricItems(hydratedRun.stats, hydratedRun)} />
        </FmMotionSection>

        {finalDemoMilestone ? (
          <FmMotionSection delay={65}>
            <FmPanel>
              <FmSectionHead
                title="本月会发生什么"
                aside={
                  <FmBadge tone={finalDemoMilestone.tone}>
                    {formatMonthLabel(
                      Math.ceil(finalDemoMilestone.monthIndex / 12),
                      ((finalDemoMilestone.monthIndex - 1) % 12) + 1,
                    )}
                  </FmBadge>
                }
              />
              <div className="mt-6 fm-stat-card">
                <div className="fm-stat-card__label">{finalDemoMilestone.title}</div>
                <div className="fm-stat-card__copy">{finalDemoMilestone.body}</div>
              </div>
            </FmPanel>
          </FmMotionSection>
        ) : null}

        <div className="fm-grid-2">
          <div className="fm-stack">
            <FmMotionSection delay={90}>
              <FmPanel>
              <FmSectionHead
                title={vacationMonth ? "安排这个假期周" : "安排这一周"}
              />
              <div className="mt-6">
                <ActionPlanForm
                  runId={bundle.run.id}
                  currentWeek={Math.min(currentWeek, 4)}
                  attendanceLocked={Boolean(currentWeekState.attendanceLocked)}
                  defaultAttendanceStrategy={currentWeekState.attendanceStrategy}
                  readyToConfirm={Boolean(currentWeekState.readyToConfirm)}
                  plannerFeedback={currentWeekState.plannerFeedback}
                  days={plannerDays}
                />
              </div>
              </FmPanel>
            </FmMotionSection>

            {weeklySettlement ? (
              <>
                <ScrollIntoView targetId="weekly-settlement" active={focusParam === "weekly-settlement"} />
                <div id="weekly-settlement">
                  <FmMotionSection delay={130}>
                    <FmPanel>
                    <FmSectionHead title="上周回看" copy="这周已经过完了。" />
                    <div className="mt-6">
                      <WeeklySettlementCard {...weeklySettlement} />
                    </div>
                    </FmPanel>
                  </FmMotionSection>
                </div>
              </>
            ) : null}
          </div>

          <div className="fm-stack">
            <FmMotionSection delay={120}>
              <FmPanel>
              <FmSectionHead
                title={vacationMonth ? "本月假期节奏" : "本月周历"}
                copy={
                  vacationMonth
                    ? "这个月的时间大多在自己手里。"
                    : "看看这个月四周怎么排开。"
                }
              />
              <div className="mt-6 fm-week-grid">
                {schedule.map((week) => {
                  const weekNumber = Number(week.label.replace(/\D/g, "")) || 0;
                  const weekState = week.isCurrent ? "current" : weekNumber < currentWeek ? "completed" : "upcoming";

                  return (
                  <section
                    key={week.label}
                    className={`fm-card fm-week-card ${weekState === "current" ? "is-current" : ""} ${weekState === "completed" ? "is-completed" : ""} ${weekState === "upcoming" ? "is-upcoming" : ""}`}
                  >
                    <div className="fm-week-card__header">
                      <div>
                        <h3>{week.label}</h3>
                        <p>{week.detail}</p>
                      </div>
                      {weekState === "current" ? <FmBadge tone="ending">当前周</FmBadge> : null}
                      {weekState === "completed" ? <FmBadge tone="academic">已结算</FmBadge> : null}
                      {weekState === "upcoming" ? <FmBadge tone="neutral">还没轮到</FmBadge> : null}
                    </div>

                    <div className="fm-week-card__grid">
                      <div className="fm-day-stack">
                        {week.days.slice(0, 4).map((day) => (
                          <div
                            key={`${week.label}-${day.label}`}
                            className={`fm-day-chip ${day.detail.startsWith("已安排") ? "is-planned" : ""} ${day.eventLabel ? "is-event" : ""} ${weekState === "completed" ? "is-settled" : ""} ${weekState === "upcoming" ? "is-locked" : ""}`}
                          >
                            <div className="fm-day-chip__row">
                              <strong>{day.label}</strong>
                              <span className={`fm-pill tone-${toneForDay(day.kind)}`}>
                                {labelForDayKind(day.kind, day.released)}
                              </span>
                            </div>
                            <p>{day.detail}</p>
                            {day.eventLabel ? <p>{day.eventLabel}</p> : null}
                          </div>
                        ))}
                      </div>

                      <div className="fm-day-stack">
                        {week.days.slice(4).map((day) => (
                          <div
                            key={`${week.label}-${day.label}`}
                            className={`fm-day-chip ${day.detail.startsWith("已安排") ? "is-planned" : ""} ${day.eventLabel ? "is-event" : ""} ${weekState === "completed" ? "is-settled" : ""} ${weekState === "upcoming" ? "is-locked" : ""}`}
                          >
                            <div className="fm-day-chip__row">
                              <strong>{day.label}</strong>
                              <span className={`fm-pill tone-${toneForDay(day.kind)}`}>
                                {labelForDayKind(day.kind, day.released)}
                              </span>
                            </div>
                            <p>{day.detail}</p>
                            {day.eventLabel ? <p>{day.eventLabel}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )})}
              </div>
              </FmPanel>
            </FmMotionSection>

            <FmMotionSection delay={160}>
              <FmPanel>
              <FmSectionHead
                title="后半程方向"
                copy="有些选择正在慢慢留下痕迹。"
                aside={<span className="fm-chip fm-chip--brand">{formatDirectionStage(directionPerception.stage)}</span>}
              />
              <div className="mt-6 fm-stack">
                <article className="fm-stat-card">
                  <div className="fm-stat-card__label">最近的方向感</div>
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
            </FmMotionSection>

            {spotlightArtifacts.length > 0 ? (
              <FmMotionSection delay={175}>
                <FmPanel>
                  <FmSectionHead
                    title="阶段成果聚光灯"
                    copy="这几件事，已经能算是这段时间留下的成果了。"
                    aside={<FmBadge tone="ending">阶段成果</FmBadge>}
                  />
                  <div className="mt-6">
                    <FormalArtifactCards artifacts={spotlightArtifacts} runId={runId} showOfferActions />
                  </div>
                </FmPanel>
              </FmMotionSection>
            ) : null}

            {latestGrowthLog ? (
              <FmMotionSection delay={190}>
                <FmPanel>
                <FmSectionHead title="最近一条成长日志" copy="刚过去的那阵子，留下了这些话。" />
                <div className="mt-6">
                  <LogFeed items={[latestGrowthLog]} variant="player" />
                </div>
                </FmPanel>
              </FmMotionSection>
            ) : null}

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

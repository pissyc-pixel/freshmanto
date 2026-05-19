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
import { FormalArtifactCards } from "@/components/formal-artifacts";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmMotionSection } from "@/components/fm-ui/FmMotionSection";
import { LogFeed } from "@/components/log-feed";
import { ScrollIntoView } from "@/components/scroll-into-view";
import { WeeklySettlementCard } from "@/components/weekly-settlement-card";
import { WeeklySettlementModal } from "@/components/weekly-settlement-modal";
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
      return "还在慢慢定下来";
  }
}

function buildFinalDemoMilestone(run: GameRun) {
  const monthIndex = (run.currentYear - 1) * 12 + run.currentMonth;
  const milestones: Record<number, { title: string; body: string; tone: "ending" | "event" | "warning" }> = {
    4: {
      title: "竞赛评奖月",
      body: "第 4 周会按规则结算本学期竞赛项目；这里只预告节点，不提前泄露奖项。",
      tone: "event",
    },
    10: {
      title: "竞赛评奖月",
      body: "本月末会检查竞赛进度，没达到门槛就不会强行给奖。",
      tone: "event",
    },
    13: {
      title: "奖学金评定月",
      body: "本月会回看上一学年表现，同一学年只会记录最高一项奖学金。",
      tone: "ending",
    },
    16: {
      title: "竞赛评奖月",
      body: "本学期项目会在月末进入规则结算，结果会写入履历和时间线。",
      tone: "event",
    },
    22: {
      title: "竞赛评奖月",
      body: "这里是大二下的项目回收点，系统只按实际投入结算。",
      tone: "event",
    },
    25: {
      title: "奖学金评定月",
      body: "本月回看第 2 学年表现，奖学金会进入证书、履历和证据链。",
      tone: "ending",
    },
    28: {
      title: "考研开启选择",
      body: "本月末会打开考研准备选择；选择准备不会锁死最终路线。",
      tone: "warning",
    },
    34: {
      title: "推免申请节点",
      body: "本月末会根据 GPA、排名、竞赛、奖学金和经历评估推免申请。",
      tone: "ending",
    },
    36: {
      title: "考研结果节点",
      body: "本月会生成考研结果；没有考上或没有接受推免时，后面仍可转向就业。",
      tone: "warning",
    },
    37: {
      title: "就业 offer 季开始",
      body: "大四开始进入 offer 生成与选择阶段，薪资不会加到在校现金里。",
      tone: "event",
    },
    40: {
      title: "竞赛评奖月",
      body: "大四上项目会在月末结算，适合给最终履历补证据。",
      tone: "event",
    },
    46: {
      title: "最后一轮竞赛评奖",
      body: "这是毕业前最后一轮项目结算窗口，结果会回收到最终报告。",
      tone: "event",
    },
    48: {
      title: "最终结局月",
      body: "本月会生成最终报告，毕业状态、人生去向和证据链会正式落档。",
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
        title: `下一个关键节点：${milestones[nextMonth]!.title}`,
        body: `当前不会提前判结果；可以提前知道 M${nextMonth} 有规则节点，方便安排本月行动。`,
        tone: milestones[nextMonth]!.tone,
      }
    : null;
}

type MonthCalendarItem = {
  title: string;
  body: string;
  tone: "event" | "warning" | "ending";
  label: "关键节点" | "机会事件" | "风险事件" | "正式结果";
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
      label: milestone.tone === "ending" ? "正式结果" : "关键节点",
    });
  }

  if (currentWeekState.event) {
    items.push({
      title: currentWeekState.event.title,
      body: currentWeekState.event.summary,
      tone: "event",
      label: "机会事件",
    });
  } else {
    items.push({
      title: "本周机会入口",
      body: "本周如果刷出讲座、宣讲或项目入口，会先在这里预告，不会直接提前给结果。",
      tone: "event",
      label: "机会事件",
    });
  }

  if (run.stats.money < getWeeklyLivingExpense(run) || run.stats.stress >= 60 || run.stats.mood <= 45) {
    items.push({
      title: "状态风险",
      body: "现金、压力或心情里已经有一项偏紧；风险会提前亮出来，而不是等到结局才突然算账。",
      tone: "warning",
      label: "风险事件",
    });
  }

  if (activeProjects.length > 0) {
    items.push({
      title: `${activeProjects.length} 个项目在推进`,
      body: `本学期已经接住 ${activeProjects.length} 条竞赛 / 项目线，月底会按实际进度结算。`,
      tone: "event",
      label: "机会事件",
    });
  }

  return items.slice(0, 4);
}

function buildWeeklyKickoffNotices(
  run: GameRun,
  currentWeekState: ReturnType<typeof resolveCurrentWeekState>,
): WeeklyKickoffNotice[] {
  const notices: WeeklyKickoffNotice[] = [];

  if (currentWeekState.event) {
    notices.push({
      id: `event-${currentWeekState.event.id}`,
      title: currentWeekState.event.title,
      kind: "event",
      whatHappened: currentWeekState.event.summary,
      changes: [
        currentWeekState.event.effectDescription,
        currentWeekState.event.dayTypeOverride ? "本周有一天时间结构会被事件影响" : "这周会多一个需要回应的机会入口",
      ],
      reminder: "先看清这条事件会占掉什么，再决定要不要把当天行动改成更合适的安排。",
    });
  }

  if (run.stats.money < getWeeklyLivingExpense(run) * 1.2) {
    notices.push({
      id: "money-risk",
      title: "现金开始偏紧",
      kind: "money",
      whatHappened: "这周开始时，手头余额已经靠近基础生活开销线。",
      changes: ["金钱风险上升", "可选高成本行动需要更谨慎"],
      reminder: "至少留一个补现金动作，别让固定开销先把后面的选择压窄。",
    });
  }

  if (run.stats.stress >= 60) {
    notices.push({
      id: "stress-risk",
      title: "压力已经抬高",
      kind: "stress",
      whatHappened: "上一段时间的投入已经把压力顶上来，效率会更容易被拖住。",
      changes: ["压力偏高", "高压行动收益可能打折"],
      reminder: "如果这周还要继续冲，最好给自己留一个恢复位。",
    });
  }

  if (run.stats.mood <= 45) {
    notices.push({
      id: "mood-risk",
      title: "状态有点低",
      kind: "mood",
      whatHappened: "心情已经开始影响体感，硬把所有时间都塞满会更难持续。",
      changes: ["心情偏低", "恢复路径变得更重要"],
      reminder: "休息、社交或吃顿好的都不是浪费，它们是在帮后面的安排留出续航。",
    });
  }

  return notices;
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
  const plannerStatusText = buildPlannerStatusText(currentWeekState);
  const plannerLines = buildPlannerFeedbackLines(currentWeekState);
  const weeklySettlement = buildWeeklySettlementView(activeMonth?.latestWeekSettlement);
  const latestMonthlyState = bundle.monthlyStates.at(-1);
  const latestGrowthLog = latestMonthlyState?.snapshot_json
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
  const spotlightArtifacts = buildGameSpotlightArtifacts(hydratedRun);
  const finalDemoMilestone = buildFinalDemoMilestone(hydratedRun);
  const monthCalendarItems = buildMonthCalendarItems(hydratedRun, currentWeekState);
  const weeklyKickoffNotices = buildWeeklyKickoffNotices(hydratedRun, currentWeekState);
  const monthIndex = (hydratedRun.currentYear - 1) * 12 + hydratedRun.currentMonth;

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
        <ActiveRunSync runId={bundle.run.id} snapshot={hydratedRun} />
        <WeeklyKickoffModal
          runId={bundle.run.id}
          monthIndex={monthIndex}
          week={currentWeek}
          notices={weeklyKickoffNotices}
        />
        <WeeklySettlementModal
          open={focusParam === "weekly-settlement"}
          settlement={weeklySettlement}
          closeHref={buildRunHref("/game", bundle.run.id)}
        />
        <FmMotionSection delay={40}>
          <FmMetricStrip items={buildMetricItems(hydratedRun.stats, hydratedRun)} />
        </FmMotionSection>

        {finalDemoMilestone ? (
          <FmMotionSection delay={65}>
            <FmPanel>
              <FmSectionHead
                title="Final Demo Milestone"
                copy="本月提醒只预告规则节点，不提前泄露奖学金、竞赛、offer 或结局结果。"
                aside={<FmBadge tone={finalDemoMilestone.tone}>M{finalDemoMilestone.monthIndex}</FmBadge>}
              />
              <div className="mt-6 fm-stat-card">
                <div className="fm-stat-card__label">{finalDemoMilestone.title}</div>
                <div className="fm-stat-card__copy">{finalDemoMilestone.body}</div>
              </div>
            </FmPanel>
          </FmMotionSection>
        ) : null}

        <FmMotionSection delay={80}>
          <FmPanel>
            <FmSectionHead
              title="本月事件月历"
              copy="这里提前展示关键、机会和风险层级；只预告节点，不提前泄露你会得到什么结果。"
            />
            <div className="mt-6 fm-month-event-grid">
              {monthCalendarItems.map((item) => (
                <article key={`${item.label}-${item.title}`} className="fm-month-event-card">
                  <FmBadge tone={item.tone}>{item.label}</FmBadge>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </FmPanel>
        </FmMotionSection>

        <div className="fm-grid-2">
          <div className="fm-stack">
            <FmMotionSection delay={90}>
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
            </FmMotionSection>

            {weeklySettlement ? (
              <>
                <ScrollIntoView targetId="weekly-settlement" active={focusParam === "weekly-settlement"} />
                <div id="weekly-settlement">
                  <FmMotionSection delay={130}>
                    <FmPanel>
                    <FmSectionHead title="上周结算" copy="这里只读取已经落地的统一周结算结果，不会重算，也不会猜玩家选择。" />
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
                    ? "假期月不再按普通上课周处理，四周都会以可自由支配时间为主。"
                    : "四周节奏做成总览卡，当前周会高亮；具体逐天选择仍在左侧操作区完成。"
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
                            className={`fm-day-chip ${day.detail.startsWith("已安排") ? "is-planned" : ""} ${day.detail.includes("事件") ? "is-event" : ""} ${weekState === "completed" ? "is-settled" : ""} ${weekState === "upcoming" ? "is-locked" : ""}`}
                          >
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
                          <div
                            key={`${week.label}-${day.label}`}
                            className={`fm-day-chip ${day.detail.startsWith("已安排") ? "is-planned" : ""} ${day.detail.includes("事件") ? "is-event" : ""} ${weekState === "completed" ? "is-settled" : ""} ${weekState === "upcoming" ? "is-locked" : ""}`}
                          >
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
                )})}
              </div>
              </FmPanel>
            </FmMotionSection>

            <FmMotionSection delay={160}>
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
            </FmMotionSection>

            {spotlightArtifacts.length > 0 ? (
              <FmMotionSection delay={175}>
                <FmPanel>
                  <FmSectionHead
                    title="阶段成果聚光灯"
                    copy="这里展示的是当前存档里已经真实发生并且已经结算进规则层的正式阶段结果，不提前发奖，也不提前发 offer。"
                    aside={<FmBadge tone="ending">真实归档</FmBadge>}
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
                <FmSectionHead title="最近一条成长日志" copy="这里只读取最近一次真实月结算留下来的记录。" />
                <div className="mt-6">
                  <LogFeed items={[latestGrowthLog]} variant="player" />
                </div>
                </FmPanel>
              </FmMotionSection>
            ) : null}

            <FmMotionSection delay={220}>
              <FmPanel>
              <FmSectionHead title="最近动态" copy="这里会保留最近的行动、事件和结算记录，方便你回看这局刚刚发生了什么。" />
              <div className="mt-6">
                <LogFeed items={latestSystemLogs} emptyMessage="目前还没有系统日志留档。" />
              </div>
              </FmPanel>
            </FmMotionSection>

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

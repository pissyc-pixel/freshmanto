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
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { DynamicStats, TimeBlockKind } from "@/types/game";

export const dynamic = "force-dynamic";

type GamePageProps = {
  searchParams: DemoPageSearchParams;
};

const statLabels: Record<keyof DynamicStats, string> = {
  money: "金钱",
  mood: "心情",
  stress: "压力",
  fulfillment: "成就感",
  social: "社交",
  semesterAcademics: "本学期学业值",
};

function buildStatItems(stats: DynamicStats) {
  return (Object.entries(stats) as Array<[keyof DynamicStats, number]>).map(([key, value]) => ({
    label: statLabels[key],
    value,
  }));
}

function formatMonthLabel(year: number, month: number) {
  return `第 ${year} 学年 / 第 ${month} 月`;
}

function formatDayKind(kind: TimeBlockKind) {
  if (kind === "free") {
    return "全天空闲";
  }

  if (kind === "half_free") {
    return "下午半天空档";
  }

  return "白天上课或忙碌";
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
        description="游戏页需要一个真实的 runId，才能展示当前状态、周历和行动入口。"
        actions={
          <Link
            href="/"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            返回开局页
          </Link>
        }
      >
        <SectionCard title="还没有进行中的 run" description="从开局页创建新局后，这里会展示当前 run 的实时快照。">
          <p className="text-sm leading-6 text-stone-600">
            页面只负责展示和收集输入，核心结算仍然由服务层和规则层完成。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const activeMonth = bundle.run.activeMonth;
  const weeklyCalendar = activeMonth?.weeklyCalendar ?? createWeeklyCalendar(bundle.run.currentMonth);
  const currentWeek = activeMonth?.currentWeek ?? 1;
  const lastTurn = activeMonth?.lastResolvedTurn;
  const schedule = weeklyCalendar.map((week) => ({
    label: week.label,
    isCurrent: week.week === currentWeek,
    detail: `周二/周四半天空档，周末全天空闲；本周当前可选时段仍由规则层判定。`,
    days: week.days.map((day) => ({
      label: day.label,
      kind: day.dayType,
      detail: formatDayKind(day.dayType),
    })),
  }));
  const latestLogs = bundle.logs.slice(-5).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month,
  }));

  return (
    <AppShell
      eyebrow="主游戏页"
      title={`${formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)} 的周行动`}
      description="现在改成按周推进：每结算一次行动，就立刻推进到下一周，并把结果写回当前 run。第 4 周结束时才生成整月快照和月报。"
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
        <SectionCard title="随机开局" description="这些都是创建 run 时固定下来的开局属性，会随着整局游戏持续保存。">
          <ProfileSummary profile={bundle.run.profile} />
        </SectionCard>

        <SectionCard title="当前状态" description="这里显示的是最新持久化快照。每次周行动结算后都会立即刷新。">
          <StatsGrid items={buildStatItems(bundle.run.stats)} />
        </SectionCard>

        <SectionCard
          title="本月周历"
          description="1 个月固定为 4 周。周六、周日白天完全空闲；周二、周四白天只有半天空档；其余工作日默认只有夜间窗口。"
        >
          <TimeBlockStrip blocks={schedule} />
        </SectionCard>

        <SectionCard
          title="上一回合反馈"
          description="每次行动都会即时推进和即时结算，方便你根据刚发生的结果继续决定下一步。"
        >
          {lastTurn ? (
            <div className="space-y-3 text-sm leading-6 text-stone-700">
              <p>
                已结算到 <span className="font-semibold text-stone-900">{lastTurn.slotLabel}</span>，
                这周选择了 <span className="font-semibold text-stone-900">{lastTurn.attendanceStrategy}</span> 策略，
                行动是 <span className="font-semibold text-stone-900">{lastTurn.resolvedAction.action}</span>。
              </p>
              <p>
                金钱 {lastTurn.statsDelta.money >= 0 ? "+" : ""}
                {lastTurn.statsDelta.money}，心情 {lastTurn.statsDelta.mood >= 0 ? "+" : ""}
                {lastTurn.statsDelta.mood}，压力 {lastTurn.statsDelta.stress >= 0 ? "+" : ""}
                {lastTurn.statsDelta.stress}。
              </p>
              <p>{lastTurn.notableFacts.join("；") || "这一周没有额外提示。"} </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              这个月还没有结算过任何行动。先做第 1 周的决定，系统会立刻给出结果。
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="提交本周行动"
          description="每次只选 1 个行动。规则层会根据课程策略、行动类型、冷却和风险状态立即结算。"
        >
          <ActionPlanForm
            runId={bundle.run.id}
            currentWeek={Math.min(currentWeek, 4)}
            defaultAttendanceStrategy={lastTurn?.attendanceStrategy ?? "mixed"}
          />
        </SectionCard>

        <SectionCard title="最近日志" description="这里显示已写入数据层的最近几条关键日志，方便核对当前进度。">
          <LogFeed items={latestLogs} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

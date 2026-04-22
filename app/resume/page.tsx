import { AppShell } from "@/components/app-shell";
import { HistoryTimeline } from "@/components/history-timeline";
import { LogFeed } from "@/components/log-feed";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";
import { buildPlayerFacingMonthlyLog, formatMonthLabel } from "@/lib/demo/options";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type ResumePageProps = {
  searchParams: DemoPageSearchParams;
};

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="履历"
        title="还没有履历数据。"
        description="履历页会展示 run 过程中累积出来的履历条目、成长轨迹和日志视角。"
      >
        <SectionCard title="暂无履历" description="先创建 run 并推进月份。">
          <p className="text-sm leading-6 text-stone-600">
            实习、项目、活动和求职进度会在月结算后逐步写入数据库。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const historyEntries = bundle.monthlyStates.slice(-6).map((state) => {
    const playerLog = buildPlayerFacingMonthlyLog(state.snapshot_json, state.year, state.month);

    return {
      monthLabel: formatMonthLabel(state.year, state.month),
      title: playerLog.title,
      summary: playerLog.message,
      tone:
        state.snapshot_json.statsDelta.semesterAcademics > 0
          ? ("up" as const)
          : state.snapshot_json.statsDelta.stress > 0
            ? ("down" as const)
            : ("flat" as const)
    };
  });
  const playerLogs = bundle.monthlyStates.slice(-6).reverse().map((state) => ({
    id: `${state.id}-player`,
    ...buildPlayerFacingMonthlyLog(state.snapshot_json, state.year, state.month)
  }));
  const systemLogs = bundle.logs.slice(-6).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month
  }));

  return (
    <AppShell
      eyebrow="履历"
      title="履历与成长回看"
      description="履历条目展示你留下了什么，前台日志帮助你回忆这个月怎么过，后台日志则保留系统留档。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="履历条目" description="这些条目都来自规则层结算结果，并且已经持久化保存。">
          <ResumeItemList
            items={bundle.resumeItems.map((item) => ({
              id: item.id,
              category: item.category,
              title: item.title,
              summary: item.summary,
              month: item.month,
              tags: Array.isArray(item.metadata_json.tags)
                ? item.metadata_json.tags.filter((tag): tag is string => typeof tag === "string")
                : []
            }))}
          />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="阶段轨迹" description="把最近几次月结算串成时间线，更容易看出自己的节奏变化。">
            <HistoryTimeline entries={historyEntries} />
          </SectionCard>
          <SectionCard
            title="前台日志：玩家回顾"
            description="这一列是给玩家看的月度叙事，不直接复读后台系统消息。"
          >
            <LogFeed
              items={playerLogs}
              variant="player"
              emptyMessage="还没有足够的月份记录来生成玩家回顾。"
            />
          </SectionCard>
          <SectionCard
            title="后台日志：系统留档"
            description="这一列保留动作、事件和结算的系统记录，用途是追踪与排查。"
          >
            <LogFeed items={systemLogs} emptyMessage="目前还没有系统日志留档。" />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

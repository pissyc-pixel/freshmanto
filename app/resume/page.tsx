import { AppShell } from "@/components/app-shell";
import { HistoryTimeline } from "@/components/history-timeline";
import { LogFeed } from "@/components/log-feed";
import { ResumeItemList } from "@/components/resume-item-list";
import { SectionCard } from "@/components/section-card";
import { formatMonthLabel } from "@/lib/demo/options";
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
        description="履历页会展示 run 过程中积累下来的结构化条目。"
      >
        <SectionCard title="暂无履历" description="先创建 run 并推进月份。">
          <p className="text-sm leading-6 text-stone-600">实习、项目、活动和求职进度会在结算后逐步写入数据库。</p>
        </SectionCard>
      </AppShell>
    );
  }

  const historyEntries = bundle.monthlyStates.slice(-6).map((state) => ({
    monthLabel: formatMonthLabel(state.year, state.month),
    title: `本月学业状态：${state.snapshot_json.academicFeedback}`,
    summary: state.snapshot_json.notableFacts.join(" "),
    tone:
      state.snapshot_json.statsDelta.semesterAcademics > 0
        ? ("up" as const)
        : state.snapshot_json.statsDelta.stress > 0
          ? ("down" as const)
          : ("flat" as const)
  }));
  const recentLogs = bundle.logs.slice(-6).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month
  }));

  return (
    <AppShell
      eyebrow="履历"
      title="轻量履历与成长轨迹"
      description="前台按分类展示履历条目，后台保留结构化记录，后续可以继续扩展到求职或结局评估。"
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="履历条目" description="这些条目都来自规则层结算结果并已持久化。">
          <ResumeItemList items={bundle.resumeItems.map((item) => ({
            id: item.id,
            category: item.category,
            title: item.title,
            summary: item.summary,
            month: item.month,
            tags: Array.isArray(item.metadata_json.tags)
              ? item.metadata_json.tags.filter((tag): tag is string => typeof tag === "string")
              : []
          }))} />
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="阶段轨迹" description="把最近几次月结算压成时间线，便于回看节奏变化。">
            <HistoryTimeline entries={historyEntries} />
          </SectionCard>
          <SectionCard title="最近日志" description="日志可作为履历和结局报告的底层回溯依据。">
            <LogFeed items={recentLogs} />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { HistoryTimeline } from "@/components/history-timeline";
import { LogFeed } from "@/components/log-feed";
import { ResumeItemList } from "@/components/resume-item-list";
import { ResumePriorityPanel } from "@/components/resume-priority-panel";
import { SectionCard } from "@/components/section-card";
import { deriveAcademicProfile, ensureProgressionState, summarizeDirectionSignals } from "@/core/resolvers/progression";
import { buildGrowthJournalEntry } from "@/lib/demo/monthly-digest";
import { formatMonthLabel } from "@/lib/demo/options";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type ResumePageProps = {
  searchParams: DemoPageSearchParams;
};

function hasKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="履历"
        title="这里会整理履历与成长日志"
        description="履历页会优先展示 GPA、排名、百分比、比赛、实习、奖学金，并保留成长日志和系统留档。"
      >
        <SectionCard title="还没有可查询的 run" description="先回到首页创建一局，再回来查看履历页。">
          <p className="text-sm leading-6 text-stone-600">
            这页现在会对空状态做兼容处理，没有数据时也不会直接报错。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const hydratedRun = ensureProgressionState(bundle.run);
  const academicProfile = deriveAcademicProfile(hydratedRun);
  const directionSignals = summarizeDirectionSignals(hydratedRun);
  const resumeItems = bundle.resumeItems.map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    summary: item.summary,
    month: item.month,
    tags: Array.isArray(item.metadata_json.tags)
      ? item.metadata_json.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
  }));
  const competitionItems = resumeItems.filter(
    (item) => hasKeyword(item.title, ["比赛", "竞赛"]) || item.tags.some((tag) => hasKeyword(tag, ["比赛", "竞赛"])),
  );
  const internshipItems = resumeItems.filter(
    (item) =>
      item.category === "internship" ||
      hasKeyword(item.title, ["实习"]) ||
      hasKeyword(item.summary, ["实习"]),
  );
  const scholarshipItems = resumeItems.filter(
    (item) =>
      hasKeyword(item.title.toLowerCase(), ["奖学金", "scholarship"]) ||
      item.tags.some((tag) => hasKeyword(tag.toLowerCase(), ["奖学金", "scholarship"])),
  );
  const playerLogs = bundle.monthlyStates.slice(-6).reverse().map((state) => ({
    id: `${state.id}-growth`,
    ...buildGrowthJournalEntry(state.snapshot_json, state.year, state.month),
  }));
  const historyEntries = bundle.monthlyStates.slice(-6).map((state) => {
    const log = buildGrowthJournalEntry(state.snapshot_json, state.year, state.month);

    return {
      monthLabel: formatMonthLabel(state.year, state.month),
      title: log.title,
      summary: log.message,
      tone:
        state.snapshot_json.statsDelta.semesterAcademics > 0
          ? ("up" as const)
          : state.snapshot_json.statsDelta.stress > 0
            ? ("down" as const)
            : ("flat" as const),
    };
  });
  const systemLogs = bundle.logs.slice(-8).reverse().map((log) => ({
    id: log.id,
    logType: log.log_type,
    message: log.message,
    year: log.year,
    month: log.month,
  }));
  const gpaValue = academicProfile.gpa.toFixed(2);
  const priorityItems = [
    {
      label: "GPA",
      value: gpaValue,
      hint: bundle.run.semesterAverage > 0 ? `按当前学期平均分 ${bundle.run.semesterAverage} 做兼容换算。` : "还没有足够的学期数据。",
    },
    {
      label: "排名",
      value: "暂未生成",
      hint: "本轮先保留可读占位，不让履历页因为未实装字段直接空掉。",
    },
    {
      label: "百分比",
      value: "暂未生成",
      hint: "等后续接入更细的成绩体系后再替换成真实数据。",
    },
    {
      label: "比赛",
      value: competitionItems.length > 0 ? `${competitionItems.length} 条` : "暂无",
      hint: competitionItems[0]?.title ?? "目前还没有记录到比赛经历。",
    },
    {
      label: "实习",
      value: internshipItems.length > 0 ? `${internshipItems.length} 条` : "暂无",
      hint: internshipItems[0]?.title ?? "目前还没有记录到实习经历。",
    },
    {
      label: "奖学金",
      value: scholarshipItems.length > 0 ? `${scholarshipItems.length} 条` : "暂无",
      hint: scholarshipItems[0]?.title ?? "目前还没有记录到奖学金信息。",
    },
  ];

  return (
    <AppShell
      eyebrow="履历"
      title="履历与成长日志"
      description="这页优先把能展示的履历信息、成长日志和系统留档整理出来；没数据时给占位，有数据时就真实展示。"
    >
      <div className="space-y-6">
        <SectionCard
          title="履历优先摘要"
          description="优先展示 GPA / 排名 / 百分比 / 比赛 / 实习 / 奖学金；未实装字段先给兼容占位。"
        >
          <ResumePriorityPanel items={priorityItems} />
        </SectionCard>

        <SectionCard title="方向正在形成" description="这轮先把后半程方向感接到履历页上，让玩家能看到自己正在往哪边偏。">
          <div className="space-y-2 text-sm leading-6 text-stone-700">
            <p>
              当前主导倾向：
              <span className="font-semibold text-stone-900"> {hydratedRun.progression?.dominantDirection ?? "undecided"}</span>
              ，推导 GPA {academicProfile.gpa.toFixed(2)}，公考进度 {hydratedRun.progression?.publicExam.progress ?? 0}。
            </p>
            {directionSignals.length > 0 ? directionSignals.map((line) => <p key={line}>{line}</p>) : <p>目前还在打底，未来走向暂时没有明显定型。</p>}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="履历条目" description="已实装的数据会真实展示；没有条目时也不会报错。">
            <ResumeItemList items={resumeItems} />
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="阶段轨迹" description="把最近几个月串起来，更容易看出自己在往哪边走。">
              <HistoryTimeline entries={historyEntries} />
            </SectionCard>

            <SectionCard title="成长日志" description="成长日志偏事实层，整理这个月到底发生了什么。">
              <LogFeed
                items={playerLogs}
                variant="player"
                emptyMessage="这局目前还没有足够的月度记录来整理成长日志。"
              />
            </SectionCard>

            <SectionCard title="后台日志" description="这里保留动作、事件和结算的系统留档，主要用于追踪与排查。">
              <LogFeed items={systemLogs} emptyMessage="目前还没有系统日志留档。" />
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

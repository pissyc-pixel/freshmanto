import { AppShell } from "@/components/app-shell";
import { HistoryTimeline } from "@/components/history-timeline";
import { LogFeed } from "@/components/log-feed";
import { ResumeItemList } from "@/components/resume-item-list";
import { ResumePriorityPanel } from "@/components/resume-priority-panel";
import { SectionCard } from "@/components/section-card";
import {
  buildDirectionPerception,
  buildPublicExamExplanation,
  buildRecommendationExplanation,
  buildResumeEvidenceSummary,
  deriveAcademicProfile,
  ensureProgressionState,
  summarizeDirectionSignals,
} from "@/core/resolvers/progression";
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

function formatDirectionStage(stage: "undecided" | "forming" | "clear") {
  switch (stage) {
    case "clear":
      return "方向已经越来越清楚";
    case "forming":
      return "方向正在成形";
    default:
      return "目前还偏未定";
  }
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
        description="履历页会优先展示 GPA、排名、百分比、比赛、实习、奖学金，并把这些东西和未来方向联系起来。"
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
  const directionPerception = buildDirectionPerception(hydratedRun);
  const recommendationExplanation = buildRecommendationExplanation(hydratedRun);
  const publicExamExplanation = buildPublicExamExplanation(hydratedRun);
  const resumeEvidence = buildResumeEvidenceSummary(hydratedRun);
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
  const priorityItems = [
    {
      label: "GPA",
      value: academicProfile.gpa.toFixed(2),
      hint: `当前成绩画像换算后的 GPA 约为 ${academicProfile.gpa.toFixed(2)}，会直接影响深造和推免线。`,
    },
    {
      label: "排名",
      value: academicProfile.rank ? `前 ${academicProfile.rank}` : "暂未生成",
      hint: academicProfile.rank ? "它不是精确教务排名，但已经能体现你当前大概处在什么位置。" : "还没有足够的学业数据来形成排名画像。",
    },
    {
      label: "百分比",
      value: academicProfile.percentile ? `${academicProfile.percentile}%` : "暂未生成",
      hint: academicProfile.percentile ? "这个值越高，说明你越接近前排位置。" : "后续学期数据累积后，这里会更稳定。",
    },
    {
      label: "比赛",
      value: competitionItems.length > 0 ? `${competitionItems.length} 条` : "暂无",
      hint: competitionItems[0]?.title ?? "竞赛和长期项目成果还在继续累积。",
    },
    {
      label: "实习",
      value: internshipItems.length > 0 ? `${internshipItems.length} 条` : "暂无",
      hint: internshipItems[0]?.title ?? "实习与实践经历会更明显地推高就业方向。",
    },
    {
      label: "奖学金",
      value: scholarshipItems.length > 0 ? `${scholarshipItems.length} 条` : "暂无",
      hint: scholarshipItems[0]?.title ?? "奖学金会同时影响学术竞争力和推免画像。",
    },
  ];

  return (
    <AppShell
      eyebrow="履历"
      title="履历与成长日志"
      description="这里会把能展示的履历信息、成长日志和系统留档整理出来，让你看清自己为什么越来越像在走某条路。"
    >
      <div className="space-y-6">
        <SectionCard
          title="履历优先摘要"
          description="优先展示 GPA / 排名 / 百分比 / 比赛 / 实习 / 奖学金；暂时没有的字段也会给兼容占位。"
        >
          <ResumePriorityPanel items={priorityItems} />
        </SectionCard>

        <SectionCard
          title="方向正在形成"
          description="这块不是下结论，而是把你现在最像在靠近哪种未来，以及它背后的证据翻给你看。"
          aside={
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {formatDirectionStage(directionPerception.stage)}
            </span>
          }
        >
          <div className="space-y-4 text-sm leading-6 text-stone-700">
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
              <p className="text-lg font-semibold text-stone-900">
                现在最像在往“{directionPerception.primary.label}”这条路走
                {directionPerception.secondary ? `，同时也还留着一点 ${directionPerception.secondary.label} 的空间。` : "。"}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{directionPerception.summary}</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">学业类积累</p>
                <div className="mt-3 space-y-2">
                  {resumeEvidence.academic.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">履历类积累</p>
                <div className="mt-3 space-y-2">
                  {resumeEvidence.practice.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">机会类线索</p>
                <div className="mt-3 space-y-2">
                  {resumeEvidence.opportunities.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">推免画像</p>
                <p className="mt-3">{recommendationExplanation.summary}</p>
                <div className="mt-3 space-y-2">
                  {recommendationExplanation.strengths.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {recommendationExplanation.gaps.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-[var(--border)] bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">公考线索</p>
                <p className="mt-3">{publicExamExplanation.summary}</p>
                <div className="mt-3 space-y-2">
                  {publicExamExplanation.signals.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {directionSignals.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            </div>
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

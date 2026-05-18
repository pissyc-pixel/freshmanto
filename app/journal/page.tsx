import { ActiveRunSync } from "@/components/active-run-sync";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmLoadingState } from "@/components/fm-ui/FmLoadingState";
import { FmMotionSection } from "@/components/fm-ui/FmMotionSection";
import {
  FmInlineStat,
  FmPanel,
  FmSectionHead,
  FmShellLayout,
} from "@/components/fm-ui/FmScaffold";
import { buildMonthlyJournalRulesFallback } from "@/lib/ai/reports";
import { resolveActiveRunId } from "@/lib/demo/active-run";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import { formatMonthLabel } from "@/lib/demo/options";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerJournalBundle } from "@/lib/demo/server";
import { buildJournalOverview } from "@/lib/journal-overview";
import { sanitizePlayerFacingText } from "@/lib/player-facing-text";
import type { StructuredMonthlySummary } from "@/types/game";

export const dynamic = "force-dynamic";

type JournalPageProps = {
  searchParams: DemoPageSearchParams;
};

function formatMoney(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function buildTimelineTags(summary: StructuredMonthlySummary | null | undefined) {
  if (!summary) {
    return [];
  }

  const tags: string[] = [];

  if ((summary.statsDelta?.semesterAcademics ?? 0) >= 6) {
    tags.push("学业推进");
  }
  if ((summary.statsAfter?.money ?? 0) <= 350 || (summary.statsDelta?.money ?? 0) <= -450) {
    tags.push("现金紧张");
  }
  if ((summary.statsAfter?.stress ?? 0) >= 68 || (summary.statsDelta?.stress ?? 0) >= 6) {
    tags.push("压力升高");
  }
  if ((summary.statsDelta?.social ?? 0) >= 5) {
    tags.push("社交变多");
  }
  if ((summary.progression?.dominantDirection ?? "undecided") === "undecided") {
    tags.push("方向未定");
  }
  if ((summary.resumeAdditions ?? []).length > 0) {
    tags.push("履历增加");
  }

  return [...new Set(tags)].slice(0, 4);
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const bundle = runId ? await getServerJournalBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmShellLayout
        active="journal"
        runId={runId}
        title="成长日志"
        subtitle="这里会收集每个月的 AI 月记，也会把已经发生过的成长痕迹按时间整理出来。"
        headerMeta={
          <>
            <FmInlineStat tone="teal" icon="book" label="月记归档" value="0 篇" />
            <FmInlineStat tone="amber" icon="calendar" label="成长记录" value="0 条" />
          </>
        }
      >
        <div className="fm-grid-2">
          <FmPanel>
            <FmSectionHead
              title="这里会收集每个月的 AI 月记"
              copy="月记只能基于真实月结算后的结构化摘要生成，没有存档的时候不会凭空生成。"
            />
            <div className="mt-6">
              <FmEmptyState
                title="先回到首页创建一局"
                body="这条线索还没在你的大学生活里出现。没有存档的时候，这里会优先显示空状态，而不是直接报错。"
              />
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="成长日志"
              copy="当这局存档逐渐留下月度经历之后，这里会按时间线把它们串起来。"
            />
            <div className="mt-6">
              <FmEmptyState
                title="当前阶段尚未形成明确方向"
                body="还没有足够的月度记录来整理成长时间线。先完成一段真实推进，这里才会长出内容。"
              />
            </div>
          </FmPanel>
        </div>
      </FmShellLayout>
    );
  }

  const monthlyReports = bundle.aiReports.filter((item) => item.report_type === "monthly_journal");
  const overview = buildJournalOverview({
    monthlyStates: bundle.monthlyStates,
    aiReports: bundle.aiReports,
  });
  const pendingMonths = bundle.monthlyStates.filter(
    (state) => !monthlyReports.some((report) => report.year === state.year && report.month === state.month),
  );
  const growthEntries = bundle.monthlyStates
    .slice()
    .reverse()
    .map((state) => ({
      id: `${state.id}-growth`,
      state,
      ...(state.snapshot_json
        ? buildGrowthJournalEntry(state.snapshot_json, state.year, state.month)
        : {
            badge: "成长日志",
            periodLabel: formatMonthLabel(state.year, state.month),
            title: "数据还没接完整",
            message: "这个月的快照信息不完整，所以这里只保留一个温和的占位说明。",
            details: [] as string[],
          }),
    }));

  const latestState = bundle.monthlyStates.at(-1) ?? null;
  const latestReport = latestState
    ? monthlyReports.find((report) => report.year === latestState.year && report.month === latestState.month) ?? null
    : null;
  const latestDigest = latestState?.snapshot_json
    ? buildMonthlyDiaryDigest(latestState.snapshot_json, latestState.year, latestState.month)
    : null;
  const latestRulesFallback = latestState?.snapshot_json
    ? buildMonthlyJournalRulesFallback({
        kind: "monthly_journal",
        runId: bundle.run.id,
        year: latestState.year,
        month: latestState.month,
        summary: latestState.snapshot_json,
      })
    : null;

  return (
    <FmShellLayout
      active="journal"
      runId={runId}
      title="成长日志"
      subtitle="这里会收集每个月的 AI 月记，也会把已经发生过的成长痕迹按时间整理出来。"
      sidebarSummary="这里更像一本大学生活档案册。月记、成长线和归档内容都只会读取这局存档里真实发生过的东西。"
      headerMeta={
        <>
          <FmInlineStat tone="teal" icon="book" label="月记归档" value={`${overview.monthlyJournalCount} 篇`} />
          <FmInlineStat tone="amber" icon="calendar" label="成长记录" value={`${overview.growthLogCount} 条`} />
          <FmInlineStat tone="cyan" icon="check" label="已结算月份" value={`${overview.settledMonthCount} 月`} />
        </>
      }
    >
      <div className="fm-grid-2">
        <ActiveRunSync runId={bundle.run.id} />

        <div className="fm-journal-board">
          <FmMotionSection delay={40}>
            <FmPanel>
              <FmSectionHead
                title="本月记"
                copy="像翻开一页纸一样回看这个月。这里的内容只负责表达已发生的经历，不会替规则层改写结果。"
                aside={latestDigest ? <FmBadge tone="ending">{latestDigest.monthLabel}</FmBadge> : undefined}
              />

              <div className="mt-6 fm-month-paper-scene">
                {latestReport && latestDigest ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <article className="fm-paper">
                      <div className="fm-paper__clip" aria-hidden="true" />
                      <div className="fm-paper__stats">
                        <span className="fm-paper__stat tone-teal">学业 {latestDigest.endState.feedback}</span>
                        <span className="fm-paper__stat tone-amber">现金 {formatMoney(latestDigest.endState.money)}</span>
                        <span className="fm-paper__stat tone-rose">压力 {latestDigest.endState.stress}</span>
                      </div>
                      <div className="fm-paper__date">{formatMonthLabel(latestReport.year, latestReport.month ?? 1)}</div>
                      <h2 className="fm-paper__title">本月记</h2>
                      <div className="fm-paper__copy fm-paper__copy--scroll">
                        {sanitizePlayerFacingText(latestReport.output_markdown)}
                      </div>
                      <div className="fm-paper__fade" aria-hidden="true" />
                      <div className="fm-paper__footer">方向线索：{latestDigest.directionSignal}</div>
                    </article>
                  </div>
                ) : latestRulesFallback && latestDigest ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <article className="fm-paper">
                      <div className="fm-paper__clip" aria-hidden="true" />
                      <div className="fm-paper__stats">
                        <span className="fm-paper__stat tone-teal">学业 {latestDigest.endState.feedback}</span>
                        <span className="fm-paper__stat tone-amber">现金 {formatMoney(latestDigest.endState.money)}</span>
                        <span className="fm-paper__stat tone-rose">压力 {latestDigest.endState.stress}</span>
                      </div>
                      <div className="fm-paper__date">{latestRulesFallback.monthLabel}</div>
                      <h2 className="fm-paper__title">{latestRulesFallback.title}</h2>
                      <div className="fm-paper__copy fm-paper__copy--scroll">
                        {latestRulesFallback.diary.split("\n\n").map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      <div className="fm-paper__fade" aria-hidden="true" />
                      <div className="fm-paper__footer">{latestRulesFallback.endStateLine}</div>
                    </article>
                  </div>
                ) : pendingMonths.length > 0 ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <article className="fm-paper">
                      <div className="fm-paper__clip" aria-hidden="true" />
                      <div className="fm-paper__stats">
                        <span className="fm-paper__stat tone-cyan">已结算 {pendingMonths.length} 月</span>
                        <span className="fm-paper__stat tone-mint">等待补写</span>
                      </div>
                      <div className="fm-paper__date">
                        {formatMonthLabel(pendingMonths.at(-1)!.year, pendingMonths.at(-1)!.month)}
                      </div>
                      <h2 className="fm-paper__title">月记稍后补上</h2>
                      <div className="fm-paper__copy fm-paper__copy--scroll">
                        <FmLoadingState
                          title="AI 月记生成中"
                          body={`已经完成真实结算的月份会优先留在这里。现在还在补写：${pendingMonths
                            .map((state) => formatMonthLabel(state.year, state.month))
                            .join("、")}。`}
                        />
                      </div>
                    </article>
                  </div>
                ) : (
                  <FmEmptyState
                    title="还没有第一篇月记"
                    body="月记不会凭空生成。等完成至少一次月末结算后，这里才会出现第一篇真实归档。"
                  />
                )}
              </div>
            </FmPanel>
          </FmMotionSection>

          <FmMotionSection delay={110}>
            <FmPanel>
              <FmSectionHead
                title="月记归档"
                copy="旧月份会稳定留在下面，不会因为后面的变化回填成更好看的版本。"
              />
              <div className="mt-6 fm-stack">
                {monthlyReports.length > 1 ? (
                  monthlyReports
                    .slice(0, -1)
                    .reverse()
                    .map((report) => {
                      const matchingState = bundle.monthlyStates.find(
                        (state) => state.year === report.year && state.month === report.month,
                      );
                      const digest = matchingState
                        ? buildMonthlyDiaryDigest(matchingState.snapshot_json, matchingState.year, matchingState.month)
                        : null;

                      return (
                        <article key={report.id} className="fm-journal-card">
                          <div className="fm-journal-card__head">
                            <div>
                              <div className="fm-journal-card__month">
                                {formatMonthLabel(report.year, report.month ?? 1)}
                              </div>
                              <h3 className="fm-journal-card__title">归档月记</h3>
                            </div>
                            <FmBadge tone="neutral">{report.model ?? "fallback"}</FmBadge>
                          </div>
                          <p className="fm-journal-card__copy">
                            {digest?.directionSignal ?? "这个月已经归档，但方向线索还没有整理完整。"}
                          </p>
                        </article>
                      );
                    })
                ) : (
                  <p className="fm-archive-note">旧月份会慢慢收进这里。</p>
                )}
              </div>
            </FmPanel>
          </FmMotionSection>
        </div>

        <FmMotionSection delay={180}>
          <FmPanel>
            <FmSectionHead
              title="成长时间线"
              copy="这里更像一条时间轴。每个月留下来的标题、摘要和变化标签，会按顺序帮你看清这局是怎么长出来的。"
            />

            <div className="mt-6">
              {growthEntries.length > 0 ? (
                <div className="fm-timeline">
                  {growthEntries.map((entry, index) => (
                    <article
                      key={entry.id}
                      className={`fm-timeline-entry ${index === 0 ? "is-current" : ""}`}
                    >
                      <div className={`fm-timeline-node ${index === 0 ? "tone-teal" : "tone-cyan"}`} />
                      <div className="fm-journal-card">
                        <div className="fm-journal-card__head">
                          <div>
                            <div className="fm-journal-card__month">{entry.periodLabel}</div>
                            <h3 className="fm-journal-card__title">{entry.title}</h3>
                          </div>
                          <FmBadge tone={index === 0 ? "ending" : "neutral"}>
                            {index === 0 ? "当前月" : entry.badge}
                          </FmBadge>
                        </div>
                        {buildTimelineTags(entry.state.snapshot_json).length > 0 ? (
                          <div className="fm-timeline-tags">
                            {buildTimelineTags(entry.state.snapshot_json).map((tag) => (
                              <span key={`${entry.id}-${tag}`} className="fm-timeline-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="fm-journal-card__copy">{entry.message}</p>
                        <div className="fm-journal-card__details">
                          {entry.details.slice(0, 3).map((detail) => (
                            <div key={detail} className="fm-journal-card__detail">
                              {detail}
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <FmEmptyState
                  title="还没有足够的成长证据"
                  body="这局存档暂时还没有积累出足够的月度经历，所以这里不会编造时间线。"
                />
              )}
            </div>
          </FmPanel>
        </FmMotionSection>
      </div>
    </FmShellLayout>
  );
}

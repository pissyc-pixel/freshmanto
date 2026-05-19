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
import { normalizeSaveState } from "@/lib/demo/save-state";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import { getServerJournalBundle } from "@/lib/demo/server";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { buildJournalOverview } from "@/lib/journal-overview";
import {
  formatPlayerFacingMonthIndex,
  formatTimelineKindLabel,
  sanitizePlayerFacingText,
  sanitizePlayerFacingTextList,
} from "@/lib/player-facing-text";
import type { StructuredMonthlySummary } from "@/types/game";

export const dynamic = "force-dynamic";

type JournalPageProps = {
  searchParams: DemoPageSearchParams;
};

type TimelineEntry = {
  id: string;
  periodLabel: string;
  title: string;
  message: string;
  badge: string;
  details: string[];
};

function formatQualitativeMoney(value: number) {
  if (value <= 250) return "有点紧";
  if (value <= 700) return "得省着点花";
  return "还算能稳住";
}

function formatQualitativeStress(value: number) {
  if (value >= 75) return "压得很满";
  if (value >= 60) return "一直绷着";
  if (value >= 40) return "有点累";
  return "还撑得住";
}

function formatQualitativeMood(value: number) {
  if (value >= 70) return "稍微亮一点";
  if (value >= 50) return "平着往前走";
  if (value >= 35) return "有点闷";
  return "整个人发沉";
}

function buildTimelineTags(summary: StructuredMonthlySummary | null | undefined) {
  if (!summary) return [];

  const tags: string[] = [];

  if ((summary.statsDelta?.semesterAcademics ?? 0) >= 6) tags.push("课业慢慢跟上了");
  if ((summary.statsAfter?.money ?? 0) <= 350 || (summary.statsDelta?.money ?? 0) <= -450) {
    tags.push("手头开始发紧");
  }
  if ((summary.statsAfter?.stress ?? 0) >= 68 || (summary.statsDelta?.stress ?? 0) >= 6) {
    tags.push("这阵子一直绷着");
  }
  if ((summary.statsDelta?.social ?? 0) >= 5) tags.push("和人重新靠近了一点");
  if ((summary.progression?.dominantDirection ?? "undecided") === "undecided") {
    tags.push("方向还没完全定下来");
  }
  if ((summary.resumeAdditions ?? []).length > 0) tags.push("履历又多了一笔");

  return sanitizePlayerFacingTextList([...new Set(tags)].slice(0, 4));
}

function sanitizeTimelineEntry(entry: TimelineEntry): TimelineEntry {
  return {
    ...entry,
    periodLabel: sanitizePlayerFacingText(entry.periodLabel),
    title: sanitizePlayerFacingText(entry.title),
    message: sanitizePlayerFacingText(entry.message),
    badge: formatTimelineKindLabel(entry.badge) || "成长节点",
    details: sanitizePlayerFacingTextList(entry.details),
  };
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });

  let bundle = null;
  try {
    bundle = runId ? await getServerJournalBundle(runId) : null;
  } catch {
    bundle = null;
  }

  const hydratedRun = bundle ? normalizeSaveState(bundle.run) : null;

  if (!runId || !bundle || !hydratedRun) {
    return (
      <FmShellLayout
        active="journal"
        runId={runId}
        title="本月来信"
        subtitle="这里会收集每个月的 AI 月记、成长节点和阶段感受整理成能回看的来信。"
        headerMeta={
          <>
            <FmInlineStat tone="teal" icon="book" label="月记归档" value="0 篇" />
            <FmInlineStat tone="amber" icon="calendar" label="成长节点" value="0 月" />
          </>
        }
      >
        <div className="fm-grid-2">
          <FmPanel>
            <FmSectionHead
              title="本月来信"
              copy="这次没有顺利把月记读出来，但不会影响存档。先回到首页创建一局，或者继续推进当前存档；这里不会凭空生成不存在的月记。"
            />
            <div className="mt-6">
              <FmEmptyState
                title="读不到这封月记"
                body="这通常是旧存档缺字段、演示存档写入中断，或者当前月份还没成功结算。页面会保留为空状态，不会凭空生成不存在的月记，也不再直接崩掉。"
              />
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="成长时间线"
              copy="奖学金、竞赛、实习、路线节点和结局证据，都会按月份留在这里。"
            />
            <div className="mt-6">
              <FmEmptyState
                title="还没有足够的成长证据"
                body="先回到游戏页完成当月推进，再回来翻月记和时间线。"
              />
            </div>
          </FmPanel>
        </div>
      </FmShellLayout>
    );
  }

  const monthlyReports = bundle.aiReports.filter((item) => item.report_type === "monthly_journal");
  const overview = (() => {
    try {
      return buildJournalOverview({
        monthlyStates: bundle.monthlyStates,
        aiReports: bundle.aiReports,
      });
    } catch {
      return {
        monthlyJournalCount: monthlyReports.length,
        growthLogCount: bundle.monthlyStates.length,
        settledMonthCount: bundle.monthlyStates.length,
      };
    }
  })();

  const pendingMonths = bundle.monthlyStates.filter(
    (state) => !monthlyReports.some((report) => report.year === state.year && report.month === state.month),
  );

  const growthEntries: TimelineEntry[] = bundle.monthlyStates
    .slice()
    .reverse()
    .map((state) => {
      if (!state.snapshot_json) {
        return {
          id: `${state.id}-growth`,
          periodLabel: formatMonthLabel(state.year, state.month),
          title: "这个月先留了一张空白卡片",
          message: "存档里还没把完整月记落下来，但这一段时间已经被记住了。",
          badge: "monthly",
          details: [],
        };
      }

      const entry = buildGrowthJournalEntry(state.snapshot_json, state.year, state.month);
      return {
        id: `${state.id}-growth`,
        periodLabel: entry.periodLabel,
        title: entry.title,
        message: entry.message,
        badge: entry.badge,
        details: buildTimelineTags(state.snapshot_json),
      };
    })
    .map(sanitizeTimelineEntry);

  const persistedLetters = (hydratedRun.monthlyLetters ?? [])
    .slice()
    .sort((left, right) => right.monthIndex - left.monthIndex);
  const latestPersistedLetter = persistedLetters[0] ?? null;

  const persistedTimelineEntries: TimelineEntry[] = (hydratedRun.timelineNodes ?? [])
    .slice()
    .sort((left, right) => right.monthIndex - left.monthIndex)
    .map((node) =>
      sanitizeTimelineEntry({
        id: node.id,
        periodLabel: formatPlayerFacingMonthIndex(node.monthIndex),
        title: node.title,
        message: node.body,
        badge: node.kind,
        details: node.facts,
      }),
    );

  const timelineEntries = persistedTimelineEntries.length > 0 ? persistedTimelineEntries : growthEntries;

  const latestState = bundle.monthlyStates.at(-1) ?? null;
  const latestReport = latestState
    ? monthlyReports.find((report) => report.year === latestState.year && report.month === latestState.month) ?? null
    : null;

  const latestDigest = latestState?.snapshot_json
    ? (() => {
        try {
          return buildMonthlyDiaryDigest(latestState.snapshot_json, latestState.year, latestState.month);
        } catch {
          return null;
        }
      })()
    : null;

  const latestRulesFallback = latestState?.snapshot_json
    ? (() => {
        try {
          return buildMonthlyJournalRulesFallback({
            kind: "monthly_journal",
            runId: bundle.run.id,
            year: latestState.year,
            month: latestState.month,
            summary: latestState.snapshot_json,
          });
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <FmShellLayout
      active="journal"
      runId={runId}
      title="本月来信"
      subtitle="这里不会展示后台字段或结算原文，而是把规则层事实整理成能回看的月记和时间线。"
      sidebarSummary="月记归档、成长节点和路线证据会在这里慢慢堆起来。即使 AI 月记缺失，页面也会退回规则层来信，不再因为单条数据失败而整页崩掉。"
      headerMeta={
        <>
          <FmInlineStat tone="teal" icon="book" label="月记归档" value={`${overview.monthlyJournalCount} 篇`} />
          <FmInlineStat tone="amber" icon="calendar" label="成长节点" value={`${overview.growthLogCount} 月`} />
          <FmInlineStat tone="cyan" icon="check" label="已结算月份" value={`${overview.settledMonthCount} 月`} />
        </>
      }
    >
      <div className="fm-grid-2">
        <ActiveRunSync runId={hydratedRun.id} snapshot={hydratedRun} />

        <div className="fm-journal-board">
          <FmMotionSection delay={40}>
            <FmPanel>
              <FmSectionHead
                title="本月来信"
                copy="像翻开手机备忘录那样，看看这个月到底是怎么一步一步熬过来的。"
                aside={latestDigest ? <FmBadge tone="ending">{latestDigest.monthLabel}</FmBadge> : undefined}
              />

              <div className="mt-6 fm-month-paper-scene">
                {latestReport && latestDigest ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <details className="fm-letter-shell">
                      <summary className="fm-letter-shell__summary">点击打开本月来信</summary>
                      <article className="fm-paper">
                        <div className="fm-paper__clip" aria-hidden="true" />
                        <div className="fm-paper__stats">
                          <span className="fm-paper__stat tone-teal">课业 {latestDigest.endState.feedback}</span>
                          <span className="fm-paper__stat tone-amber">手头 {formatQualitativeMoney(latestDigest.endState.money)}</span>
                          <span className="fm-paper__stat tone-rose">压力 {formatQualitativeStress(latestDigest.endState.stress)}</span>
                          <span className="fm-paper__stat tone-cyan">心情 {formatQualitativeMood(latestDigest.endState.mood)}</span>
                        </div>
                        <div className="fm-paper__date">{formatMonthLabel(latestReport.year, latestReport.month ?? 1)}</div>
                        <h2 className="fm-paper__title">本月记</h2>
                        <div className="fm-paper__copy fm-paper__copy--scroll">
                          {sanitizePlayerFacingText(latestReport.output_markdown)}
                        </div>
                        <div className="fm-paper__fade" aria-hidden="true" />
                        <div className="fm-paper__footer">
                          方向线索：{sanitizePlayerFacingText(latestDigest.directionSignal)}
                        </div>
                      </article>
                    </details>
                  </div>
                ) : latestRulesFallback && latestDigest ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <details className="fm-letter-shell">
                      <summary className="fm-letter-shell__summary">点击打开本月来信</summary>
                      <article className="fm-paper">
                        <div className="fm-paper__clip" aria-hidden="true" />
                        <div className="fm-paper__stats">
                          <span className="fm-paper__stat tone-teal">课业 {latestDigest.endState.feedback}</span>
                          <span className="fm-paper__stat tone-amber">手头 {formatQualitativeMoney(latestDigest.endState.money)}</span>
                          <span className="fm-paper__stat tone-rose">压力 {formatQualitativeStress(latestDigest.endState.stress)}</span>
                          <span className="fm-paper__stat tone-cyan">心情 {formatQualitativeMood(latestDigest.endState.mood)}</span>
                        </div>
                        <div className="fm-paper__date">{latestRulesFallback.monthLabel}</div>
                        <h2 className="fm-paper__title">{sanitizePlayerFacingText(latestRulesFallback.title)}</h2>
                        <div className="fm-paper__copy fm-paper__copy--scroll">
                          {latestRulesFallback.diary.split("\n\n").map((paragraph, index) => (
                            <p key={index}>{sanitizePlayerFacingText(paragraph)}</p>
                          ))}
                        </div>
                        <div className="fm-paper__fade" aria-hidden="true" />
                        <div className="fm-paper__footer">
                          {sanitizePlayerFacingText(latestRulesFallback.endStateLine)}
                        </div>
                      </article>
                    </details>
                  </div>
                ) : latestPersistedLetter ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <details className="fm-letter-shell">
                      <summary className="fm-letter-shell__summary">点击打开本月来信</summary>
                      <article className="fm-paper">
                        <div className="fm-paper__clip" aria-hidden="true" />
                        <div className="fm-paper__stats">
                          <span className="fm-paper__stat tone-cyan">存档来信</span>
                          <span className="fm-paper__stat tone-mint">
                            {formatPlayerFacingMonthIndex(latestPersistedLetter.monthIndex)}
                          </span>
                        </div>
                        <div className="fm-paper__date">
                          {formatPlayerFacingMonthIndex(latestPersistedLetter.monthIndex)}
                        </div>
                        <h2 className="fm-paper__title">
                          {sanitizePlayerFacingText(latestPersistedLetter.title)}
                        </h2>
                        <div className="fm-paper__copy fm-paper__copy--scroll">
                          <p>{sanitizePlayerFacingText(latestPersistedLetter.body)}</p>
                        </div>
                        <div className="fm-paper__fade" aria-hidden="true" />
                        <div className="fm-paper__footer">月记归档</div>
                      </article>
                    </details>
                  </div>
                ) : pendingMonths.length > 0 ? (
                  <div className="fm-paper-stack fm-paper-stack--fixed">
                    <article className="fm-paper">
                      <div className="fm-paper__clip" aria-hidden="true" />
                      <div className="fm-paper__stats">
                        <span className="fm-paper__stat tone-cyan">待整理 {pendingMonths.length} 月</span>
                        <span className="fm-paper__stat tone-mint">还在落档</span>
                      </div>
                      <div className="fm-paper__date">
                        {formatMonthLabel(pendingMonths.at(-1)!.year, pendingMonths.at(-1)!.month)}
                      </div>
                      <h2 className="fm-paper__title">这封月记还在路上</h2>
                      <div className="fm-paper__copy fm-paper__copy--scroll">
                        <FmLoadingState
                          title="AI 月记还没整理完"
                          body={`这些月份已经结算完成，但当前只保留了规则层事实：${pendingMonths
                            .map((state) => formatMonthLabel(state.year, state.month))
                            .join("、")}。`}
                        />
                      </div>
                    </article>
                  </div>
                ) : (
                  <FmEmptyState
                    title="还没有第一篇月记"
                    body="这次没有拿到可展示的月记内容，但存档本身还在。你可以先回到游戏继续推进，或者切到履历和结局页查看证据链。"
                  />
                )}
              </div>
            </FmPanel>
          </FmMotionSection>

          <FmMotionSection delay={110}>
            <FmPanel>
              <FmSectionHead
                title="月记归档"
                copy="已经落档的旧月份会收在这里，方便录屏时快速翻回去看。"
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
                        ? (() => {
                            try {
                              return buildMonthlyDiaryDigest(
                                matchingState.snapshot_json,
                                matchingState.year,
                                matchingState.month,
                              );
                            } catch {
                              return null;
                            }
                          })()
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
                            <FmBadge tone="neutral">月记归档</FmBadge>
                          </div>
                          <p className="fm-journal-card__copy">
                            {sanitizePlayerFacingText(
                              digest?.directionSignal ?? "这个月已经归档，但方向线索还没有单独摘出来。",
                            )}
                          </p>
                        </article>
                      );
                    })
                ) : (
                  <p className="fm-archive-note">再往后推进几个月，这里就会慢慢堆出完整归档。</p>
                )}
              </div>
            </FmPanel>
          </FmMotionSection>
        </div>

        <FmMotionSection delay={180}>
          <FmPanel>
            <FmSectionHead
              title="成长时间线"
              copy="这里只展示玩家能理解的节点名字，不会再把内部 key、字段名或调试标记直接露出来。"
            />

            <div className="mt-6">
              {timelineEntries.length > 0 ? (
                <div className="fm-timeline">
                  {timelineEntries.map((entry, index) => (
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
                            {index === 0 ? "当前节点" : entry.badge}
                          </FmBadge>
                        </div>
                        {entry.details.length > 0 ? (
                          <div className="fm-timeline-tags">
                            {entry.details.slice(0, 4).map((tag) => (
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
                  body="先完成几个月推进，时间线会把奖学金、竞赛、实习和路线节点慢慢补齐。"
                />
              )}
            </div>
          </FmPanel>
        </FmMotionSection>
      </div>
    </FmShellLayout>
  );
}

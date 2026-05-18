import { ActiveRunSync } from "@/components/active-run-sync";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import {
  FmIcon,
  FmInlineStat,
  FmPanel,
  FmSectionHead,
  FmShellLayout,
} from "@/components/fm-ui/FmScaffold";
import { resolveActiveRunId } from "@/lib/demo/active-run";
import { buildJournalOverview } from "@/lib/journal-overview";
import { buildMonthlyJournalRulesFallback } from "@/lib/ai/reports";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import { formatMonthLabel } from "@/lib/demo/options";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerJournalBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import { sanitizePlayerFacingText } from "@/lib/player-facing-text";

export const dynamic = "force-dynamic";

type JournalPageProps = {
  searchParams: DemoPageSearchParams;
};

function formatMoney(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
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
                body="这条线索还没有在你的大学生活中出现。没有存档的时候，这里会优先显示空状态，而不是直接报错。"
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
      ...buildGrowthJournalEntry(state.snapshot_json, state.year, state.month),
    }));

  const latestState = bundle.monthlyStates.at(-1) ?? null;
  const latestReport = latestState
    ? monthlyReports.find((report) => report.year === latestState.year && report.month === latestState.month) ?? null
    : null;
  const latestDigest = latestState
    ? buildMonthlyDiaryDigest(latestState.snapshot_json, latestState.year, latestState.month)
    : null;
  const latestRulesFallback = latestState
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
      sidebarSummary="已开放页面只展示真实月度状态、AI 月记归档与履历证据，不补写不存在的经历。"
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
        <div className="fm-stack">
          <FmPanel>
            <FmSectionHead
              title="本月月记"
              copy="月记只负责表达，不负责决定结果。它写的是已经发生过的真实月份。"
              aside={
                latestDigest ? (
                  <span className="fm-chip fm-chip--brand">{latestDigest.monthLabel}</span>
                ) : null
              }
            />

            <div className="mt-6 fm-month-paper-scene">
              {latestReport && latestDigest ? (
                <div className="fm-paper-stack">
                  <article className="fm-paper">
                    <div className="fm-paper__tape" />
                    <div className="fm-paper__stats">
                      <span className="fm-paper__stat tone-teal">学业 {latestDigest.endState.feedback}</span>
                      <span className="fm-paper__stat tone-amber">资金 {formatMoney(latestDigest.endState.money)}</span>
                      <span className="fm-paper__stat tone-rose">压力 {latestDigest.endState.stress}</span>
                    </div>
                    <div className="fm-paper__date">{formatMonthLabel(latestReport.year, latestReport.month ?? 1)}</div>
                    <h2 className="fm-paper__title">月记</h2>
                    <div className="fm-paper__copy">{sanitizePlayerFacingText(latestReport.output_markdown)}</div>
                    <div className="fm-paper__footer">
                      方向线索：{latestDigest.directionSignal}
                    </div>
                  </article>
                </div>
              ) : latestRulesFallback && latestDigest ? (
                <div className="fm-paper-stack">
                  <article className="fm-paper">
                    <div className="fm-paper__tape" />
                    <div className="fm-paper__stats">
                      <span className="fm-paper__stat tone-teal">学业 {latestDigest.endState.feedback}</span>
                      <span className="fm-paper__stat tone-amber">资金 {formatMoney(latestDigest.endState.money)}</span>
                      <span className="fm-paper__stat tone-rose">压力 {latestDigest.endState.stress}</span>
                    </div>
                    <div className="fm-paper__date">{latestRulesFallback.monthLabel}</div>
                    <h2 className="fm-paper__title">月记规则摘要</h2>
                    <div className="fm-paper__copy">
                      <p>{latestRulesFallback.intro}</p>
                      <ul className="mt-3 space-y-2">
                        {latestRulesFallback.sections.map((section) => (
                          <li key={section.label}>
                            <strong>{section.label}</strong>
                            {`：${section.text}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="fm-paper__footer">{latestRulesFallback.endStateLine}</div>
                  </article>
                </div>
              ) : pendingMonths.length > 0 ? (
                <FmPartialNotice
                  title="月记还在生成中"
                  body={`当前月份已经有真实结算，但 AI 月记还没落档：${pendingMonths
                    .map((state) => formatMonthLabel(state.year, state.month))
                    .join("、")}。`}
                />
              ) : (
                <FmEmptyState
                  title="还没有第一篇月记"
                  body="月记不会凭空生成。等完成至少一次月末结算后，这里才会出现第一篇真实归档。"
                />
              )}
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="月记归档"
              copy="旧月份保留为归档，不会用后来的信息回填早先不存在的内容。"
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
                          <span className="fm-chip">{report.model ?? "fallback"}</span>
                        </div>
                        <p className="fm-journal-card__copy">
                          {digest?.directionSignal ?? "当前月份已经留档，但方向线索尚未整理完成。"}
                        </p>
                      </article>
                    );
                  })
              ) : (
                <p className="fm-muted-note">第一篇真实月记出现之后，后续归档会继续在这里累积。</p>
              )}
            </div>
          </FmPanel>
        </div>

        <FmPanel>
          <FmSectionHead
            title="成长时间线"
            copy="这里会按时间线整理已经落地的月度变化，不会为了好看去补写不存在的经历。"
          />

          <div className="mt-6">
            {growthEntries.length > 0 ? (
              <div className="fm-timeline">
                {growthEntries.map((entry, index) => (
                  <article key={entry.id} className="fm-timeline-entry">
                    <div className={`fm-timeline-node ${index % 2 === 0 ? "tone-teal" : "tone-cyan"}`}>
                      <FmIcon name="book" className="h-4 w-4" />
                    </div>
                    <div className="fm-journal-card">
                      <div className="fm-journal-card__head">
                        <div>
                          <div className="fm-journal-card__month">{entry.periodLabel}</div>
                          <h3 className="fm-journal-card__title">{entry.title}</h3>
                        </div>
                        <span className="fm-chip">{entry.badge}</span>
                      </div>
                      <p className="fm-journal-card__copy">{entry.message}</p>
                      <div className="fm-journal-card__details">
                        {entry.details.map((detail) => (
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
      </div>
    </FmShellLayout>
  );
}

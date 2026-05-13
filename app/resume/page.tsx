import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import {
  FmIcon,
  FmInlineStat,
  FmPanel,
  FmSectionHead,
  FmShellLayout,
} from "@/components/fm-ui/FmScaffold";
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
import { formatCityTier, formatCollegeTrack, formatMonthLabel, formatSchoolTier } from "@/lib/demo/options";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type ResumePageProps = {
  searchParams: DemoPageSearchParams;
};

function hasKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function buildCoreAbilityTags(items: {
  competitionCount: number;
  internshipCount: number;
  scholarshipCount: number;
  directionLabel: string;
  gpa: number;
}) {
  const tags = [];

  if (items.gpa >= 3) {
    tags.push("学业积累");
  }
  if (items.competitionCount > 0) {
    tags.push("项目推进");
  }
  if (items.internshipCount > 0) {
    tags.push("实务经历");
  }
  if (items.scholarshipCount > 0) {
    tags.push("阶段回报");
  }
  if (items.directionLabel) {
    tags.push(items.directionLabel);
  }

  return [...new Set(tags)];
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmShellLayout
        active="resume"
        title="个人履历"
        subtitle="这里会把真实形成的 GPA、排名、履历条目和成长痕迹整理出来。没有数据时，只展示空状态，不会直接报错。"
        headerMeta={
          <>
            <FmInlineStat tone="teal" icon="chart" label="GPA" value="未形成" />
            <FmInlineStat tone="amber" icon="file" label="履历证据" value="0 条" />
          </>
        }
      >
        <FmPanel>
          <FmSectionHead
            title="个人履历"
            copy="只有规则层已经产出的履历证据才会出现，学校、排名和项目都不会被前端伪造。"
          />
          <div className="mt-6">
            <FmEmptyState
              title="还没有足够的履历证据"
              body="这条线索还没有在你的大学生活中出现。先回到首页创建一局，再从真实流程里慢慢积累。"
            />
          </div>
        </FmPanel>
      </FmShellLayout>
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

  const playerLogs = bundle.monthlyStates
    .slice()
    .reverse()
    .slice(0, 4)
    .map((state) => ({
      id: `${state.id}-growth`,
      ...buildGrowthJournalEntry(state.snapshot_json, state.year, state.month),
    }));

  const coreAbilityTags = buildCoreAbilityTags({
    competitionCount: competitionItems.length,
    internshipCount: internshipItems.length,
    scholarshipCount: scholarshipItems.length,
    directionLabel: directionPerception.primary.label,
    gpa: academicProfile.gpa,
  });

  return (
    <FmShellLayout
      active="resume"
      title="个人履历"
      subtitle="履历页只整理已经形成的证据，帮助你看清现在这局真实地在往哪条路上偏。"
      sidebarSummary="这里展示的是当前 run 的真实画像：GPA、履历条目、方向线索与阶段日志。"
      headerMeta={
        <>
          <FmInlineStat tone="teal" icon="chart" label="GPA" value={academicProfile.gpa.toFixed(2)} />
          <FmInlineStat
            tone="amber"
            icon="file"
            label="履历证据"
            value={`${resumeItems.length} 条`}
          />
          <FmInlineStat
            tone="cyan"
            icon="calendar"
            label="月度记录"
            value={`${bundle.monthlyStates.length} 月`}
          />
        </>
      }
    >
      <div className="fm-grid-2">
        <div className="fm-stack">
          <FmPanel padded={false}>
            <section className="fm-resume-head">
              <div className="fm-resume-name">个人履历</div>
              <div className="fm-resume-meta">
                <span>{formatCollegeTrack(hydratedRun.profile.collegeTrack)}</span>
                <span>·</span>
                <span>{formatSchoolTier(hydratedRun.profile.schoolTier)}</span>
                <span>·</span>
                <span>{formatCityTier(hydratedRun.profile.cityTier)}</span>
                <span>·</span>
                <span>Run #{hydratedRun.id.slice(0, 8)}</span>
              </div>

              <div className="fm-score-strip">
                <div className="fm-score-box">
                  <span className="fm-score-box__label">GPA</span>
                  <span className="fm-score-box__value">{academicProfile.gpa.toFixed(2)}</span>
                </div>
                <div className="fm-score-box">
                  <span className="fm-score-box__label">排名 / 百分位</span>
                  <span className="fm-score-box__value">
                    {academicProfile.rank ? `前 ${academicProfile.rank}` : "暂未形成"}
                    {academicProfile.percentile ? ` · ${academicProfile.percentile}%` : ""}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                {coreAbilityTags.length > 0 ? (
                  <div className="fm-tag-row">
                    {coreAbilityTags.map((tag) => (
                      <span key={tag} className="fm-tag">
                        <FmIcon name="check" className="h-4 w-4" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <FmPartialNotice
                    title="当前阶段尚未形成明确方向"
                    body="目前只展示已经落地的真实证据，核心能力标签还需要更多月度结果来支撑。"
                  />
                )}
              </div>
            </section>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="个人履历时间线"
              copy="履历条目按形成月份排列。没有的经历不会被前端补写进来。"
            />
            <div className="mt-6">
              {resumeItems.length > 0 ? (
                <div className="fm-resume-lines">
                  {resumeItems.map((item) => (
                    <article key={item.id} className="fm-resume-line">
                      <div className="fm-resume-line__icon">
                        <FmIcon name="file" className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="fm-resume-line__title">{item.title}</div>
                        <div className="fm-resume-line__body">{item.summary}</div>
                        {item.tags.length > 0 ? (
                          <div className="mt-4 fm-tag-row">
                            {item.tags.map((tag) => (
                              <span key={tag} className="fm-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="fm-resume-line__date">M{item.month}</div>
                    </article>
                  ))}
                </div>
              ) : (
                <FmEmptyState
                  title="还没有足够的履历证据"
                  body="比赛、项目、实习、奖学金和校内经历都必须先被规则层记录下来，这里才会出现。"
                />
              )}
            </div>
          </FmPanel>
        </div>

        <div className="fm-stack">
          <FmPanel>
            <FmSectionHead
              title="当前画像"
              copy="这不是结论书，只是把当前已有的真实信号翻译成你能看懂的阶段描述。"
              aside={<span className="fm-chip fm-chip--brand">{directionPerception.primary.label}</span>}
            />

            <div className="mt-6 fm-stat-grid">
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">履历概况</div>
                <div className="fm-stat-card__value">{resumeItems.length} 条</div>
                <div className="fm-stat-card__copy">{directionPerception.summary}</div>
              </article>
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">推免线索</div>
                <div className="fm-stat-card__value">{recommendationExplanation.summary}</div>
              </article>
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">公考线索</div>
                <div className="fm-stat-card__value">{publicExamExplanation.summary}</div>
              </article>
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="证据拆分"
              copy="三类证据都只来自当前 run 的真实累计，不从 PRD 或设计稿里借数据。"
            />

            <div className="mt-6 fm-stack">
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">学业积累</div>
                <div className="fm-stat-card__copy">{resumeEvidence.academic.join(" ")}</div>
              </article>
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">履历积累</div>
                <div className="fm-stat-card__copy">{resumeEvidence.practice.join(" ")}</div>
              </article>
              <article className="fm-stat-card">
                <div className="fm-stat-card__label">机会线索</div>
                <div className="fm-stat-card__copy">{resumeEvidence.opportunities.join(" ")}</div>
              </article>
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead
              title="阶段日志"
              copy="最近几个月的成长记录会在这里给履历做旁证。"
            />
            <div className="mt-6">
              {playerLogs.length > 0 ? (
                <div className="fm-timeline">
                  {playerLogs.map((log, index) => (
                    <article key={log.id} className="fm-timeline-entry">
                      <div className={`fm-timeline-node ${index % 2 === 0 ? "tone-teal" : "tone-mint"}`}>
                        <FmIcon name="book" className="h-4 w-4" />
                      </div>
                      <div className="fm-journal-card">
                        <div className="fm-journal-card__head">
                          <div>
                            <div className="fm-journal-card__month">{log.periodLabel}</div>
                            <h3 className="fm-journal-card__title">{log.title}</h3>
                          </div>
                          <span className="fm-chip">{formatMonthLabel(bundle.run.currentYear, bundle.run.currentMonth)}</span>
                        </div>
                        <p className="fm-journal-card__copy">{log.message}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <FmEmptyState
                  title="当前还没有月度日志"
                  body="先把真实流程推进到月末，这里才会出现能给履历作证的阶段记录。"
                />
              )}
            </div>
          </FmPanel>

          <FmPanel>
            <FmSectionHead title="方向线索" copy="这些线索只反映当前 run 已有的倾向，不预示最终结果。" />
            <div className="mt-6">
              {directionSignals.length > 0 ? (
                <div className="fm-tag-row">
                  {directionSignals.map((signal) => (
                    <span key={signal} className="fm-tag">
                      {signal}
                    </span>
                  ))}
                </div>
              ) : (
                <FmPartialNotice
                  title="当前阶段尚未形成明确方向"
                  body="目前还没有足够的学业与履历证据去支撑更明确的路径判断。"
                />
              )}
            </div>
          </FmPanel>
        </div>
      </div>
    </FmShellLayout>
  );
}

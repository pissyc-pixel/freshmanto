import { ActiveRunSync } from "@/components/active-run-sync";
import { FormalArtifactCards } from "@/components/formal-artifacts";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import { FmMotionSection } from "@/components/fm-ui/FmMotionSection";
import { ProfileSummary } from "@/components/profile-summary";
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
} from "@/core/resolvers/progression";
import { resolveActiveRunId } from "@/lib/demo/active-run";
import { buildResumeFormalArtifacts } from "@/lib/demo/formal-artifacts";
import { normalizeSaveState } from "@/lib/demo/save-state";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { getServerResumeBundle } from "@/lib/demo/server";
import {
  formatPlayerFacingMonthIndex,
  sanitizePlayerFacingText,
  sanitizePlayerFacingTextList,
} from "@/lib/player-facing-text";

export const dynamic = "force-dynamic";

type ResumePageProps = {
  searchParams: DemoPageSearchParams;
};

function formatAcademicValue(value: number | null) {
  return value === null ? "暂无 GPA" : value.toFixed(2);
}

export function formatRankPercentile(rank: number | null, percentile: number | null) {
  if (rank === null || percentile === null) {
    return "暂无排名 / 百分比";
  }

  return `前 ${rank} · ${percentile}%`;
}

function hasKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function buildCoreAbilityTags(items: {
  competitionCount: number;
  internshipCount: number;
  scholarshipCount: number;
  directionLabel: string;
  gpa: number | null;
}) {
  const tags = [];

  if (items.gpa !== null && items.gpa >= 3) {
    tags.push("学业积累");
  }
  if (items.competitionCount > 0) {
    tags.push("项目推进");
  }
  if (items.internshipCount > 0) {
    tags.push("实践经历");
  }
  if (items.scholarshipCount > 0) {
    tags.push("阶段回报");
  }
  if (items.directionLabel) {
    tags.push(items.directionLabel);
  }

  return [...new Set(tags)];
}

function countProjects(items: Array<{ category: string; tags: string[] }>) {
  return items.filter(
    (item) =>
      item.category === "competition" ||
      item.category === "project" ||
      item.tags.some((tag) => hasKeyword(tag, ["项目", "比赛", "竞赛"])),
  ).length;
}

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const bundle = runId ? await getServerResumeBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmShellLayout
        active="resume"
        runId={runId}
        title="履历档案"
        subtitle="这里记录能慢慢写进简历和未来选择里的东西。没有数据时，只展示空状态，不会直接报错。"
        headerMeta={
          <>
            <FmInlineStat tone="teal" icon="chart" label="GPA" value="暂无 GPA" />
            <FmInlineStat tone="amber" icon="file" label="履历证据" value="0 条" />
          </>
        }
      >
        <FmPanel>
          <FmSectionHead
            title="个人履历"
            copy="这里会慢慢长成你的履历档案。学校、排名、奖项和项目只会读取真实存档，不会被前端伪造。"
          />
          <div className="mt-6">
            <FmEmptyState
              title="还没有足够的履历证据"
              body="这条线索还没在你的大学生活里出现。先回到首页创建一局，再从真实流程里慢慢积累。"
            />
          </div>
        </FmPanel>
      </FmShellLayout>
    );
  }

  const hydratedRun = ensureProgressionState(normalizeSaveState(bundle.run));
  const academicProfile = deriveAcademicProfile(hydratedRun);
  const directionPerception = buildDirectionPerception(hydratedRun);
  const recommendationExplanation = buildRecommendationExplanation(hydratedRun);
  const publicExamExplanation = buildPublicExamExplanation(hydratedRun);
  const resumeEvidence = buildResumeEvidenceSummary(hydratedRun);

  const resumeItems = bundle.resumeItems.map((item) => ({
    id: item.id,
    category: item.category,
    title: sanitizePlayerFacingText(item.title),
    summary: sanitizePlayerFacingText(item.summary),
    month: item.month,
    tags: Array.isArray(item.metadata_json?.tags)
      ? sanitizePlayerFacingTextList(
          item.metadata_json.tags.filter((tag): tag is string => typeof tag === "string"),
        )
      : [],
  }));

  const competitionItems = resumeItems.filter(
    (item) => hasKeyword(item.title, ["比赛", "竞赛"]) || item.tags.some((tag) => hasKeyword(tag, ["比赛", "竞赛"])),
  );
  const internshipItems = resumeItems.filter(
    (item) =>
      item.category === "internship" ||
      hasKeyword(item.title, ["实习"]) ||
      hasKeyword(item.summary, ["实习", "实践"]),
  );
  const scholarshipItems = resumeItems.filter(
    (item) =>
      hasKeyword(item.title.toLowerCase(), ["奖学金", "scholarship"]) ||
      item.tags.some((tag) => hasKeyword(tag.toLowerCase(), ["奖学金", "scholarship"])),
  );

  const runForFormalArtifacts = {
    ...hydratedRun,
    resume: resumeItems,
  };

  const coreAbilityTags = buildCoreAbilityTags({
    competitionCount: competitionItems.length,
    internshipCount: internshipItems.length,
    scholarshipCount: scholarshipItems.length,
    directionLabel: directionPerception.primary.label,
    gpa: academicProfile.gpa,
  });
  const projectCount = countProjects(resumeItems);
  const formalArtifacts = buildResumeFormalArtifacts(runForFormalArtifacts);

  return (
    <FmShellLayout
      active="resume"
      runId={runId}
      title="履历档案"
      subtitle="这里放着这几年慢慢攒下来的东西。"
      headerMeta={
        <>
          <FmInlineStat tone="teal" icon="chart" label="GPA" value={formatAcademicValue(academicProfile.gpa)} />
          <FmInlineStat tone="amber" icon="file" label="履历证据" value={`${resumeItems.length} 条`} />
          <FmInlineStat tone="cyan" icon="calendar" label="月度记录" value={`${bundle.monthlyStates.length} 月`} />
        </>
      }
    >
      <div className="fm-grid-2">
        <ActiveRunSync runId={bundle.run.id} snapshot={hydratedRun} />

        <div className="fm-stack">
          <FmMotionSection delay={40}>
            <FmPanel>
              <FmSectionHead title="履历档案" />
              <div className="mt-6 fm-resume-kpis">
                <article className="fm-resume-kpi">
                  <div className="fm-resume-kpi__label">GPA</div>
                  <div className="fm-resume-kpi__value">{formatAcademicValue(academicProfile.gpa)}</div>
                </article>
                <article className="fm-resume-kpi">
                  <div className="fm-resume-kpi__label">排名 / 百分比</div>
                  <div className="fm-resume-kpi__value">
                    {academicProfile.percentile === null
                      ? academicProfile.rank === null
                        ? "当前排名暂未结算"
                        : `当前排名第 ${academicProfile.rank} 名`
                      : academicProfile.percentile <= 5
                        ? `专业前 ${academicProfile.percentile}%`
                        : `排名约前 ${academicProfile.percentile}%`}
                  </div>
                </article>
                <article className="fm-resume-kpi">
                  <div className="fm-resume-kpi__label">奖学金</div>
                  <div className="fm-resume-kpi__value">{scholarshipItems.length}</div>
                </article>
                <article className="fm-resume-kpi">
                  <div className="fm-resume-kpi__label">比赛 / 项目</div>
                  <div className="fm-resume-kpi__value">{projectCount}</div>
                </article>
                <article className="fm-resume-kpi">
                  <div className="fm-resume-kpi__label">实习 / 实践</div>
                  <div className="fm-resume-kpi__value">{internshipItems.length}</div>
                </article>
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
            </FmPanel>
          </FmMotionSection>

          <FmMotionSection delay={100}>
            <FmPanel>
              <FmSectionHead title="基础画像 / 入学档案" />
              <div className="mt-6">
                <ProfileSummary profile={hydratedRun.profile} />
              </div>
            </FmPanel>
          </FmMotionSection>

          {formalArtifacts.length > 0 ? (
            <FmMotionSection delay={130}>
              <FmPanel>
                <FmSectionHead
                  title="正式成果档案"
                  copy="奖学金、竞赛评奖、实习机会和推免资格这些已经写进存档事实的结果，会先在这里被归档。"
                  aside={<FmBadge tone="ending">真实结果</FmBadge>}
                />
                <div className="mt-6">
                  <FormalArtifactCards artifacts={formalArtifacts} runId={runId} showOfferActions />
                </div>
              </FmPanel>
            </FmMotionSection>
          ) : null}

          <FmMotionSection delay={160}>
            <FmPanel>
              <FmSectionHead
                title="证据板"
                copy="这里先收你已经留下的项目、比赛、实习和经历。没有发生过的内容，不会为了好看硬补出来。"
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
                        <div className="fm-resume-line__date">{formatPlayerFacingMonthIndex(item.month)}</div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <FmEmptyState
                    title="还没有能写进履历的经历"
                    body="这里还没有能写进履历的经历。后面参加比赛、项目、实习后会慢慢出现。"
                  />
                )}
              </div>
            </FmPanel>
          </FmMotionSection>
        </div>

        <div className="fm-stack">
          <FmMotionSection delay={70}>
            <FmPanel>
              <FmSectionHead
                title="为什么你正在接近某条路"
                aside={<FmBadge tone="ending">{directionPerception.primary.label}</FmBadge>}
              />

              <div className="mt-6 fm-evidence-list">
                <div className="fm-evidence-row">
                  <div className="fm-evidence-row__title">推免</div>
                  <div className="fm-evidence-row__copy">
                    当前倾向：{recommendationExplanation.summary} 支撑证据：
                    {recommendationExplanation.strengths.join(" ") || "学业和综合画像还在积累。"} 缺口：
                    {recommendationExplanation.gaps.join(" ") || "当前没有明显缺口暴露出来。"}
                  </div>
                  <FmBadge tone="academic">
                    {directionPerception.primary.key === "recommendation" ? "当前更靠近" : "仍在观察"}
                  </FmBadge>
                </div>

                <div className="fm-evidence-row">
                  <div className="fm-evidence-row__title">就业</div>
                  <div className="fm-evidence-row__copy">
                    当前倾向：
                    {directionPerception.primary.key === "employment"
                      ? "方向已经明显在向就业靠。"
                      : "就业线还在慢慢形成。"}
                    支撑证据：{resumeEvidence.practice.join(" ")} 缺口：
                    {internshipItems.length > 0
                      ? "实践已经起步，但高质量履历还可以继续补。"
                      : "实践经历还少，就业竞争力暂时偏薄。"}
                  </div>
                  <FmBadge tone="resume">
                    {directionPerception.primary.key === "employment" ? "当前更靠近" : "需要积累"}
                  </FmBadge>
                </div>

                <div className="fm-evidence-row">
                  <div className="fm-evidence-row__title">考研</div>
                  <div className="fm-evidence-row__copy">
                    当前倾向：
                    {directionPerception.primary.key === "postgraduate"
                      ? "学习节奏已经在往考研这条路收拢。"
                      : "考研线还没完全定型。"}
                    支撑证据：{directionPerception.reasons.join(" ") || directionPerception.summary} 缺口：
                    {directionPerception.blockers.join(" ") || "还需要更持续的投入，才会更像稳定备考。"}
                  </div>
                  <FmBadge tone="ending">
                    {directionPerception.primary.key === "postgraduate" ? "正在形成" : "暂未坐实"}
                  </FmBadge>
                </div>

                <div className="fm-evidence-row">
                  <div className="fm-evidence-row__title">考公</div>
                  <div className="fm-evidence-row__copy">
                    当前倾向：{publicExamExplanation.summary} 支撑证据：
                    {publicExamExplanation.signals.join(" ")} 缺口：
                    {publicExamExplanation.progress >= 25
                      ? "已经不是空想，但后面仍要看能不能把准备坚持下去。"
                      : "目前还在起步阶段，更多是方向线索，不是稳定路线。"}
                  </div>
                  <FmBadge tone={publicExamExplanation.progress >= 25 ? "event" : "warning"}>
                    {publicExamExplanation.progress >= 25 ? "已起步" : "较早期"}
                  </FmBadge>
                </div>
              </div>
            </FmPanel>
          </FmMotionSection>

          <FmMotionSection delay={140}>
            <FmPanel>
              <FmSectionHead
                title="履历证据拆分"
                copy="把学业、实践和机会线索拆开看，会更容易明白这份档案为什么长成现在这样。"
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
          </FmMotionSection>
        </div>
      </div>
    </FmShellLayout>
  );
}

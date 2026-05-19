import { ActiveRunSync } from "@/components/active-run-sync";
import { FormalDocumentPreview } from "@/components/formal-artifacts";
import { FmBadge } from "@/components/fm-ui/FmBadge";
import { FmCard } from "@/components/fm-ui/FmCard";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmMotionSection } from "@/components/fm-ui/FmMotionSection";
import {
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
import { buildEndingFormalArtifact } from "@/lib/demo/formal-artifacts";
import {
  formatCityTier,
  formatCollegeTrack,
  formatGraduationOutcome,
  formatMonthLabel,
  formatSchoolTier,
} from "@/lib/demo/options";
import { formatPlayerFacingMonthIndex, sanitizePlayerFacingText } from "@/lib/player-facing-text";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";
import { normalizeSaveState } from "@/lib/demo/save-state";
import { getServerEndingPreview } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";
import type { GameRun } from "@/types/game";

export const dynamic = "force-dynamic";

type EndingPageProps = {
  searchParams: DemoPageSearchParams;
};

type EvidenceChip = {
  text: string;
  tone: "academic" | "money" | "mood" | "stress" | "resume" | "event" | "ending" | "warning" | "danger";
};

type EvidenceRow = {
  title: string;
  body: string;
  status: string;
  tone: EvidenceChip["tone"];
};

function coerceRunForEnding(run: Partial<GameRun>): GameRun {
  return {
    id: run.id ?? "ending-preview",
    status: run.status ?? "active",
    currentYear: run.currentYear ?? 1,
    currentMonth: run.currentMonth ?? 1,
    currentSemester: run.currentSemester ?? 1,
    profile: {
      name: run.profile?.name,
      talents: run.profile?.talents ?? [],
      familyBackground: run.profile?.familyBackground ?? "ordinary",
      monthlyAllowance: run.profile?.monthlyAllowance ?? 1500,
      luck: run.profile?.luck ?? 50,
      collegeTrack: run.profile?.collegeTrack ?? "engineering",
      schoolTier: run.profile?.schoolTier ?? "985",
      cityTier: run.profile?.cityTier ?? "tier_1",
    },
    stats: {
      money: run.stats?.money ?? 0,
      mood: run.stats?.mood ?? 50,
      stress: run.stats?.stress ?? 50,
      fulfillment: run.stats?.fulfillment ?? 40,
      social: run.stats?.social ?? 30,
      semesterAcademics: run.stats?.semesterAcademics ?? 40,
    },
    semesterAverage: run.semesterAverage ?? 0,
    resume: run.resume ?? [],
    logLineIds: run.logLineIds ?? [],
    monthlySummaries: run.monthlySummaries ?? [],
    semesters: run.semesters ?? [],
    cooldowns: run.cooldowns ?? { askFamilyMonths: 0 },
    risk: run.risk ?? { academicRisk: 0, burnout: 0 },
    riskFlags: run.riskFlags ?? [],
    activeMonth: run.activeMonth,
    progression: run.progression,
    competitionProjects: run.competitionProjects ?? [],
    scholarships: run.scholarships ?? [],
    internshipRecords: run.internshipRecords ?? [],
    futureOffers: run.futureOffers ?? [],
    acceptedOffer: run.acceptedOffer ?? null,
    timelineNodes: run.timelineNodes ?? [],
    monthlyLetters: run.monthlyLetters ?? [],
    endingEvidence: run.endingEvidence ?? [],
  };
}

function formatDirectionLabel(direction?: string) {
  switch (direction) {
    case "employment":
      return "就业";
    case "recommendation":
      return "推免 / 保研";
    case "postgraduate":
    case "postgraduate_exam":
      return "考研";
    case "public_exam":
      return "考公";
    default:
      return "未定";
  }
}

function formatDominantDirectionLabel(direction?: string) {
  if (direction === "public_exam") {
    return "公考";
  }

  return formatDirectionLabel(direction);
}

function formatPathResultLabel(result?: string) {
  switch (result) {
    case "success":
      return "成功落地";
    case "ordinary":
      return "普通完成";
    case "failure":
      return "结果不太理想";
    case "pivot":
      return "中途转向";
    default:
      return "结果细分还在生成中";
  }
}

function formatRecommendationQualificationLabel(status?: string) {
  switch (status) {
    case "pending":
      return "还在积累阶段";
    case "eligible":
      return "已具备推免竞争力";
    case "borderline":
      return "已经摸到推免边缘";
    case "unlikely":
      return "离推免线还有距离";
    case "accepted":
      return "推免已经落定";
    case "declined_to_postgraduate":
      return "放下推免，转向考研";
    case "declined_to_employment":
      return "放下推免，转向就业";
    default:
      return "还没有明确结论";
  }
}

function parseFactCount(facts: string[], prefix: string) {
  const raw = facts.find((fact) => fact.startsWith(prefix));
  const value = Number(raw?.split(":")[1] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function buildPreviewRisk(input: {
  outcome: string;
  academicRisk: number;
  stress: number;
  failedSemesterCount: number;
}) {
  if (input.outcome === "cannot_graduate" || input.outcome === "drop_out" || input.failedSemesterCount >= 5) {
    return {
      label: "高风险",
      tone: "danger" as const,
      body: "现在看起来，毕业这件事已经有点吃力了。",
    };
  }

  if (input.outcome === "delayed" || input.academicRisk >= 60 || input.stress >= 75 || input.failedSemesterCount >= 2) {
    return {
      label: "有风险",
      tone: "warning" as const,
      body: "现在最需要盯住的是学业稳定度和后期压力，不然后面的毕业节奏会被拖慢。",
    };
  }

  return {
    label: "正常",
    tone: "academic" as const,
    body: "目前还看不到明显的毕业风险，后面的关键是把节奏继续稳住。",
  };
}

function buildEvidenceChips(input: {
  gpa: number | null;
  longTermAcademicAverage: number;
  money: number;
  mood: number;
  stress: number;
  social: number;
  resumeCount: number;
  directionLabel: string;
}) {
  const chips: EvidenceChip[] = [];

  if (input.gpa !== null && input.gpa >= 3.4) {
    chips.push({ text: `GPA 约 ${input.gpa}，学业基础比较稳`, tone: "academic" });
  } else if (input.longTermAcademicAverage >= 75) {
    chips.push({ text: "长期学业均值比较稳", tone: "academic" });
  } else {
    chips.push({ text: "学业基础还需要继续往上抬", tone: "warning" });
  }

  if (input.stress >= 75) {
    chips.push({ text: "压力偏高", tone: "danger" });
  } else if (input.mood <= 40) {
    chips.push({ text: "状态有点低", tone: "warning" });
  }

  if (input.money <= 250) {
    chips.push({ text: "现金有点紧", tone: "money" });
  }

  if (input.resumeCount === 0) {
    chips.push({ text: "履历经历还少", tone: "resume" });
  } else if (input.resumeCount >= 3) {
    chips.push({ text: "已经开始留下履历证据", tone: "resume" });
  }

  if (input.social >= 55) {
    chips.push({ text: "社交更活跃", tone: "event" });
  }

  if (input.directionLabel !== "未定") {
    chips.push({ text: `方向更靠近${input.directionLabel}`, tone: "ending" });
  }

  return chips.slice(0, 5);
}

function buildEvidenceRows(input: {
  gpa: number | null;
  longTermAcademicAverage: number;
  resumeCount: number;
  money: number;
  mood: number;
  stress: number;
  directionSummary: string;
  directionLabel: string;
  pathLabel: string;
  pathResultLabel: string;
  recommendationSummary: string;
  publicExamSummary: string;
  academicEvidence: string[];
  practiceEvidence: string[];
  opportunityEvidence: string[];
  failedSemesterCount: number;
  riskFlagCount: number;
}) {
  const academicBody =
    input.gpa !== null
      ? `最终 GPA 大约在 ${input.gpa} 左右，长期学业均值 ${input.longTermAcademicAverage}。${input.academicEvidence[0] ?? ""}`
      : `长期学业均值 ${input.longTermAcademicAverage}。${input.academicEvidence[0] ?? "正式 GPA 还没有完全结算出来。"}`
          .trim();

  const resumeBody =
    input.resumeCount > 0
      ? `四年里累计留下了 ${input.resumeCount} 条履历证据。${input.practiceEvidence.join(" ")}`
      : "这四年还没有积累出太多能直接写进履历的经历，所以后期选择会更保守。";

  const pressureTone =
    input.stress >= 75 || input.mood <= 35 ? "danger" : input.stress >= 60 || input.mood <= 45 ? "warning" : "mood";
  const pressureStatus =
    pressureTone === "danger" ? "后期偏紧" : pressureTone === "warning" ? "需要缓冲" : "基本稳住";
  const moneyTone = input.money <= 200 ? "danger" : input.money <= 450 ? "warning" : "money";
  const moneyStatus = moneyTone === "danger" ? "现金吃紧" : moneyTone === "warning" ? "偏谨慎" : "还能周转";
  const directionStatus = input.directionLabel === "未定" ? "仍偏未定" : input.pathResultLabel;
  const keyEventBody =
    input.failedSemesterCount > 0 || input.riskFlagCount > 0
      ? `这局里累计出现了 ${input.failedSemesterCount} 次未通过学期、${input.riskFlagCount} 个长期风险标签，它们会真实影响结局稳定度。`
      : input.opportunityEvidence.join(" ") || "这一局没有特别戏剧化的单点事件，更多是长期选择慢慢把结果推出来。";

  return [
    {
      title: "时间投入",
      body: input.directionSummary,
      status: input.directionLabel === "未定" ? "仍在形成" : "慢慢聚拢",
      tone: input.directionLabel === "未定" ? "warning" : "ending",
    },
    {
      title: "学业结果",
      body: academicBody,
      status: input.longTermAcademicAverage >= 75 ? "基础较稳" : "还有波动",
      tone: input.longTermAcademicAverage >= 75 ? "academic" : "warning",
    },
    {
      title: "履历积累",
      body: resumeBody,
      status: input.resumeCount > 0 ? "已经起步" : "还偏少",
      tone: input.resumeCount > 0 ? "resume" : "warning",
    },
    {
      title: "压力 / 心情",
      body: `毕业节点时心情 ${input.mood}、压力 ${input.stress}。这会直接影响你后期能不能稳住执行。`,
      status: pressureStatus,
      tone: pressureTone,
    },
    {
      title: "金钱状况",
      body: `毕业节点时手头余额 ${input.money} 元。${input.opportunityEvidence[1] ?? "钱会影响你能不能更从容地做选择。"}`
          .trim(),
      status: moneyStatus,
      tone: moneyTone,
    },
    {
      title: "方向倾向",
      body: `这四年把你慢慢推向了“${input.pathLabel}”。${input.recommendationSummary} ${input.publicExamSummary}`.trim(),
      status: directionStatus,
      tone: "ending",
    },
    {
      title: "关键事件",
      body: keyEventBody,
      status: input.failedSemesterCount > 0 || input.riskFlagCount > 0 ? "留下痕迹" : "以长期积累为主",
      tone: input.failedSemesterCount > 0 || input.riskFlagCount > 0 ? "warning" : "event",
    },
  ] satisfies EvidenceRow[];
}

function buildFallbackLetter(input: {
  outcomeLabel: string;
  pathLabel: string;
  pathResultLabel: string;
  evidenceChips: EvidenceChip[];
  money: number;
  mood: number;
  stress: number;
}) {
  const chipSummary = input.evidenceChips.map((item) => item.text).slice(0, 3).join("，");

  return [
    `四年走到这里，你最后留下的是“${input.outcomeLabel}”，更靠近的方向是“${input.pathLabel}”，结果层落在“${input.pathResultLabel}”。`,
    chipSummary.length > 0
      ? `回头看，这个结局不是突然掉下来的。更明显的线索一直都在：${chipSummary}。`
      : "回头看，这个结局更像是四年里很多小选择慢慢叠出来的结果。",
    `毕业节点时，你手头还有 ${input.money} 元，心情 ${input.mood}，压力 ${input.stress}。这些现实状态，和前面的投入一起，把你推到了现在的位置。`,
  ].join("\n\n");
}

export default async function EndingPage({ searchParams }: EndingPageProps) {
  const params = await searchParams;
  const runId = resolveActiveRunId({
    searchParamRunId: readSearchParam(params.runId),
    cookieRunId: await readActiveRunIdFromCookies(),
  });
  const bundle = runId ? await getServerEndingPreview(runId) : null;

  if (!runId || !bundle) {
    return (
      <FmShellLayout
        active="ending"
        runId={runId}
        title="结局预览"
        subtitle="这里会把当前已经形成的走向整理成预览。没有存档时，不会凭空生成结局。"
        headerMeta={<FmInlineStat tone="teal" icon="chart" label="现在进度" value="尚未开始" />}
      >
        <FmPanel>
          <FmSectionHead
            title="还没有可查看的结局"
            copy="先创建一局并把月份往前推进，未来线索才会慢慢长出来。"
          />
          <div className="mt-6">
            <FmEmptyState
              title="结局页会在后面等你"
              body="先进入游戏推进周安排、月结算和成长记录。等积累出真实选择之后，这里才会变成一份能回头看的报告。"
            />
          </div>
        </FmPanel>
      </FmShellLayout>
    );
  }

  const run = ensureProgressionState(normalizeSaveState(coerceRunForEnding(bundle.run)));
  const completed = run.status === "completed";
  const academicProfile = deriveAcademicProfile(run);
  const directionPerception = buildDirectionPerception(run);
  const recommendationExplanation = buildRecommendationExplanation(run);
  const publicExamExplanation = buildPublicExamExplanation(run);
  const resumeEvidence = buildResumeEvidenceSummary(run);
  const outcomeLabel = formatGraduationOutcome(bundle.endingSummary.outcome);
  const pathLabel = formatDirectionLabel(bundle.endingSummary.graduationPath);
  const directionLabel = formatDirectionLabel(bundle.endingSummary.dominantDirection);
  const dominantDirectionLabel = formatDominantDirectionLabel(bundle.endingSummary.dominantDirection);
  const pathResultLabel = formatPathResultLabel(bundle.endingSummary.pathResult);
  const failedSemesterCount = parseFactCount(bundle.endingSummary.notableFacts, "failed-semesters:");
  const riskFlagCount = parseFactCount(bundle.endingSummary.notableFacts, "risk-flags:");
  const previewRisk = buildPreviewRisk({
    outcome: bundle.endingSummary.outcome,
    academicRisk: run.risk?.academicRisk ?? 0,
    stress: run.stats?.stress ?? 0,
    failedSemesterCount,
  });
  const evidenceChips = buildEvidenceChips({
    gpa: academicProfile.gpa,
    longTermAcademicAverage: bundle.endingSummary.longTermAcademicAverage,
    money: run.stats?.money ?? 0,
    mood: run.stats?.mood ?? 0,
    stress: run.stats?.stress ?? 0,
    social: run.stats?.social ?? 0,
    resumeCount: run.resume?.length ?? 0,
    directionLabel,
  });
  const evidenceRows = buildEvidenceRows({
    gpa: academicProfile.gpa,
    longTermAcademicAverage: bundle.endingSummary.longTermAcademicAverage,
    resumeCount: run.resume?.length ?? 0,
    money: run.stats?.money ?? 0,
    mood: run.stats?.mood ?? 0,
    stress: run.stats?.stress ?? 0,
    directionSummary: directionPerception.summary,
    directionLabel,
    pathLabel,
    pathResultLabel,
    recommendationSummary: recommendationExplanation.summary,
    publicExamSummary: publicExamExplanation.summary,
    academicEvidence: resumeEvidence.academic,
    practiceEvidence: resumeEvidence.practice,
    opportunityEvidence: resumeEvidence.opportunities,
    failedSemesterCount,
    riskFlagCount,
  });
  const savedEndingEvidence = (run.endingEvidence ?? [])
    .slice()
    .sort((left, right) => left.monthIndex - right.monthIndex);
  const letterBody = bundle.savedEndingReport?.output_markdown
    ? sanitizePlayerFacingText(bundle.savedEndingReport.output_markdown)
    : buildFallbackLetter({
        outcomeLabel,
        pathLabel,
        pathResultLabel,
        evidenceChips,
        money: run.stats?.money ?? 0,
        mood: run.stats?.mood ?? 0,
        stress: run.stats?.stress ?? 0,
      });
  const positionLabel = completed
    ? formatMonthLabel(bundle.endingSummary.finalYear, 12)
    : formatMonthLabel(Math.min(run.currentYear, 4), Math.min(run.currentMonth, 12));
  const endingFormalArtifact = completed ? buildEndingFormalArtifact(run, bundle.endingSummary) : null;

  return (
    <FmShellLayout
      active="ending"
      runId={runId}
      title={completed ? "最终结局报告" : "结局预览"}
      subtitle={
        completed
          ? "这里收着你四年里一步步走出来的结果。"
          : "未来还没写完，但轮廓已经慢慢显出来了。"
      }
      sidebarSummary="毕业结果、去向和一路留下的证据，都会在这里回头看。"
      headerMeta={
        <>
          <FmInlineStat
            tone="teal"
            icon="calendar"
            label="当前节点"
            value={completed ? formatMonthLabel(bundle.endingSummary.finalYear, 12) : formatMonthLabel(Math.min(run.currentYear, 4), Math.min(run.currentMonth, 12))}
          />
          <FmInlineStat
            tone="cyan"
            icon="book"
            label="GPA"
            value={academicProfile.gpa === null ? "暂未结算" : academicProfile.gpa.toFixed(2)}
          />
          <FmInlineStat tone="amber" icon="chart" label="当前主方向" value={directionLabel} />
        </>
      }
    >
      <div className="fm-stack">
        <ActiveRunSync runId={bundle.run.id} snapshot={run} />

        {!completed ? (
          <>
            <FmMotionSection delay={0}>
              <section className="fm-ending-cover">
                <div className="fm-ending-cover__eyebrow">未来预览</div>
                <h1 className="fm-ending-cover__title">未来还没有写完</h1>
                <p className="fm-ending-cover__subtitle">
                  现在只能看到一点轮廓，最后会走到哪，还得看后面的日子怎么过。
                </p>
                <p className="fm-ending-cover__subtitle">当前学年位置：{positionLabel}</p>
                <div className="fm-ending-cover__meta">
                  <FmBadge tone="ending">{formatSchoolTier(run.profile.schoolTier)}</FmBadge>
                  <FmBadge tone="event">{formatCollegeTrack(run.profile.collegeTrack)}</FmBadge>
                  <FmBadge tone="neutral">{formatCityTier(run.profile.cityTier)}</FmBadge>
                </div>
              </section>
            </FmMotionSection>

            <div className="fm-ending-grid">
              <FmMotionSection delay={120}>
                <FmCard variant={previewRisk.tone === "danger" ? "danger" : previewRisk.tone === "warning" ? "warning" : "completed"}>
                  <FmSectionHead title="当前毕业风险" copy={previewRisk.body} />
                  <div className="mt-6">
                    <div className="fm-ending-result">
                      <div className="fm-ending-result__value">{previewRisk.label}</div>
                      <div className="fm-ending-result__copy">
                        这只是眼下看起来的样子，不是最后一句话。
                      </div>
                    </div>
                  </div>
                </FmCard>
              </FmMotionSection>

              <FmMotionSection delay={220}>
                <FmCard variant="active">
                  <FmSectionHead title="当前主方向" copy="这里展示的是倾向，不是提前替你把人生盖棺定论。" />
                  <div className="mt-6">
                    <div className="fm-ending-result__value">目前更像是在靠近{pathLabel}</div>
                    <p className="fm-ending-result__copy">
                      {directionPerception.summary} 这条线还没有完全定型，后面的周安排和月结算仍然会继续改变它。
                    </p>
                    <p className="fm-ending-result__copy">
                      长期主导倾向：{dominantDirectionLabel}。推免资格状态：
                      {formatRecommendationQualificationLabel(bundle.endingSummary.recommendationQualification)}
                    </p>
                  </div>
                </FmCard>
              </FmMotionSection>
            </div>

            <FmMotionSection delay={320}>
              <FmCard variant="normal">
                <FmSectionHead title="关键证据" copy="这里只整理当前已经看得到的 3 到 5 条证据，不会编造未来经历。" />
                <div className="mt-6 fm-ending-chips">
                  {evidenceChips.map((chip) => (
                    <FmBadge key={chip.text} tone={chip.tone}>
                      {chip.text}
                    </FmBadge>
                  ))}
                </div>
              </FmCard>
            </FmMotionSection>
          </>
        ) : (
          <>
            <FmMotionSection delay={0}>
              <section className="fm-ending-cover">
                <div className="fm-ending-cover__eyebrow">最终归档</div>
                <h1 className="fm-ending-cover__title">四年之后</h1>
                <p className="fm-ending-cover__subtitle">你把这四年过成了这样。</p>
                <p className="fm-ending-cover__subtitle">当前学年位置：{positionLabel}</p>
                <div className="fm-ending-cover__meta">
                  <FmBadge tone="ending">{formatSchoolTier(run.profile.schoolTier)}</FmBadge>
                  <FmBadge tone="event">{formatCollegeTrack(run.profile.collegeTrack)}</FmBadge>
                  <FmBadge tone="neutral">{formatCityTier(run.profile.cityTier)}</FmBadge>
                  <FmBadge tone="academic">{formatMonthLabel(bundle.endingSummary.finalYear, 12)}</FmBadge>
                </div>
              </section>
            </FmMotionSection>

            <div className="fm-ending-grid">
              <FmMotionSection delay={120}>
                <FmCard variant="active">
                  <FmSectionHead title="毕业状态" copy="先看看四年最后落到了哪里。" />
                  <div className="mt-6 fm-ending-result">
                    <FmBadge tone="ending">最终结果</FmBadge>
                    <div className="fm-ending-result__value">{outcomeLabel}</div>
                    <div className="fm-ending-result__copy">
                      这不是突然给出的单点结论，而是四年里学业、风险和状态一路累积之后的落点。
                    </div>
                  </div>
                </FmCard>
              </FmMotionSection>

              <FmMotionSection delay={220}>
                <FmCard variant="normal">
                  <FmSectionHead title="人生去向" copy="这里写的是最后更靠近的方向。" />
                  <div className="mt-6 fm-ending-result">
                    <div className="fm-ending-result__value">你最后更接近的是{pathLabel}</div>
                    <div className="fm-ending-result__copy">
                      这四年把你推向了{pathLabel}。{directionPerception.summary}
                    </div>
                  </div>
                </FmCard>
              </FmMotionSection>
            </div>

            <FmMotionSection delay={320}>
              <FmCard variant="muted">
                <FmSectionHead title="第三层结果" copy="如果这层结果已经形成，就在这里展示；没有时不硬编。" />
                <div className="mt-6 fm-ending-result__copy">{pathResultLabel}</div>
              </FmCard>
            </FmMotionSection>

            {endingFormalArtifact ? (
              <FmMotionSection delay={370}>
                <FmPanel>
                  <FmSectionHead
                    title="正式结果文件"
                    copy="这是根据最终结局事实生成的正式录取 / offer 文件，不补写未发生的学校、单位或录用细节。"
                    aside={<FmBadge tone="ending">{endingFormalArtifact.badgeLabel}</FmBadge>}
                  />
                  <div className="mt-6">
                    <FormalDocumentPreview
                      artifact={endingFormalArtifact}
                      recipientName={run.profile.name ?? "同学"}
                    />
                  </div>
                </FmPanel>
              </FmMotionSection>
            ) : null}

            <FmMotionSection delay={420}>
              <FmCard variant="normal">
                <FmSectionHead title="为什么会走到这个结局？" copy="证据链只引用真实数据：投入、学业、履历、状态、金钱和方向变化。" />
                <div className="mt-6 fm-evidence-list">
                  {evidenceRows.map((row) => (
                    <div key={row.title} className="fm-evidence-row">
                      <div className="fm-evidence-row__title">{row.title}</div>
                      <div className="fm-evidence-row__copy">{row.body}</div>
                      <FmBadge tone={row.tone}>{row.status}</FmBadge>
                    </div>
                  ))}
                </div>
              </FmCard>
            </FmMotionSection>

            {savedEndingEvidence.length > 0 ? (
              <FmMotionSection delay={470}>
                <FmCard variant="completed">
                  <FmSectionHead
                    title="存档证据链"
                    copy="这些条目来自 run state 已经写入的证据链，不从前端临时编造。"
                  />
                  <div className="mt-6 fm-evidence-list">
                    {savedEndingEvidence.map((item) => (
                      <div key={item.id} className="fm-evidence-row">
                        <div className="fm-evidence-row__title">{item.title}</div>
                        <div className="fm-evidence-row__copy">{item.body}</div>
                        <FmBadge tone="resume">{formatPlayerFacingMonthIndex(item.monthIndex)}</FmBadge>
                      </div>
                    ))}
                  </div>
                </FmCard>
              </FmMotionSection>
            ) : null}

            <FmMotionSection delay={520}>
              <section className="fm-ending-letter">
                <div className="fm-paper__clip" aria-hidden="true" />
                {!bundle.savedEndingReport ? (
                  <div className="fm-ending-cover__eyebrow">正式结局回望暂未存档</div>
                ) : null}
                <div className="fm-ending-letter__title">写给四年后的你</div>
                <div className="fm-ending-letter__copy">{letterBody}</div>
              </section>
            </FmMotionSection>
          </>
        )}
      </div>
    </FmShellLayout>
  );
}

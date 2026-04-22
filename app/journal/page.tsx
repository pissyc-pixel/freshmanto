import { AppShell } from "@/components/app-shell";
import { ReportPreview } from "@/components/report-preview";
import { SectionCard } from "@/components/section-card";
import { formatMonthLabel } from "@/lib/demo/options";
import { getServerDemoBundle } from "@/lib/demo/server";
import { readSearchParam, type DemoPageSearchParams } from "@/lib/demo/search-params";

export const dynamic = "force-dynamic";

type JournalPageProps = {
  searchParams: DemoPageSearchParams;
};

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const params = await searchParams;
  const runId = readSearchParam(params.runId);
  const bundle = runId ? await getServerDemoBundle(runId) : null;

  if (!runId || !bundle) {
    return (
      <AppShell
        eyebrow="月记"
        title="还没有月记归档。"
        description="月记页只展示已经保存到数据库里的 AI 月记与其结构化输入。"
      >
        <SectionCard title="暂无月记" description="先在主游戏页完成至少一次月结算。">
          <p className="text-sm leading-6 text-stone-600">
            月记只能来自规则层的结构化摘要，这里不会凭空生成演示文本。
          </p>
        </SectionCard>
      </AppShell>
    );
  }

  const monthlyReports = bundle.aiReports.filter((item) => item.report_type === "monthly_journal");

  return (
    <AppShell
      eyebrow="月记"
      title="月记归档"
      description="这里保留每个月的结构化输入和最终月记，方便确认叙事是否忠实地贴着规则层事实。"
    >
      <div className="space-y-6">
        {monthlyReports.length === 0 ? (
          <SectionCard title="暂无月记" description="这局还没有完成过月结算。">
            <p className="text-sm leading-6 text-stone-600">
              提交一次月度计划后，这里会自动出现第一篇月记。
            </p>
          </SectionCard>
        ) : (
          monthlyReports
            .slice()
            .reverse()
            .map((report) => (
              <SectionCard
                key={report.id}
                title={`${formatMonthLabel(report.year, report.month ?? 1)} 月记`}
                description="每篇月记都和保存时的结构化摘要绑定，便于追踪表达层是否越界。"
              >
                <ReportPreview
                  title={`${formatMonthLabel(report.year, report.month ?? 1)} 月记`}
                  contractLabel={report.model ?? "fallback"}
                  promptInput={report.input_summary_json}
                  markdown={report.output_markdown}
                />
              </SectionCard>
            ))
        )}
      </div>
    </AppShell>
  );
}

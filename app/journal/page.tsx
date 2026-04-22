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
        title="还没有月记归档"
        description="月记页只展示已经存档的正文，不直接把后台结构化输入摊给玩家。"
      >
        <SectionCard title="暂无月记" description="先在主游戏页完成至少一次月结算。">
          <p className="text-sm leading-6 text-stone-600">
            月记只能来自规则层结构化摘要，这里不会凭空生成演示文本。
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
      description="这里保留每个月已经生成并保存的月记正文，方便回看自己当时到底是怎么过的。"
    >
      <div className="space-y-6">
        {monthlyReports.length === 0 ? (
          <SectionCard title="暂无月记" description="这一局还没有完成过月结算。">
            <p className="text-sm leading-6 text-stone-600">
              提交完整一个月的周度行动后，这里会自动出现第一篇月记。
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
                description="展示的是玩家最终可见的正文，不直接展示结构化 JSON。"
              >
                <ReportPreview
                  title={`${formatMonthLabel(report.year, report.month ?? 1)} 月记`}
                  contractLabel={report.model ?? "fallback"}
                  markdown={report.output_markdown}
                />
              </SectionCard>
            ))
        )}
      </div>
    </AppShell>
  );
}

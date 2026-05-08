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
        title="这里会收集每个月的 AI 月记"
        description="月记偏情绪层，更像玩家本人在月底写给自己的回顾。"
      >
        <SectionCard title="还没有可查询的 run" description="先回到首页创建一局，再从主游戏推进到月底。">
          <p className="text-sm leading-6 text-stone-600">没有 run 的时候，这里会优先显示空状态而不是直接报错。</p>
        </SectionCard>
      </AppShell>
    );
  }

  const monthlyReports = bundle.aiReports.filter((item) => item.report_type === "monthly_journal");
  const pendingMonths = bundle.monthlyStates.filter(
    (state) => !monthlyReports.some((report) => report.year === state.year && report.month === state.month),
  );

  return (
    <AppShell
      eyebrow="月记"
      title="月记归档"
      description="月记偏情绪层，强调“我这个月到底是怎么过来的”；它会和成长日志分开，尽量避免重复。"
    >
      <div className="space-y-6">
        {pendingMonths.length > 0 ? (
          <SectionCard title="正在生成 AI 月记 / 月度总结" description="如果你刚结束月底结算，月记可能会慢一点落出来。">
            <p className="text-sm leading-6 text-stone-600">
              还在等待：{pendingMonths.map((state) => formatMonthLabel(state.year, state.month)).join("、")}
            </p>
          </SectionCard>
        ) : null}

        {monthlyReports.length === 0 ? (
          <SectionCard title="暂时还没有月记" description="等完成至少一次月底结算后，这里会自动出现第一篇月记。">
            <p className="text-sm leading-6 text-stone-600">
              月记不会凭空生成，它只会基于规则层已经确认的月度摘要去写。
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
                description="这里展示的是玩家最终可见的正文，不直接暴露后台结构化摘要。"
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

import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { SectionCard } from "@/components/section-card";

export default function DocsPage() {
  return (
    <AppShell
      eyebrow="文档"
      title="模块边界与本地运行说明"
      description="项目内的正式文档在仓库文件里维护，这个页面只做索引和摘要，方便本地演示时快速对齐。"
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="架构" description="核心边界在 docs/architecture.md 中定义。">
          <FactList
            items={[
              "数据层负责持久化，不做规则判定。",
              "规则层负责随机开局、月推进、学期结算与结局标签。",
              "AI 层只消费结构化摘要，负责月记与结局报告表达。"
            ]}
          />
        </SectionCard>
        <SectionCard title="计划" description="阶段拆分和并行职责记录在 docs/superpowers/plans/2026-04-22-college-sim-v0.md。">
          <FactList
            items={[
              "阶段 1：主 agent 搭地基并提交。",
              "阶段 2：数据层、规则层、UI/AI 层并行推进。",
              "阶段 3：主 agent 整合、联调、验证和文档更新。"
            ]}
          />
        </SectionCard>
        <SectionCard title="数据库" description="db/schema.sql 会在本地演示服务层里自动尝试应用。">
          <FactList
            items={[
              "最小表：runs、monthly_states、game_event_logs、ai_reports、resume_items。",
              "每次新建 run 与月结算都会写入状态快照和关键日志。",
              "AI 报告会保存结构化输入摘要与最终输出。"
            ]}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}

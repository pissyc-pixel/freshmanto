import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";

const docs = [
  {
    title: "架构文档",
    path: "/docs/architecture.md",
    detail: "说明数据层、规则层、UI 层和 AI 表达层的职责边界。"
  },
  {
    title: "实施计划",
    path: "/docs/superpowers/plans/2026-04-22-college-sim-v0.md",
    detail: "记录阶段拆分和并行任务的执行安排。"
  },
  {
    title: "数据库草案",
    path: "/db/schema.sql",
    detail: "保留最小 schema 的占位和后续扩展说明。"
  }
];

export default function DocsPage() {
  return (
    <AppShell
      eyebrow="文档索引"
      title="先把边界说明清楚"
      description="这些文档帮助 UI、规则层、数据层并行推进时保持接口对齐。"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {docs.map((doc) => (
          <SectionCard key={doc.path} title={doc.title} description={doc.detail}>
            <Link href={doc.path} className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline">
              打开 {doc.path}
            </Link>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

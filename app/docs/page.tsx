import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const docs = [
  {
    title: "架构文档",
    path: "/docs/architecture.md",
    detail: "说明数据层、规则层、UI 层和 AI 层的边界。"
  },
  {
    title: "实施计划",
    path: "/docs/superpowers/plans/2026-04-22-college-sim-v0.md",
    detail: "记录阶段划分和并行任务边界。"
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
      title="阶段 1 先把边界写清楚。"
      description="这里列出当前 Demo 的核心说明文档，方便并行开发时快速对齐。"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {docs.map((doc) => (
          <PlaceholderPanel key={doc.path} title={doc.title} description={doc.detail}>
            <Link href={doc.path} className="text-sm font-semibold text-amber-700 underline-offset-4 hover:underline">
              打开 {doc.path}
            </Link>
          </PlaceholderPanel>
        ))}
      </div>
    </AppShell>
  );
}


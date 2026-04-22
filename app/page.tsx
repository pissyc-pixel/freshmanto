import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const launchHighlights = [
  "随机开局由规则层生成，不由 AI 判定。",
  "月度行动、结算、事件与毕业风险全部在核心引擎中计算。",
  "AI 仅负责月记和结局报告表达层。"
];

export default function StartPage() {
  return (
    <AppShell
      eyebrow="大学生模拟器 v0"
      title="先把本地闭环跑通，再逐层扩展。"
      description="阶段 1 先完成模块边界、共享类型、占位页面与文档，为后续并行开发留出清晰写入面。"
      actions={
        <>
          <Link
            href="/game"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            进入主游戏页占位
          </Link>
          <Link
            href="/docs"
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看文档索引说明
          </Link>
        </>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <PlaceholderPanel
          title="当前骨架重点"
          description="页面已经预留为后续阶段接入随机开局、月度行动、AI 月记和结局展示。"
        >
          <ul className="space-y-3 text-sm leading-6 text-stone-700">
            {launchHighlights.map((item) => (
              <li key={item} className="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </PlaceholderPanel>
        <PlaceholderPanel
          title="阶段路线"
          description="主 agent 先搭地基，再并行拆给数据层、规则层、UI/AI 层。"
        >
          <ol className="space-y-3 text-sm leading-6 text-stone-700">
            <li>1. 初始化 Next.js + TypeScript + Tailwind 工程。</li>
            <li>2. 固化类型、目录边界与架构文档。</li>
            <li>3. 进入并行辅助开发并在最后整合联调。</li>
          </ol>
        </PlaceholderPanel>
      </section>
    </AppShell>
  );
}


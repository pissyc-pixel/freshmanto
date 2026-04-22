import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FactList } from "@/components/fact-list";
import { SectionCard } from "@/components/section-card";

const launchHighlights = [
  "随机开局、行动结算、事件触发和毕业判定全部由规则层负责。",
  "UI 页面只展示结构化结果，并为后续数据层接入预留 props 和接口。",
  "AI 只消费结构化摘要来生成月记与结局报告，不参与任何规则判定。"
];

const demoFlow = [
  "开局页提供演示入口和模块边界说明。",
  "主游戏页展示当前属性、时间块和行动入口。",
  "月结算页展示本月变化与 AI 月记调用预览。",
  "月记、履历、结局页负责查看归档文本和长期结果。"
];

export default function StartPage() {
  return (
    <AppShell
      eyebrow="大学生模拟器 v0"
      title="面向联调的 Demo UI 与 AI 表达层"
      description="这个版本聚焦可演示的页面骨架与 AI 转写封装：先把展示流跑通，再把规则层和数据层按接口接进来。"
      actions={
        <>
          <Link
            href="/game"
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            进入主游戏页
          </Link>
          <Link
            href="/docs"
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看文档索引
          </Link>
        </>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Demo 范围" description="这组页面只负责展示与串联，不写规则、不落完整数据层。">
          <FactList items={launchHighlights} />
        </SectionCard>
        <SectionCard
          title="演示流程"
          description="当前页面以静态示例数据驱动，后续可以直接替换成规则层输出和数据库读取结果。"
        >
          <ol className="space-y-3 text-sm leading-6 text-stone-700">
            {demoFlow.map((item, index) => (
              <li key={item} className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3">
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </SectionCard>
      </section>
    </AppShell>
  );
}

import Link from "next/link";
import { startNewRunAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ActionOptionList } from "@/components/action-option-list";
import { FactList } from "@/components/fact-list";
import { SectionCard } from "@/components/section-card";
import { actionOptions } from "@/lib/demo/options";

const guardrails = [
  "随机开局、月推进、课程策略、事件结算和毕业风险全部由规则层计算。",
  "AI 只负责把结构化摘要转成月记和结局报告，不参与任何判定。",
  "页面只展示状态、时间块、履历和日志，不在组件里塞规则逻辑。"
];

const flow = [
  "点击“开新档”创建一局真实 run，并写入数据库。",
  "在主游戏页查看随机开局、当前状态、本周时间池与行动表单。",
  "每次只结算一个动作，看到反馈后可以继续安排、提前结束本周或重开新档。",
  "四周结束后进入月结算页，生成并保存 AI 月记。",
  "可以继续查看履历、日志、月记归档和当前结局预览。"
];

export default function StartPage() {
  return (
    <AppShell
      eyebrow="大学生模拟器 v0"
      title="先把本地闭环跑通，再继续扩展四年人生。"
      description="这个版本优先验证最小可运行 Demo：开新档、随机开局、月度行动、月结算、AI 月记、履历与基础结局预览。"
      actions={
        <>
          <form action={startNewRunAction}>
            <button
              type="submit"
              className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
            >
              开新档
            </button>
          </form>
          <Link
            href="/docs"
            className="rounded-full border border-amber-900/15 bg-white/60 px-5 py-3 font-semibold text-stone-800 transition hover:bg-white/90"
          >
            查看架构说明
          </Link>
        </>
      }
    >
      <SectionCard
        title="朋友内测版说明"
        description="这不是正式公测版本，适合通过域名邀请朋友试玩并收集反馈。"
      >
        <FactList
          items={[
            "当前重点是验证“周内时间池 + 即时反馈 + 月末日记”的玩法闭环。",
            "数据会写入测试库；试玩时可以随时开新档，不需要保留长期存档。",
            "如果 AI 服务不可用，系统会自动使用本地 fallback 月记，不影响继续试玩。"
          ]}
        />
      </SectionCard>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="当前 Demo 的硬边界"
          description="这一版只做本地闭环，不追求玩法数量，但会把边界和日志打清楚。"
        >
          <FactList items={guardrails} />
        </SectionCard>
        <SectionCard
          title="你现在能跑的流程"
          description="阶段 3 已经把页面、规则层、数据层和 AI 表达层接到了一条真实演示链路里。"
        >
          <FactList items={flow} />
        </SectionCard>
      </section>

      <SectionCard
        title="v0 行动池"
        description="这里只展示可用行动本身；真正是否合法、收益如何、是否触发补救或风险，都由规则层决定。"
      >
        <ActionOptionList items={actionOptions} />
      </SectionCard>
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function SettlementPage() {
  return (
    <AppShell
      eyebrow="月结算页"
      title="月末事实结算先由规则层生成。"
      description="后续这里会展示结构化结算摘要、关键事件、属性变化与可保存的 AI 月记。"
    >
      <PlaceholderPanel
        title="结算边界"
        description="月结算页只负责展示数据和触发保存，不在页面里写判定规则。"
      >
        <p className="text-sm leading-6 text-stone-700">
          规则层会先给出结构化事实摘要，AI 表达层再基于摘要生成月记。
        </p>
      </PlaceholderPanel>
    </AppShell>
  );
}


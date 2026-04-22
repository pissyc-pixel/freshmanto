import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const blocks = [
  {
    title: "状态面板",
    detail: "后续展示金钱、心情、压力、成就感、社交与当学期学业值。"
  },
  {
    title: "时间块面板",
    detail: "后续展示每月 30 天拆分后的空闲/半空闲/白天全忙结构。"
  },
  {
    title: "行动入口",
    detail: "后续接入复习、兼职、社交、娱乐、学生活动与补救行为。"
  }
];

export default function GamePage() {
  return (
    <AppShell
      eyebrow="主游戏页"
      title="月度循环会从这里开始。"
      description="阶段 2 会将核心规则引擎和 UI 组件在这里接线，当前只保留可并行开发的界面槽位。"
    >
      <section className="grid gap-5 md:grid-cols-3">
        {blocks.map((block) => (
          <PlaceholderPanel key={block.title} title={block.title} description={block.detail}>
            <p className="text-sm leading-6 text-stone-600">
              当前为占位区域，避免把规则逻辑直接塞进页面组件。
            </p>
          </PlaceholderPanel>
        ))}
      </section>
    </AppShell>
  );
}


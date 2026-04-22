import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function JournalPage() {
  return (
    <AppShell
      eyebrow="月记查看区"
      title="AI 月记会集中展示在这里。"
      description="后续展示规则层事实摘要、发送给模型的结构化输入，以及返回的最终文案。"
    >
      <PlaceholderPanel
        title="AI 使用边界"
        description="AI 不决定数值、不补全未发生的重要事实，只负责表达。"
      >
        <p className="text-sm leading-6 text-stone-700">
          这里将保留输入摘要和输出文本，方便排查表达与事实是否一致。
        </p>
      </PlaceholderPanel>
    </AppShell>
  );
}


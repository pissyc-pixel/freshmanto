import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function EndingPage() {
  return (
    <AppShell
      eyebrow="结局页"
      title="结局先由规则标签判定，再交给 AI 生成报告。"
      description="阶段 2 和阶段 3 会把学期表现、毕业风险和履历结果接入这里。"
    >
      <PlaceholderPanel
        title="判定流程"
        description="规则层输出结局标签与事实摘要，AI 表达层只负责转写为结局报告。"
      >
        <p className="text-sm leading-6 text-stone-700">
          默认目标是正常毕业，只有长期挂科或持续失控才会进入风险结局分支。
        </p>
      </PlaceholderPanel>
    </AppShell>
  );
}


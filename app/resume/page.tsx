import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function ResumePage() {
  return (
    <AppShell
      eyebrow="履历查看区"
      title="轻量履历采用结构化存储。"
      description="后续按实习、项目/比赛、学生活动、特殊经历和求职进度进行分类展示。"
    >
      <PlaceholderPanel
        title="结构优先"
        description="前台阅读友好，后台以可扩展的数据结构保存，避免纯文本堆积。"
      >
        <p className="text-sm leading-6 text-stone-700">
          履历项会独立存储，便于后续用于结局评估或求职分支扩展。
        </p>
      </PlaceholderPanel>
    </AppShell>
  );
}


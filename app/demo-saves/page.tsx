import Link from "next/link";

import { loadDemoSaveAction } from "@/app/actions";
import { FmAppRoot, FmBrandMark, FmIcon } from "@/components/fm-ui/FmScaffold";
import { demoSavePresets } from "@/lib/demo/presets";

export default function DemoSavesPage() {
  return (
    <FmAppRoot centered data-testid="demo-saves-page">
      <section className="fm-start-scene">
        <FmBrandMark hero />
        <p className="mt-7 text-[2.8rem] font-semibold tracking-[0.16em] text-[#2a363b] md:text-[3rem]">
          载入演示存档
        </p>

        <div className="fm-start-card fm-enroll-card">
          <div className="fm-start-icon">
            <FmIcon name="file" className="h-10 w-10" />
          </div>

          <p className="fm-enroll-eyebrow">Demo Save Center</p>
          <h1 className="fm-enroll-title">从固定演示存档进入第 25 月第 1 周，直接开始后半程演示。</h1>
          <p className="fm-enroll-subtitle">
            这些存档不是静态展示页，而是真实可继续玩的 run state。载入后会保留前置履历、阶段月记和成长痕迹。
          </p>

          <div className="mt-8 grid gap-4">
            {demoSavePresets.map((preset) => (
              <article key={preset.id} className="rounded-[28px] border border-[#d7ead9] bg-[#fcfffb] p-5 shadow-[0_18px_40px_rgba(125,161,132,0.12)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-[1.2rem] font-semibold text-[#2a363b]">{preset.label}</div>
                    <div className="text-sm text-[#5a6b60]">{preset.schoolLabel}</div>
                  </div>
                  <div className="rounded-full bg-[#eef7ef] px-3 py-1 text-sm font-medium text-[#53715c]">
                    第 25 月第 1 周
                  </div>
                </div>

                <div className="mt-4 text-sm leading-7 text-[#5e6f63]">{preset.summary}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#f5fbf4] px-3 py-1 text-[#53715c]">{preset.routeLabel}</span>
                  <span className="rounded-full bg-[#fff8ef] px-3 py-1 text-[#8b6b3a]">目标结局：{preset.endingTarget}</span>
                </div>

                <form action={loadDemoSaveAction} className="mt-5">
                  <input type="hidden" name="presetId" value={preset.id} />
                  <button type="submit" className="fm-button-primary">
                    <FmIcon name="calendar" className="h-6 w-6" />
                    <span>载入这个演示存档</span>
                  </button>
                </form>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="fm-button-secondary">
              返回首页
            </Link>
            <Link href="/new-game" className="fm-button-secondary">
              新建一局
            </Link>
          </div>
        </div>
      </section>
    </FmAppRoot>
  );
}

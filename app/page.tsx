import Link from "next/link";

import { startNewRunAction } from "@/app/actions";
import { StartNewRunButton } from "@/components/start-new-run-button";
import { FmAppRoot, FmBrandMark, FmIcon } from "@/components/fm-ui/FmScaffold";
import { buildRunHref } from "@/lib/demo/active-run";
import { readActiveRunIdFromCookies } from "@/lib/demo/server-run-context";

export default async function StartPage() {
  const activeRunId = await readActiveRunIdFromCookies();

  return (
    <FmAppRoot centered data-testid="start-page">
      <section className="fm-start-scene">
        <FmBrandMark hero />
        <p className="mt-7 text-[2.8rem] font-semibold tracking-[0.24em] text-[#2a363b] md:text-[3rem]">
          大学生活模拟器
        </p>

        <div className="fm-start-card">
          <div className="fm-start-icon">
            <FmIcon name="spark" className="h-10 w-10" />
          </div>

          <div className="fm-start-input">
            真实规则层会决定你的开局、每周可选行动、月末结果与后续走向。
          </div>
          <div className="fm-start-input">
            这里不会预填假学校、假履历或假结局，先从一局真实 run 开始。
          </div>
          <div className="fm-start-help">每一次选择，都会慢慢把你的大学生活推成某一种样子。</div>

          <form action={startNewRunAction} data-testid="start-new-run-form">
            <StartNewRunButton />
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href={buildRunHref("/game", activeRunId)} className="fm-button-secondary">
              <FmIcon name="calendar" />
              <span>查看当前周历</span>
            </Link>
            <Link href="/docs" className="fm-button-secondary">
              <FmIcon name="file" />
              <span>查看结构说明</span>
            </Link>
          </div>

          <div className="fm-start-divider" />
          <div className="fm-start-quote">“先把真实闭环跑通，再决定还要长出什么系统。”</div>
        </div>

        <footer className="fm-start-footer">
          <span>REAL RUNS</span>
          <span>NO MOCK OUTCOMES</span>
          <span>LOCAL DEMO</span>
        </footer>
      </section>
    </FmAppRoot>
  );
}

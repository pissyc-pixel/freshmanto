import Link from "next/link";

import { ContinueSaveButton } from "@/components/continue-save-button";
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
            从姓名、学科方向到后续每周安排，这一局会按你的真实选择慢慢展开。
          </div>
          <div className="fm-start-input">
            先完成新生建档，再进入录取办确认入学，然后从第一周开始安排大学生活。
          </div>
          <div className="fm-start-help">每一次选择，都会慢慢把你的大学生活推成某一种样子。</div>

          <Link href="/new-game" className="fm-button-primary" data-testid="start-new-run-link">
            <FmIcon name="chevron-right" className="h-7 w-7" />
            <span>新生建档</span>
          </Link>

          <Link href="/demo-saves" className="fm-button-secondary">
            <FmIcon name="file" className="h-6 w-6" />
            <span>载入演示存档</span>
          </Link>

          <ContinueSaveButton />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href={buildRunHref("/game", activeRunId)} className="fm-button-secondary">
              <FmIcon name="calendar" />
              <span>查看当前周历</span>
            </Link>
            <Link href={buildRunHref("/resume", activeRunId)} className="fm-button-secondary">
              <FmIcon name="file" />
              <span>查看个人履历</span>
            </Link>
          </div>

          <div className="fm-start-divider" />
          <div className="fm-start-quote">“大学生活从建档那一刻开始，后面的样子，都由这一局慢慢长出来。”</div>
        </div>

        <footer className="fm-start-footer">
          <span>FRESH YEAR</span>
          <span>WEEKLY PLANNER</span>
          <span>MONTHLY JOURNAL</span>
        </footer>
      </section>
    </FmAppRoot>
  );
}

import Link from "next/link";

import { FmAppRoot, FmBrandMark, FmIcon } from "@/components/fm-ui/FmScaffold";
import { NewGameForm } from "@/components/new-game-form";

export default function NewGamePage() {
  return (
    <FmAppRoot centered data-testid="new-game-page">
      <section className="fm-start-scene">
        <FmBrandMark hero />
        <p className="mt-7 text-[2.8rem] font-semibold tracking-[0.16em] text-[#2a363b] md:text-[3rem]">
          Freshmanto 新生建档
        </p>

        <div className="fm-start-card fm-enroll-card">
          <div className="fm-start-icon">
            <FmIcon name="file" className="h-10 w-10" />
          </div>

          <p className="fm-enroll-eyebrow">录取办 / 新生档案 / 入学登记</p>
          <h1 className="fm-enroll-title">填写你的名字，选择一个学科方向，然后开始这一局大学生活。</h1>
          <p className="fm-enroll-subtitle">
            建档完成后，会进入录取办确认入学。学校层级、城市层级、家庭资源和其他开局数值会在这一局里真实生成。
          </p>

          <div className="mt-8">
            <NewGameForm />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href="/" className="fm-button-secondary">
              返回首页
            </Link>
            <Link href="/resume" className="fm-button-secondary">
              查看个人履历
            </Link>
          </div>
        </div>
      </section>
    </FmAppRoot>
  );
}

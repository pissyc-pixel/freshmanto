import { BrandWordmark, Icon, UiLabRoot } from "@/app/ui-lab/_components";

export default function UiLabStartPage() {
  return (
    <UiLabRoot mode="centered">
      <section className="fm-start-page">
        <BrandWordmark size="hero" />
        <p className="mt-7 text-[3rem] font-semibold tracking-[0.32em] text-[#2a363b]">大学生活模拟器</p>

        <div className="fm-start-card">
          <div className="fm-start-icon">
            <Icon name="menu" className="h-10 w-10" />
          </div>
          <input className="fm-input" defaultValue="输入手机号以读取存档" />
          <input className="fm-input" defaultValue="输入你的姓名" />
          <div className="fm-help">给自己起个好听的名字开始旅程</div>
          <button type="button" className="fm-primary-button">
            <Icon name="spark" className="h-7 w-7" />
            <span>开启崭新大学生活</span>
          </button>
          <div className="fm-divider" />
          <div className="fm-quote">“每一个选择，都在塑造未来的自己。”</div>
        </div>

        <footer className="fm-legal">
          <span>PRIVACY</span>
          <span>TERMS</span>
          <span>V1.2.0</span>
        </footer>
      </section>
    </UiLabRoot>
  );
}

import { BrandWordmark, FloatingActionButton, Icon, UiLabRoot } from "@/app/ui-lab/_components";

const traits = [
  { label: "逻辑严密", tone: "orange" },
  { label: "情感细腻", tone: "teal" },
];

const gifts = [
  {
    title: "学术趣体",
    body: "学习效率提升 15%。对学术课题有天生的敏锐度。",
    icon: "book-open",
    tone: "teal",
  },
  {
    title: "社交达人",
    body: "初始社交值加成。更容易在社团中建立影响力。",
    icon: "users",
    tone: "orange",
  },
  {
    title: "理财头脑",
    body: "勤工俭学收益增加。对开支有精准的把控力。",
    icon: "briefcase",
    tone: "amber",
  },
];

export default function UiLabAdmissionPage() {
  return (
    <UiLabRoot>
      <div className="fm-top-nav">
        <BrandWordmark />
        <div className="fm-top-nav__links">
          <span>Daily Planner</span>
          <span>Campus Map</span>
          <span>Social Circle</span>
          <span className="font-semibold text-[var(--fm-brand-dark)]">Journal</span>
        </div>
        <div className="fm-top-nav__icons">
          <Icon name="file" />
          <Icon name="smile" />
          <Icon name="cap" />
        </div>
      </div>

      <div className="fm-page-grid">
        <aside className="fm-side-sheet">
          <h2 className="fm-sheet-title">林舒恒</h2>
          <p className="fm-sheet-subtitle">FIRST-YEAR STUDENT</p>

          <section className="fm-side-section">
            <h3>
              <Icon name="file" />
              <span>个人简介</span>
            </h3>
            <p>
              来自书香门第，自幼沉浸于图书馆。这种学术熏陶赋予了林舒恒极高的起点。其家庭背景为大学生活提供了稳定的初始资金支持。
            </p>
          </section>

          <section className="fm-side-section">
            <h3>
              <Icon name="spark" />
              <span>成长特质</span>
            </h3>
            <div className="mt-4 flex gap-10">
              {traits.map((trait) => (
                <span key={trait.label} className={`fm-pill tone-${trait.tone}`}>
                  {trait.label}
                </span>
              ))}
            </div>
          </section>

          <section className="fm-side-section">
            <h3>
              <Icon name="bookmark" />
              <span>核心天赋</span>
            </h3>
            {gifts.map((gift) => (
              <div className="fm-mini-card" key={gift.title}>
                <h4 className={`tone-${gift.tone}`}>
                  <Icon name={gift.icon as never} />
                  <span>{gift.title}</span>
                </h4>
                <p>{gift.body}</p>
              </div>
            ))}
          </section>
        </aside>

        <section className="fm-document-card">
          <div className="fm-admission-header">
            <div>
              <div className="fm-admission-brand-cn">上海交通大学</div>
              <div className="fm-admission-brand-en">SHANGHAI JIAO TONG UNIVERSITY</div>
            </div>
            <div className="fm-admission-seal">
              <Icon name="cap" className="h-7 w-7" />
            </div>
          </div>

          <div className="fm-admission-rule" />
          <h1 className="fm-admission-title">录取通知书</h1>
          <div className="fm-admission-number">编号：20240901001</div>

          <div className="fm-letter">
            <p>
              <strong>林舒恒 同学：</strong>
            </p>
            <p>
              经上海市招生委员会批准，你被录取到我校 <strong>应用心理学</strong> 专业学习。
            </p>
            <p>
              请持本通知书于 2024 年 9 月 1 日至 2 日到校报到。录取信息已在教育部学信网注册。
            </p>
            <p>
              百廿交大，期待你的加入。希望你在未来的四年里，思源致远，砥砺前行，在美丽的闵行校园开启卓越的人生篇章。
            </p>
          </div>

          <div className="fm-admission-footer">
            <div className="fm-info-box">
              <div className="mb-3 border-b border-black/8 pb-2 text-[0.95rem] text-[#6c7479]">录取信息确认</div>
              <table>
                <tbody>
                  <tr>
                    <td>姓名：</td>
                    <td className="text-right font-semibold">林舒恒</td>
                  </tr>
                  <tr>
                    <td>专业：</td>
                    <td className="text-right font-semibold">应用心理学</td>
                  </tr>
                  <tr>
                    <td>院系：</td>
                    <td className="text-right font-semibold">人文学院</td>
                  </tr>
                  <tr>
                    <td>校区：</td>
                    <td className="text-right font-semibold">闵行校区</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="fm-signature">
              <div className="text-[2rem] font-semibold">上海交通大学</div>
              <div className="mt-3 text-[1.1rem]">二〇二四年八月十五日</div>
            </div>
          </div>

          <div className="fm-doc-actions">
            <button type="button" className="fm-doc-button fm-doc-button--primary">
              <Icon name="check" />
              <span>确认报到</span>
            </button>
            <button type="button" className="fm-doc-button">
              <Icon name="share" />
              <span>分享</span>
            </button>
            <div className="fm-official">
              <Icon name="bookmark" />
              <span>OFFICIAL DOCUMENT</span>
            </div>
          </div>
        </section>
      </div>

      <div className="fm-bottom-dock">
        <button type="button" className="fm-dock-button">
          <Icon name="book" />
        </button>
        <button type="button" className="fm-dock-button text-[#d47366]">
          <Icon name="settings" />
        </button>
      </div>

      <FloatingActionButton />
    </UiLabRoot>
  );
}

import { Icon, LabShell } from "@/app/ui-lab/_components";
import { resumeItems, resumeSkills } from "@/app/ui-lab/mock-data";

export default function UiLabResumePage() {
  return (
    <LabShell
      active="resume"
      header=""
      subheader=""
    >
      <section className="fm-card fm-resume-head">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="fm-resume-name">林舒恒</div>
            <div className="fm-resume-meta">
              <Icon name="cap" />
              <span>上海交通大学</span>
              <span>·</span>
              <span>应用心理学专业</span>
            </div>
          </div>
          <div className="fm-state-badge">在读本科生</div>
        </div>

        <div className="fm-score-strip">
          <div className="fm-score-box">
            <div className="fm-score-box__label">绩点 (GPA)</div>
            <div className="fm-score-box__value">3.92 / 4.0</div>
          </div>
          <div className="fm-score-box">
            <div className="fm-score-box__label">专业排名</div>
            <div className="fm-score-box__value">5 / 120</div>
          </div>
        </div>
      </section>

      <section className="fm-resume-block mt-6">
        <h2 className="m-0 text-[2rem] font-bold">核心能力 (Core Skills)</h2>
        <div className="fm-skill-row">
          {resumeSkills.map((skill) => (
            <div className={`fm-skill-pill tone-${skill.tone}`} key={skill.label}>
              <Icon name={skill.icon as never} />
              <span>{skill.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fm-resume-block mt-6">
        <div className="fm-resume-title-row">
          <div>
            <h2>个人履历</h2>
            <p>大一新生</p>
          </div>
          <div className="fm-student-id">
            <span>学籍编号</span>
            CN-STUDENT-2024
          </div>
        </div>

        <div className="fm-resume-lines">
          {resumeItems.map((item) => (
            <article className="fm-resume-line" key={item.title}>
              <div className={`fm-resume-line__icon tone-${item.tone}`}>
                <Icon name={item.icon as never} />
              </div>
              <div>
                <div className="fm-resume-line__title">{item.title}</div>
                <div className="fm-resume-line__body">{item.body}</div>
              </div>
              <div className="fm-resume-line__date">{item.date}</div>
            </article>
          ))}
        </div>

        <div className="fm-resume-footer">EVERY STORY STARTS WITH A SINGLE STEP</div>
      </section>
    </LabShell>
  );
}

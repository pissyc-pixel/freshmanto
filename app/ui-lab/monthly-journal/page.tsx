/* eslint-disable @next/next/no-img-element */

import { Icon, InlineStat, UiLabRoot } from "@/app/ui-lab/_components";
import { monthlyStats } from "@/app/ui-lab/mock-data";

export default function UiLabMonthlyJournalPage() {
  return (
    <UiLabRoot>
      <div className="fm-paper-scene">
        <div className="fm-month-stats">
          {monthlyStats.map((stat) => (
            <InlineStat key={stat.label} tone={stat.tone} icon={stat.icon as never} label={stat.label} value={stat.value} />
          ))}
        </div>

        <section className="fm-paper-stack">
          <article className="fm-paper">
            <div className="fm-tape" />
            <div className="fm-paper-date">九月 · 大一</div>
            <h1>初入校园</h1>
            <p>
              九月带着我未曾预料到的清爽如约而至。走在铺满落叶的校园，感觉每一页日记都是崭新的。第一次穿过学校那座挂着校训的南大门时，那种感觉非常奇妙。一切都充满着忙碌而美好的能量，图书馆里厚重的学术气息，操场上新生军训的喊号声，还有校园社团招新时数千次对话交织出的喧嚣声。
            </p>
            <p>
              我大部分的晚上都在努力平衡学业与社交。高数课的厚度确实有点吓人，辅导员开会时提到的保研和考研竞争也让人倍感压力，但这种忙碌感却让我觉得非常充实。我在食堂排队买煎饼果子时遇到了一个叫 Leo 的人；我们花了三个小时争论哪家校门口的奶茶最好喝，而不是在自习。现在我的书桌上堆满了草稿纸和还没撕掉的社团传单。
            </p>
            <p>
              有些夜晚，从宿舍窗户望向校外的灯火，感觉“Freshmanto”的生活就像一块巨大的拼图，而我才刚刚开始拼凑。虽然校园卡里的余额掉得比我想象中快，虽然已经连续三天穿着同一件印着校名的连帽衫，但这是几年来我第一次感觉到，我正处于我该在的地方。
            </p>

            <div className="fm-paper-bottom">
              <Icon name="book-open" className="h-16 w-16 text-[#99d2cd]" />
              <button type="button" className="fm-next-button">
                翻到下个月
                <span aria-hidden>→</span>
              </button>
              <div className="fm-page-index">
                页码
                <strong>01 / 48</strong>
              </div>
            </div>
          </article>
        </section>

        <figure className="fm-polaroid fm-polaroid--right">
          <img
            alt="开学第一天"
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=700&q=80"
          />
          <p>开学第一天</p>
        </figure>

        <figure className="fm-polaroid fm-polaroid--left">
          <img
            alt="校门口的奶茶"
            src="https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=500&q=80"
          />
          <p>校门口的奶茶</p>
        </figure>
      </div>
    </UiLabRoot>
  );
}

import type { ResumeItem } from "@/types/game";
import { sanitizePlayerFacingText } from "@/lib/player-facing-text";

type ResumeItemListProps = {
  items: ResumeItem[];
};

const categoryLabels: Record<ResumeItem["category"], string> = {
  internship: "实习",
  project: "项目",
  competition: "比赛",
  scholarship: "奖学金",
  research: "研究 / 深造",
  campus_activity: "校园活动",
  special_experience: "专项经历",
  job_progress: "求职进展",
};

export function ResumeItemList({ items }: ResumeItemListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 px-4 py-5 text-sm leading-6 text-stone-600">
        现在还没攒出能放进来的经历。后面慢慢走，这里会一点点充实起来。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white/75 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-700">M{item.month}</p>
              <h3 className="mt-1 text-lg font-semibold text-stone-900">{sanitizePlayerFacingText(item.title)}</h3>
            </div>
            <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-50">
              {categoryLabels[item.category]}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{sanitizePlayerFacingText(item.summary)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                {sanitizePlayerFacingText(tag)}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

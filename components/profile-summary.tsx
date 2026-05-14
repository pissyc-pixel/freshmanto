import {
  formatCityTier,
  formatCollegeTrack,
  formatFamilyBackground,
  formatSchoolTier,
  formatTalent,
} from "@/lib/demo/options";
import type { StarterProfile } from "@/types/game";

type ProfileSummaryProps = {
  profile: StarterProfile;
};

function safeText(value: string | number | undefined) {
  return value === undefined || value === "" ? "暂未记录" : String(value);
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const talents = profile.talents.length > 0 ? profile.talents : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">学院 / 学校 / 城市</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {safeText(formatCollegeTrack(profile.collegeTrack))} 路 {safeText(formatSchoolTier(profile.schoolTier))} 路{" "}
          {safeText(formatCityTier(profile.cityTier))}
        </p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">家庭与开局资源</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {safeText(formatFamilyBackground(profile.familyBackground))} 路 月生活费 {safeText(profile.monthlyAllowance)} 路 幸运{" "}
          {safeText(profile.luck)}
        </p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4 md:col-span-2">
        <p className="text-sm text-stone-500">初始天赋 / 特质</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {talents.length > 0 ? (
            talents.map((talent) => (
              <span key={talent} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                {formatTalent(talent)}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">暂未记录</span>
          )}
        </div>
      </article>
    </div>
  );
}

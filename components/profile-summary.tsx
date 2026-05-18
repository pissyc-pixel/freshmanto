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

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const talents = profile.talents.length > 0 ? profile.talents : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">学科 / 学校层级 / 城市层级</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {formatCollegeTrack(profile.collegeTrack)} / {formatSchoolTier(profile.schoolTier)} /{" "}
          {formatCityTier(profile.cityTier)}
        </p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">家庭与开局资源</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {formatFamilyBackground(profile.familyBackground)} / 月生活费 {profile.monthlyAllowance} / 幸运{" "}
          {profile.luck}
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
          ) : null}
        </div>
      </article>
    </div>
  );
}

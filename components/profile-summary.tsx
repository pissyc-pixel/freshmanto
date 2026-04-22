import {
  formatCityTier,
  formatCollegeTrack,
  formatFamilyBackground,
  formatSchoolTier,
  formatTalent
} from "@/lib/demo/options";
import type { StarterProfile } from "@/types/game";

type ProfileSummaryProps = {
  profile: StarterProfile;
};

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">学院 / 学校 / 城市</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {formatCollegeTrack(profile.collegeTrack)} · {formatSchoolTier(profile.schoolTier)} ·{" "}
          {formatCityTier(profile.cityTier)}
        </p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
        <p className="text-sm text-stone-500">家庭与开局资源</p>
        <p className="mt-3 text-lg font-semibold text-stone-900">
          {formatFamilyBackground(profile.familyBackground)} · 月生活费 {profile.monthlyAllowance} · 幸运 {profile.luck}
        </p>
      </article>
      <article className="rounded-2xl border border-[var(--border)] bg-white/75 p-4 md:col-span-2">
        <p className="text-sm text-stone-500">天赋</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.talents.map((talent) => (
            <span
              key={talent}
              className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900"
            >
              {formatTalent(talent)}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}


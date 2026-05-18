import { formatCityTier, formatCollegeTrack, formatSchoolTier } from "@/lib/demo/options";
import type { GameRun } from "@/types/game";

export type AdmissionViewModel = {
  documentNumber: string;
  studentName: string;
  schoolTierLabel: string;
  cityTierLabel: string;
  trackLabel: string;
  statement: string;
};

export function buildAdmissionViewModel(run: GameRun): AdmissionViewModel {
  const schoolTierLabel = formatSchoolTier(run.profile.schoolTier);
  const cityTierLabel = formatCityTier(run.profile.cityTier);
  const trackLabel = formatCollegeTrack(run.profile.collegeTrack);
  const studentName = run.profile.name?.trim() || "新生";

  return {
    documentNumber: `FM-${run.currentYear}${run.currentMonth}-${run.id.slice(0, 6).toUpperCase()}`,
    studentName,
    schoolTierLabel,
    cityTierLabel,
    trackLabel,
    statement:
      `你的大学生活档案已建立。` +
      ` 当前开局已经确认的基础画像包括学科方向 ${trackLabel}、学校层级 ${schoolTierLabel} 和城市层级 ${cityTierLabel}。` +
      ` 其余资源会在建档时一并生成，后续经历会根据你的每周安排逐步形成。`,
  };
}

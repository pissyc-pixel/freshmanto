import { formatCityTier, formatCollegeTrack, formatSchoolTier } from "@/lib/demo/options";
import type { GameRun } from "@/types/game";

export type AdmissionViewModel = {
  documentNumber: string;
  studentName: string;
  schoolName: string;
  schoolTierLabel: string;
  departmentName: string;
  majorName: string;
  campusName: string;
  cityTierLabel: string;
  trackLabel: string;
  statement: string;
};

export function buildAdmissionViewModel(run: GameRun): AdmissionViewModel {
  const schoolTierLabel = formatSchoolTier(run.profile.schoolTier);
  const cityTierLabel = formatCityTier(run.profile.cityTier);
  const trackLabel = formatCollegeTrack(run.profile.collegeTrack);

  return {
    documentNumber: `FM-${run.currentYear}${run.currentMonth}-${run.id.slice(0, 6).toUpperCase()}`,
    studentName: "待生成",
    schoolName: "暂未确认",
    schoolTierLabel,
    departmentName: "未记录",
    majorName: "未记录",
    campusName: "暂未确认",
    cityTierLabel,
    trackLabel,
    statement: `你已经进入本局真实大学生活流程。当前可确认的信息包括学校层级 ${schoolTierLabel}、城市层级 ${cityTierLabel}、学科方向 ${trackLabel}；其余尚未由规则层记录的字段，会暂时保持空白。`,
  };
}

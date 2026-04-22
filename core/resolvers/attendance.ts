import type { CourseAttendanceStrategy, CourseResolution } from "@/types/game";

const COURSE_RULES: Record<CourseAttendanceStrategy, CourseResolution> = {
  serious: {
    strategy: "serious",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    academicRiskDelta: -2,
    academicGain: 18,
    moodDelta: -1,
    note: "认真听课，学业收益最高。",
  },
  mixed: {
    strategy: "mixed",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    academicRiskDelta: 1,
    academicGain: 12,
    moodDelta: 0,
    note: "基本跟课，收益稳定。",
  },
  skip_sometimes: {
    strategy: "skip_sometimes",
    attendanceCounted: false,
    directRollCallPenalty: -2,
    academicRiskDelta: 6,
    academicGain: 7,
    moodDelta: 1,
    note: "偶尔翘课，容易遗漏课堂重点。",
  },
  skip_often: {
    strategy: "skip_often",
    attendanceCounted: false,
    directRollCallPenalty: -5,
    academicRiskDelta: 12,
    academicGain: 2,
    moodDelta: 2,
    note: "经常翘课，期末风险很高。",
  },
  proxy: {
    strategy: "proxy",
    attendanceCounted: true,
    directRollCallPenalty: -6,
    academicRiskDelta: 14,
    academicGain: 1,
    moodDelta: 0,
    note: "代课或代签到能糊弄出勤，但学业风险明显走高。",
  },
  phone: {
    strategy: "phone",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    academicRiskDelta: 5,
    academicGain: 9,
    moodDelta: 0,
    note: "刷手机仍算出勤，不直接吃点名惩罚，但会错过信息和机会。",
  },
};

export function resolveCourseStrategy(strategy: CourseAttendanceStrategy): CourseResolution {
  return COURSE_RULES[strategy];
}

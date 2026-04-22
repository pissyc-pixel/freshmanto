import type { CourseAttendanceStrategy, CourseResolution, Weekday } from "@/types/game";

const BASE_COURSE_RULES: Record<CourseAttendanceStrategy, CourseResolution> = {
  serious: {
    strategy: "serious",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 0,
    usualScoreRiskDelta: 0,
    proxyCost: 0,
    remedyPressure: 0,
    academicRiskDelta: -3,
    academicGain: 5,
    moodDelta: -1,
    stressDelta: 2,
  },
  mixed: {
    strategy: "mixed",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 1,
    usualScoreRiskDelta: 1,
    proxyCost: 0,
    remedyPressure: 1,
    academicRiskDelta: 1,
    academicGain: 3,
    moodDelta: 0,
    stressDelta: 1,
  },
  skip_sometimes: {
    strategy: "skip_sometimes",
    attendanceCounted: false,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 4,
    usualScoreRiskDelta: 3,
    proxyCost: 0,
    remedyPressure: 2,
    academicRiskDelta: 9,
    academicGain: 1,
    moodDelta: 1,
    stressDelta: -1,
  },
  skip_often: {
    strategy: "skip_often",
    attendanceCounted: false,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 8,
    usualScoreRiskDelta: 6,
    proxyCost: 0,
    remedyPressure: 4,
    academicRiskDelta: 18,
    academicGain: 0,
    moodDelta: 2,
    stressDelta: -2,
  },
  proxy: {
    strategy: "proxy",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 2,
    usualScoreRiskDelta: 5,
    proxyCost: 120,
    remedyPressure: 3,
    academicRiskDelta: 10,
    academicGain: 1,
    moodDelta: 0,
    stressDelta: 1,
  },
  phone: {
    strategy: "phone",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 1,
    usualScoreRiskDelta: 3,
    proxyCost: 0,
    remedyPressure: 2,
    academicRiskDelta: 6,
    academicGain: 2,
    moodDelta: 0,
    stressDelta: 0,
  },
};

const SKIP_CLASS_RISK_RULES: Record<
  CourseAttendanceStrategy,
  {
    rollCallRiskDelta: number;
    usualScoreRiskDelta: number;
    proxyCost: number;
    remedyPressure: number;
    academicRiskDelta: number;
  }
> = {
  serious: {
    rollCallRiskDelta: 2,
    usualScoreRiskDelta: 1,
    proxyCost: 0,
    remedyPressure: 1,
    academicRiskDelta: 2,
  },
  mixed: {
    rollCallRiskDelta: 3,
    usualScoreRiskDelta: 2,
    proxyCost: 0,
    remedyPressure: 1,
    academicRiskDelta: 3,
  },
  skip_sometimes: {
    rollCallRiskDelta: 4,
    usualScoreRiskDelta: 3,
    proxyCost: 0,
    remedyPressure: 2,
    academicRiskDelta: 4,
  },
  skip_often: {
    rollCallRiskDelta: 6,
    usualScoreRiskDelta: 4,
    proxyCost: 0,
    remedyPressure: 3,
    academicRiskDelta: 6,
  },
  proxy: {
    rollCallRiskDelta: 1,
    usualScoreRiskDelta: 2,
    proxyCost: 40,
    remedyPressure: 2,
    academicRiskDelta: 3,
  },
  phone: {
    rollCallRiskDelta: 2,
    usualScoreRiskDelta: 2,
    proxyCost: 0,
    remedyPressure: 1,
    academicRiskDelta: 2,
  },
};

export function resolveCourseStrategy(
  strategy: CourseAttendanceStrategy,
  input?: {
    skippedClassDays?: Weekday[];
  },
): CourseResolution {
  const base = BASE_COURSE_RULES[strategy];
  const skippedCount = [...new Set(input?.skippedClassDays ?? [])].length;
  const skipRule = SKIP_CLASS_RISK_RULES[strategy];

  return {
    ...base,
    rollCallRiskDelta: base.rollCallRiskDelta + skippedCount * skipRule.rollCallRiskDelta,
    usualScoreRiskDelta: base.usualScoreRiskDelta + skippedCount * skipRule.usualScoreRiskDelta,
    proxyCost: base.proxyCost + skippedCount * skipRule.proxyCost,
    remedyPressure: base.remedyPressure + skippedCount * skipRule.remedyPressure,
    academicRiskDelta: base.academicRiskDelta + skippedCount * skipRule.academicRiskDelta,
    note: skippedCount > 0 ? `Skipped ${skippedCount} daytime class blocks this week.` : undefined,
  };
}

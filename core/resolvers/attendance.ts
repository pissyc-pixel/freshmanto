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
    stressDelta: number;
    academicGain: number;
    academicRiskDelta: number;
  }
> = {
  serious: {
    rollCallRiskDelta: 2,
    usualScoreRiskDelta: 1,
    stressDelta: 2,
    academicGain: -2,
    academicRiskDelta: 2,
  },
  mixed: {
    rollCallRiskDelta: 3,
    usualScoreRiskDelta: 2,
    stressDelta: 3,
    academicGain: -2,
    academicRiskDelta: 3,
  },
  phone: {
    rollCallRiskDelta: 2,
    usualScoreRiskDelta: 2,
    stressDelta: 2,
    academicGain: -1,
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
    proxyCost: 0,
    remedyPressure: base.remedyPressure + skippedCount,
    academicRiskDelta: base.academicRiskDelta + skippedCount * skipRule.academicRiskDelta,
    academicGain: base.academicGain + skippedCount * skipRule.academicGain,
    stressDelta: base.stressDelta + skippedCount * skipRule.stressDelta,
    note: skippedCount > 0 ? `Skipped ${skippedCount} daytime class blocks this week.` : undefined,
  };
}

export type Talent =
  | "self-disciplined"
  | "quick-learner"
  | "social-butterfly"
  | "stress-resistant"
  | "resourceful";

export type FamilyBackground =
  | "struggling"
  | "ordinary"
  | "stable"
  | "well-connected"
  | "affluent";

export type CollegeTrack = "arts" | "science" | "engineering" | "business" | "medicine";

export type SchoolTier = "qingbei" | "nankai_tianda" | "985" | "211" | "first_tier" | "second_tier";

export type CityTier = "tier_1" | "tier_2" | "tier_3";

export type CourseAttendanceStrategy =
  | "serious"
  | "mixed"
  | "phone";

export type ActionType =
  | "study"
  | "job_prep"
  | "part_time"
  | "social"
  | "relax"
  | "big_meal"
  | "student_activity"
  | "remedy"
  | "ask_family"
  | "skip_class";

export type ActionTime = "day" | "night";

export type TimeBlockKind = "free" | "half_free" | "busy_day";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type ResumeCategory =
  | "internship"
  | "project"
  | "campus_activity"
  | "special_experience"
  | "job_progress";

export type EventSeverity = "routine" | "important" | "critical";

export type GraduationOutcome = "graduate" | "delayed" | "cannot_graduate" | "drop_out";

export type SemesterFeedback = "excellent" | "stable" | "strained" | "warning" | "critical";

export type EventTriggerCondition =
  | "always"
  | "money_low"
  | "stress_high"
  | "academic_risk_high"
  | "social_low"
  | "social_high"
  | "mood_low"
  | "academic_streak_high";

export type StarterProfile = {
  talents: Talent[];
  familyBackground: FamilyBackground;
  monthlyAllowance: number;
  luck: number;
  collegeTrack: CollegeTrack;
  schoolTier: SchoolTier;
  cityTier: CityTier;
};

export type DynamicStats = {
  money: number;
  mood: number;
  stress: number;
  fulfillment: number;
  social: number;
  semesterAcademics: number;
};

export type ResumeItem = {
  id: string;
  category: ResumeCategory;
  title: string;
  summary: string;
  month: number;
  tags: string[];
};

export type EventEffect = {
  stats?: Partial<DynamicStats>;
  money?: number;
  academicRisk?: number;
  addResume?: {
    category: ResumeCategory;
    title: string;
    summary: string;
    tags: string[];
  };
  flags?: string[];
  notableFact?: string;
};

export type EventTemplate = {
  id: string;
  title: string;
  severity: EventSeverity;
  triggerMonths: number[];
  condition: EventTriggerCondition;
  summary: string;
  supportsRemedy: boolean;
  effect: EventEffect;
};

export type ScheduledDay = {
  day: number;
  dayType: TimeBlockKind;
  availableTimes: ActionTime[];
};

export type ScheduledWeekday = {
  weekday: Weekday;
  label: string;
  dayType: TimeBlockKind;
  availableTimes: ActionTime[];
  courseLockedDaytime?: boolean;
};

export type ScheduledWeek = {
  week: number;
  label: string;
  days: ScheduledWeekday[];
};

export type PlannedAction = {
  action: ActionType;
  time: ActionTime;
  skipClassDays?: Weekday[];
};

export type ResolvedAction = PlannedAction & {
  accepted: boolean;
  reason?: string;
};

export type MonthlyActionPlan = {
  attendanceStrategy: CourseAttendanceStrategy;
  actions: PlannedAction[];
};

export type ActionTurnPlan = {
  attendanceStrategy: CourseAttendanceStrategy;
  action: PlannedAction;
};

export type ActiveWeekState = {
  week: number;
  totalTimeUnits: number;
  remainingTimeUnits: number;
  releasedClassDays: Weekday[];
  attendanceStrategy: CourseAttendanceStrategy;
};

export type CourseResolution = {
  strategy: CourseAttendanceStrategy;
  attendanceCounted: boolean;
  directRollCallPenalty: number;
  rollCallRiskDelta: number;
  usualScoreRiskDelta: number;
  proxyCost: number;
  remedyPressure: number;
  academicRiskDelta: number;
  academicGain: number;
  moodDelta: number;
  stressDelta: number;
  note?: string;
};

export type CooldownState = {
  askFamilyMonths: number;
};

export type RiskState = {
  academicRisk: number;
  burnout: number;
};

export type SemesterRecord = {
  semester: number;
  academicScore: number;
  feedback: SemesterFeedback;
  passed: boolean;
};

export type ActionTurnSummary = {
  turn: number;
  week: number;
  slotLabel: string;
  advancesCalendar: boolean;
  attendanceStrategy: CourseAttendanceStrategy;
  chosenAction: PlannedAction;
  resolvedAction: ResolvedAction;
  statsBefore: DynamicStats;
  statsAfter: DynamicStats;
  statsDelta: DynamicStats;
  moneyDelta: number;
  flags: string[];
  notableFacts: string[];
  allowanceApplied: boolean;
  course: CourseResolution;
  timeCost?: number;
  weekTimeBefore?: number;
  weekTimeAfter?: number;
  releasedClassDays?: Weekday[];
  weekCompleted?: boolean;
};

export type ActiveMonthState = {
  year: number;
  month: number;
  currentWeek: number;
  totalWeeks: number;
  allowanceApplied: boolean;
  cooldownsAtStart: CooldownState;
  weeklyCalendar: ScheduledWeek[];
  currentWeekState: ActiveWeekState;
  completedWeeks: Array<{
    week: number;
    attendanceStrategy: CourseAttendanceStrategy;
    course: CourseResolution;
    releasedClassDays: Weekday[];
    endedEarly: boolean;
  }>;
  statsAtStart: DynamicStats;
  turns: ActionTurnSummary[];
  lastResolvedTurn?: ActionTurnSummary;
};

export type StructuredMonthlySummary = {
  month: number;
  actions: ActionType[];
  attendanceStrategy: CourseAttendanceStrategy;
  schedule: ScheduledDay[];
  weeklyCalendar: ScheduledWeek[];
  statsBefore: DynamicStats;
  statsAfter: DynamicStats;
  statsDelta: DynamicStats;
  moneyDelta: number;
  academicFeedback: SemesterFeedback;
  eventIds: string[];
  resumeAdditions: ResumeItem[];
  notableFacts: string[];
  resolvedActions: ResolvedAction[];
  flags: string[];
  cooldowns: CooldownState;
  course: CourseResolution;
  turns: ActionTurnSummary[];
};

export type SemesterSettlement = {
  semester: number;
  academicScore: number;
  feedback: SemesterFeedback;
  passed: boolean;
};

export type StructuredEndingSummary = {
  finalYear: number;
  outcome: GraduationOutcome;
  longTermAcademicAverage: number;
  resumeHighlights: ResumeItem[];
  notableFacts: string[];
};

export type GameRun = {
  id: string;
  status: "active" | "completed";
  currentYear: number;
  currentMonth: number;
  currentSemester: number;
  profile: StarterProfile;
  stats: DynamicStats;
  semesterAverage: number;
  resume: ResumeItem[];
  logLineIds: string[];
  monthlySummaries: StructuredMonthlySummary[];
  semesters: SemesterRecord[];
  cooldowns: CooldownState;
  risk: RiskState;
  riskFlags: string[];
  activeMonth?: ActiveMonthState;
};

export type InitialGameRunOptions = {
  id?: string;
  randomValues?: number[];
};

export type ResolvedMonthResult = {
  run: GameRun;
  summary: StructuredMonthlySummary;
};

export type SemesterSettlementResult = {
  run: GameRun;
  summary: SemesterSettlement;
};

export type ResolvedTurnResult = {
  run: GameRun;
  turnSummary: ActionTurnSummary;
  monthCompleted: boolean;
  monthlySummary?: StructuredMonthlySummary;
};

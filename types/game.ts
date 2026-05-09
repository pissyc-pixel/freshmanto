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
  | "postgraduate_prep"
  | "public_exam_prep"
  | "competition_project"
  | "part_time"
  | "social"
  | "relax"
  | "idle"
  | "big_meal"
  | "student_activity"
  | "remedy"
  | "ask_family"
  | "skip_class";

export type ActionTime = "day" | "night";

export type TimeBlockKind = "free" | "half_free" | "busy_day";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WeeklyDayType = "night_only" | "half_day" | "full_day";

export type ActionAvailability = "night" | "half_day" | "full_day";

export type ResumeCategory =
  | "internship"
  | "project"
  | "competition"
  | "scholarship"
  | "research"
  | "campus_activity"
  | "special_experience"
  | "job_progress";

export type EventSeverity = "routine" | "important" | "critical";

export type GraduationOutcome = "graduate" | "delayed" | "cannot_graduate" | "drop_out";

export type SemesterFeedback = "excellent" | "stable" | "strained" | "warning" | "critical";

export type DirectionKey =
  | "employment"
  | "postgraduate"
  | "public_exam"
  | "recommendation"
  | "undecided";

export type DirectionTendencyMap = Record<DirectionKey, number>;

export type RecommendationQualification =
  | "pending"
  | "eligible"
  | "borderline"
  | "unlikely"
  | "accepted"
  | "declined_to_postgraduate"
  | "declined_to_employment";

export type CompetitionProjectStatus = "open" | "active" | "submitted" | "completed" | "expired";

export type CompetitionAwardLevel = "school" | "provincial" | "national";

export type CompetitionAwardRank = "first" | "second" | "third";

export type ScholarshipLevel = "none" | "standard" | "high";

export type GraduationPath = "employment" | "recommendation" | "postgraduate_exam" | "public_exam" | "undecided";

export type GraduationPathResult = "success" | "ordinary" | "failure" | "pivot";

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
  optionId?: string;
  label?: string;
  weekday?: Weekday;
  skipClass?: boolean;
  sourceEventId?: string;
  autoFilled?: boolean;
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
  attendanceLocked?: boolean;
  event?: WeeklyEventInstance | null;
  days?: PlannedWeekdayState[];
  readyToConfirm?: boolean;
  plannerFeedback?: PlannerFeedback;
  planningWarnings?: string[];
  lastSelectedOptionId?: string;
  lastPlannedWeekday?: Weekday;
};

export type PlannerFeedback = {
  kind: "info" | "success" | "error";
  title: string;
  message: string;
};

export type WeeklyActionEffect = {
  stats?: Partial<DynamicStats>;
  money?: number;
  risk?: Partial<RiskState>;
  flags?: string[];
  notableFact?: string;
  resume?: {
    category: ResumeCategory;
    title: string;
    summary: string;
    tags: string[];
  };
};

export type WeeklyActionOption = {
  optionId: string;
  action: ActionType;
  label: string;
  description: string;
  availability: ActionAvailability[];
  source: "default" | "weekly_event";
  sourceEventId?: string;
  effect?: WeeklyActionEffect;
};

export type WeeklyEventActionBoost = {
  action: ActionType;
  effect: WeeklyActionEffect;
};

export type WeeklyEventCategory = "A" | "B" | "D" | "E";

export type WeeklyEventInstance = {
  id: string;
  category?: WeeklyEventCategory;
  title: string;
  summary: string;
  weekday: Weekday;
  effectDescription: string;
  dayTypeOverride?: WeeklyDayType;
  limitedActions?: ActionType[];
  specialAction?: WeeklyActionOption;
  actionBoosts?: WeeklyEventActionBoost[];
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  skipClosesProjectLine?: boolean;
  defaultAttendIfUnplanned?: boolean;
};

export type PlannedWeekdayState = {
  weekday: Weekday;
  label: string;
  baseDayType: WeeklyDayType;
  effectiveDayType: WeeklyDayType;
  skipClassAvailable: boolean;
  skipClassSelected: boolean;
  plannedAction?: PlannedAction;
  planningStatus: "pending" | "planned" | "settled";
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

export type AcademicProfileSnapshot = {
  gpa: number;
  rank: number | null;
  percentile: number | null;
  recommendationScore: number;
};

export type PublicExamState = {
  progress: number;
  aptitudePrep: number;
  essayPrep: number;
};

export type CompetitionAward = {
  level: CompetitionAwardLevel;
  rank: CompetitionAwardRank;
};

export type CompetitionProject = {
  id: string;
  title: string;
  category: string;
  track: CollegeTrack;
  routeBias: DirectionKey[];
  semesterKey: string;
  openedYear: number;
  openedMonth: number;
  deadlineYear: number;
  deadlineMonth: number;
  minimumEffortDays: number;
  investedDays: number;
  status: CompetitionProjectStatus;
  awardPool: CompetitionAwardLevel[];
  result?: CompetitionAward | null;
  sourceEventId?: string;
};

export type ScholarshipRecord = {
  id: string;
  academicYear: number;
  level: ScholarshipLevel;
  amount: number;
  title: string;
  reason: string;
};

export type CareerRouteState = {
  tendencies: DirectionTendencyMap;
  dominantDirection: DirectionKey;
  publicExam: PublicExamState;
  postgraduateProgress: number;
  employmentReadiness: number;
  recommendationReadiness: number;
  recommendationQualification: RecommendationQualification;
  recommendationEvaluatedAtYear?: number;
  recommendationEvaluatedAtMonth?: number;
  latestHints: string[];
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
  weekday?: Weekday;
  dayLabel?: string;
  timeCost?: number;
  weekTimeBefore?: number;
  weekTimeAfter?: number;
  releasedClassDays?: Weekday[];
  weekCompleted?: boolean;
};

export type WeeklySettlementSummary = {
  week: number;
  attendanceStrategy: CourseAttendanceStrategy;
  event?: WeeklyEventInstance | null;
  dailyResults: ActionTurnSummary[];
  totals: DynamicStats;
  moneyDelta: number;
  riskDelta: RiskState;
  flags: string[];
  opportunities: string[];
  budgetLines?: string[];
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
  latestWeekSettlement?: WeeklySettlementSummary;
  weeklySettlements?: WeeklySettlementSummary[];
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
  weeklySettlements?: WeeklySettlementSummary[];
  academicProfile?: AcademicProfileSnapshot;
  progression?: CareerRouteState;
  competitionProjects?: CompetitionProject[];
  scholarshipAwarded?: ScholarshipRecord;
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
  dominantDirection?: DirectionKey;
  graduationPath?: GraduationPath;
  pathResult?: GraduationPathResult;
  recommendationQualification?: RecommendationQualification;
  publicExamProgress?: number;
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
  progression?: CareerRouteState;
  competitionProjects?: CompetitionProject[];
  scholarships?: ScholarshipRecord[];
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

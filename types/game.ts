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
  | "skip_sometimes"
  | "skip_often"
  | "proxy"
  | "phone";

export type ActionType =
  | "study"
  | "job_prep"
  | "part_time"
  | "social"
  | "relax"
  | "student_activity"
  | "remedy";

export type TimeBlockKind = "free" | "half_free" | "busy_day" | "busy_night";

export type ResumeCategory =
  | "internship"
  | "project"
  | "campus_activity"
  | "special_experience"
  | "job_progress";

export type EventSeverity = "routine" | "important" | "critical";

export type GraduationOutcome = "graduate" | "delayed" | "cannot_graduate" | "drop_out";

export type SemesterFeedback = "excellent" | "stable" | "strained" | "warning" | "critical";

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

export type EventTemplate = {
  id: string;
  title: string;
  severity: EventSeverity;
  triggerMonth?: number;
  summary: string;
  supportsRemedy: boolean;
};

export type StructuredMonthlySummary = {
  month: number;
  actions: ActionType[];
  attendanceStrategy: CourseAttendanceStrategy;
  statsBefore: DynamicStats;
  statsAfter: DynamicStats;
  academicFeedback: SemesterFeedback;
  eventIds: string[];
  resumeAdditions: ResumeItem[];
  notableFacts: string[];
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
  profile: StarterProfile;
  stats: DynamicStats;
  semesterAverage: number;
  resume: ResumeItem[];
  logLineIds: string[];
};


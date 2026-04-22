import type {
  ActionType,
  DynamicStats,
  ResumeItem,
  StructuredEndingSummary,
  StructuredMonthlySummary,
  TimeBlockKind
} from "@/types/game";
import { renderEndingReportFallback, renderMonthlyJournalFallback } from "@/lib/ai/reports";

export type DemoActionOption = {
  id: string;
  title: string;
  type: ActionType;
  cost: string;
  payoff: string;
  risk: string;
};

export type DemoTimeBlock = {
  label: string;
  kind: TimeBlockKind;
  detail: string;
};

export type DemoHistoryEntry = {
  monthLabel: string;
  title: string;
  summary: string;
  tone: "up" | "flat" | "down";
};

export const demoStatsBefore: DynamicStats = {
  money: 900,
  mood: 58,
  stress: 46,
  fulfillment: 54,
  social: 49,
  semesterAcademics: 67
};

export const demoStatsAfter: DynamicStats = {
  money: 1120,
  mood: 64,
  stress: 41,
  fulfillment: 63,
  social: 56,
  semesterAcademics: 72
};

export const demoMonthlySummary: StructuredMonthlySummary = {
  month: 3,
  actions: ["study", "student_activity", "social"],
  attendanceStrategy: "mixed",
  schedule: [
    { day: 1, dayType: "busy_day", availableTimes: ["night"] },
    { day: 2, dayType: "free", availableTimes: ["day", "night"] },
    { day: 3, dayType: "half_free", availableTimes: ["night"] }
  ],
  statsBefore: demoStatsBefore,
  statsAfter: demoStatsAfter,
  statsDelta: {
    money: demoStatsAfter.money - demoStatsBefore.money,
    mood: demoStatsAfter.mood - demoStatsBefore.mood,
    stress: demoStatsAfter.stress - demoStatsBefore.stress,
    fulfillment: demoStatsAfter.fulfillment - demoStatsBefore.fulfillment,
    social: demoStatsAfter.social - demoStatsBefore.social,
    semesterAcademics: demoStatsAfter.semesterAcademics - demoStatsBefore.semesterAcademics
  },
  moneyDelta: demoStatsAfter.money - demoStatsBefore.money,
  academicFeedback: "stable",
  eventIds: ["event-midterm-review", "event-club-presentation"],
  resumeAdditions: [
    {
      id: "resume-campus-demo",
      category: "campus_activity",
      title: "Campus roadshow volunteer",
      summary: "Coordinated check-in and floor flow for a college demo event.",
      month: 3,
      tags: ["execution", "teamwork"]
    }
  ],
  notableFacts: [
    "Two evening blocks were reserved for review and presentation prep.",
    "Mood dipped before midterms, but lower leisure time kept stress under control.",
    "A teacher recommendation created a possible campus project lead for next month."
  ],
  resolvedActions: [
    { action: "study", time: "night", accepted: true },
    { action: "student_activity", time: "night", accepted: true },
    { action: "social", time: "day", accepted: true }
  ],
  flags: ["demo-ui", "grounded-summary"],
  cooldowns: {
    askFamilyMonths: 0
  },
  course: {
    strategy: "mixed",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    academicRiskDelta: -2,
    academicGain: 5,
    moodDelta: -1,
    note: "Attendance stayed safe enough for the month."
  }
};

export const demoEndingSummary: StructuredEndingSummary = {
  finalYear: 4,
  outcome: "graduate",
  longTermAcademicAverage: 78,
  resumeHighlights: [
    {
      id: "resume-project-1",
      category: "project",
      title: "Campus service mini app",
      summary: "Owned requirement notes and front-end presentation for a student tool.",
      month: 28,
      tags: ["product", "frontend"]
    },
    {
      id: "resume-internship-1",
      category: "internship",
      title: "Summer operations internship",
      summary: "Handled event wrap-ups and user feedback summaries.",
      month: 31,
      tags: ["internship", "review"]
    }
  ],
  notableFacts: [
    "Early semesters were uneven but never spiraled into long-term failure.",
    "Projects and internships were added steadily in the final two years.",
    "The graduation outcome came from the rule layer; AI only rewrites the summary."
  ]
};

export const demoTimeBlocks: DemoTimeBlock[] = [
  { label: "Mon day", kind: "busy_day", detail: "Required classes and roll call." },
  { label: "Mon night", kind: "half_free", detail: "Club meeting leaves a lighter action slot." },
  { label: "Tue day", kind: "free", detail: "Open block for study or part-time work." },
  { label: "Tue night", kind: "free", detail: "Good slot for social, relax, or remedy." },
  { label: "Wed day", kind: "busy_day", detail: "Lab class takes the whole day block." },
  { label: "Wed night", kind: "half_free", detail: "Group rehearsal uses part of the night." }
];

export const demoActionOptions: DemoActionOption[] = [
  {
    id: "action-study",
    title: "Catch up on midterm review",
    type: "study",
    cost: "Uses one full free block",
    payoff: "Academic stability improves and stress eases a bit",
    risk: "Mood payoff is slower than leisure choices"
  },
  {
    id: "action-activity",
    title: "Attend the campus project briefing",
    type: "student_activity",
    cost: "Uses one half-free block",
    payoff: "Can create a resume entry or follow-up opportunity",
    risk: "Stress can rise if the month is already overloaded"
  },
  {
    id: "action-social",
    title: "Go out with roommates",
    type: "social",
    cost: "Uses one half-free block",
    payoff: "Mood and social value rebound",
    risk: "Too many repeats can slow academic progress"
  }
];

export const demoMonthlyHistory: DemoHistoryEntry[] = [
  {
    monthLabel: "Year 1 Sep",
    title: "Settling into campus life",
    summary: "Most energy went into classes and clubs while a stable rhythm formed.",
    tone: "flat"
  },
  {
    monthLabel: "Year 1 Mar",
    title: "First resume-worthy activity",
    summary: "A volunteer roadshow filled an empty resume gap and stabilized study habits.",
    tone: "up"
  },
  {
    monthLabel: "Year 2 Nov",
    title: "Short-term loss of balance",
    summary: "Too much leisure pushed stress upward before remedy actions pulled things back.",
    tone: "down"
  }
];

export const demoResumeItems: ResumeItem[] = [
  {
    id: "resume-campus-demo",
    category: "campus_activity",
    title: "Campus roadshow volunteer",
    summary: "Coordinated on-site flow and logistics for a college event.",
    month: 3,
    tags: ["execution", "communication"]
  },
  {
    id: "resume-project-1",
    category: "project",
    title: "Campus service mini app",
    summary: "Joined interviews and demo work for a student-facing product project.",
    month: 16,
    tags: ["project", "collaboration"]
  },
  {
    id: "resume-internship-1",
    category: "internship",
    title: "Summer operations internship",
    summary: "Produced weekly notes, event recaps, and lightweight data cleanup.",
    month: 31,
    tags: ["internship", "operations"]
  }
];

export const demoJournalMarkdown = renderMonthlyJournalFallback({
  kind: "monthly_journal",
  runId: "demo-run-ui",
  year: 1,
  month: demoMonthlySummary.month,
  summary: demoMonthlySummary
}).markdown;

export const demoEndingMarkdown = renderEndingReportFallback({
  kind: "ending_report",
  runId: "demo-run-ui",
  summary: demoEndingSummary
}).markdown;

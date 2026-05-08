import { describe, expect, it } from "vitest";
import type { GameRun, StructuredEndingSummary, StructuredMonthlySummary } from "@/types/game";
import {
  buildAiReportInsert,
  buildEventLogInsert,
  buildMonthlyStateInsert,
  buildResumeItemInsert,
  buildRunInsert,
  buildRunUpdate
} from "@/lib/supabase/repository";

const sampleRun: GameRun = {
  id: "run_local_1",
  status: "active",
  currentYear: 1,
  currentMonth: 1,
  currentSemester: 1,
  profile: {
    talents: ["quick-learner"],
    familyBackground: "ordinary",
    monthlyAllowance: 1500,
    luck: 60,
    collegeTrack: "engineering",
    schoolTier: "211",
    cityTier: "tier_2"
  },
  stats: {
    money: 3000,
    mood: 70,
    stress: 25,
    fulfillment: 55,
    social: 45,
    semesterAcademics: 80
  },
  semesterAverage: 80,
  resume: [],
  logLineIds: [],
  monthlySummaries: [],
  semesters: [],
  cooldowns: {
    askFamilyMonths: 0
  },
  risk: {
    academicRisk: 10,
    burnout: 5
  },
  riskFlags: []
};

const monthlySummary: StructuredMonthlySummary = {
  month: 1,
  actions: ["study", "social"],
  attendanceStrategy: "serious",
  weeklyCalendar: [],
  schedule: [
    {
      day: 1,
      dayType: "free",
      availableTimes: ["day", "night"]
    }
  ],
  statsBefore: sampleRun.stats,
  statsAfter: {
    ...sampleRun.stats,
    mood: 75,
    stress: 30
  },
  statsDelta: {
    money: 0,
    mood: 5,
    stress: 5,
    fulfillment: 0,
    social: 0,
    semesterAcademics: 0
  },
  moneyDelta: 0,
  academicFeedback: "stable",
  eventIds: ["event_midterm"],
  resumeAdditions: [],
  notableFacts: ["Passed the first monthly checkpoint."],
  resolvedActions: [
    {
      action: "study",
      time: "day",
      accepted: true
    }
  ],
  flags: [],
  cooldowns: {
    askFamilyMonths: 0
  },
  course: {
    strategy: "serious",
    attendanceCounted: true,
    directRollCallPenalty: 0,
    rollCallRiskDelta: 0,
    usualScoreRiskDelta: 0,
    proxyCost: 0,
    remedyPressure: 0,
    academicRiskDelta: -2,
    academicGain: 5,
    moodDelta: -1,
    stressDelta: 0,
  },
  turns: [],
};

const endingSummary: StructuredEndingSummary = {
  finalYear: 4,
  outcome: "graduate",
  longTermAcademicAverage: 84,
  resumeHighlights: [],
  notableFacts: ["Graduated on time."]
};

describe("supabase repository payload builders", () => {
  it("builds a run insert payload from the structured game state", () => {
    const payload = buildRunInsert({
      id: sampleRun.id,
      profile: sampleRun.profile,
      currentState: sampleRun,
      currentYear: sampleRun.currentYear,
      currentMonth: sampleRun.currentMonth
    });

    expect(payload).toMatchObject({
      id: "run_local_1",
      status: "active",
      current_year: 1,
      current_month: 1,
      profile_json: sampleRun.profile,
      current_state_json: sampleRun
    });
  });

  it("builds a run update payload without forcing unrelated fields", () => {
    const payload = buildRunUpdate({
      status: "completed",
      currentMonth: 2
    });

    expect(payload).toEqual({
      status: "completed",
      current_month: 2
    });
  });

  it("builds a monthly state insert payload with run and calendar coordinates", () => {
    const payload = buildMonthlyStateInsert({
      runId: "run_local_1",
      year: 1,
      month: 1,
      snapshot: monthlySummary
    });

    expect(payload).toEqual({
      run_id: "run_local_1",
      year: 1,
      month: 1,
      snapshot_json: monthlySummary
    });
  });

  it("builds an event log insert payload with metadata defaults", () => {
    const payload = buildEventLogInsert({
      runId: "run_local_1",
      year: 1,
      month: 1,
      logType: "event",
      message: "Won a scholarship."
    });

    expect(payload).toEqual({
      run_id: "run_local_1",
      year: 1,
      month: 1,
      log_type: "event",
      message: "Won a scholarship.",
      metadata_json: {}
    });
  });

  it("builds an ai report insert payload for ending reports with nullable month", () => {
    const payload = buildAiReportInsert({
      runId: "run_local_1",
      reportType: "ending_report",
      year: 4,
      month: null,
      inputSummary: endingSummary,
      outputMarkdown: "# Ending",
      model: "gpt-5-mini"
    });

    expect(payload).toEqual({
      run_id: "run_local_1",
      report_type: "ending_report",
      year: 4,
      month: null,
      input_summary_json: endingSummary,
      output_markdown: "# Ending",
      model: "gpt-5-mini"
    });
  });

  it("builds a resume item insert payload and preserves source id in metadata", () => {
    const payload = buildResumeItemInsert({
      runId: "run_local_1",
      year: 2,
      month: 3,
      category: "project",
      title: "Campus App",
      summary: "Built a student tool.",
      sourceItemId: "resume_1",
      metadata: {
        tags: ["frontend", "hackathon"]
      }
    });

    expect(payload).toEqual({
      run_id: "run_local_1",
      year: 2,
      month: 3,
      category: "project",
      title: "Campus App",
      summary: "Built a student tool.",
      source_item_id: "resume_1",
      metadata_json: {
        tags: ["frontend", "hackathon"]
      }
    });
  });
});

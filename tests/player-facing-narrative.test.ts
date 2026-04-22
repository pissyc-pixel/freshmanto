import { describe, expect, it } from "vitest";

import { renderEndingReportFallback, renderMonthlyJournalFallback } from "@/lib/ai/reports";
import {
  buildPlayerFacingMonthlyLog,
  formatActionType,
  formatAttendanceStrategy,
  formatMonthLabel,
} from "@/lib/demo/options";
import type { EndingReportPromptInput, MonthlyJournalPromptInput } from "@/types/ai";

const monthlyInput: MonthlyJournalPromptInput = {
  kind: "monthly_journal",
  runId: "run-1",
  year: 2,
  month: 3,
  summary: {
    month: 3,
    actions: ["study", "big_meal", "student_activity", "social"],
    attendanceStrategy: "mixed",
    schedule: [],
    weeklyCalendar: [],
    statsBefore: {
      money: 1200,
      mood: 62,
      stress: 38,
      fulfillment: 45,
      social: 50,
      semesterAcademics: 61,
    },
    statsAfter: {
      money: 960,
      mood: 68,
      stress: 42,
      fulfillment: 57,
      social: 58,
      semesterAcademics: 74,
    },
    statsDelta: {
      money: -240,
      mood: 6,
      stress: 4,
      fulfillment: 12,
      social: 8,
      semesterAcademics: 13,
    },
    moneyDelta: -240,
    academicFeedback: "stable",
    eventIds: ["monthly-living-expense", "academic-scholarship"],
    resumeAdditions: [
      {
        id: "resume-1",
        category: "campus_activity",
        title: "组织院系分享会",
        summary: "负责活动统筹和现场执行",
        month: 3,
        tags: ["活动", "组织"],
      },
    ],
    notableFacts: [
      "allowance:1500",
      "event:monthly-living-expense:920",
      "roll-call-risk:2",
      "月底把课程进度补了回来",
    ],
    resolvedActions: [],
    flags: ["study-diminishing-returns"],
    cooldowns: {
      askFamilyMonths: 0,
    },
    course: {
      strategy: "mixed",
      attendanceCounted: true,
      directRollCallPenalty: 0,
      rollCallRiskDelta: 1,
      usualScoreRiskDelta: 1,
      proxyCost: 0,
      remedyPressure: 0,
      academicRiskDelta: 1,
      academicGain: 8,
      moodDelta: -1,
      stressDelta: 1,
    },
    turns: [
      {
        turn: 1,
        week: 1,
        slotLabel: "Week 1",
        advancesCalendar: true,
        attendanceStrategy: "mixed",
        chosenAction: { action: "study", time: "night" },
        resolvedAction: { action: "study", time: "night", accepted: true },
        statsBefore: {
          money: 1200,
          mood: 62,
          stress: 38,
          fulfillment: 45,
          social: 50,
          semesterAcademics: 61,
        },
        statsAfter: {
          money: 1200,
          mood: 61,
          stress: 43,
          fulfillment: 47,
          social: 50,
          semesterAcademics: 68,
        },
        statsDelta: {
          money: 0,
          mood: -1,
          stress: 5,
          fulfillment: 2,
          social: 0,
          semesterAcademics: 7,
        },
        moneyDelta: 0,
        flags: ["study-diminishing-returns"],
        notableFacts: ["roll-call-risk:2"],
        allowanceApplied: true,
        course: {
          strategy: "mixed",
          attendanceCounted: true,
          directRollCallPenalty: 0,
          rollCallRiskDelta: 1,
          usualScoreRiskDelta: 1,
          proxyCost: 0,
          remedyPressure: 0,
          academicRiskDelta: 1,
          academicGain: 8,
          moodDelta: -1,
          stressDelta: 1,
        },
      },
      {
        turn: 2,
        week: 1,
        slotLabel: "Week 1",
        advancesCalendar: false,
        attendanceStrategy: "mixed",
        chosenAction: { action: "big_meal", time: "night" },
        resolvedAction: { action: "big_meal", time: "night", accepted: true },
        statsBefore: {
          money: 1200,
          mood: 61,
          stress: 43,
          fulfillment: 47,
          social: 50,
          semesterAcademics: 68,
        },
        statsAfter: {
          money: 1020,
          mood: 69,
          stress: 37,
          fulfillment: 48,
          social: 50,
          semesterAcademics: 68,
        },
        statsDelta: {
          money: -180,
          mood: 8,
          stress: -6,
          fulfillment: 1,
          social: 0,
          semesterAcademics: 0,
        },
        moneyDelta: -180,
        flags: [],
        notableFacts: [],
        allowanceApplied: false,
        course: {
          strategy: "mixed",
          attendanceCounted: true,
          directRollCallPenalty: 0,
          rollCallRiskDelta: 0,
          usualScoreRiskDelta: 0,
          proxyCost: 0,
          remedyPressure: 0,
          academicRiskDelta: 0,
          academicGain: 0,
          moodDelta: 0,
          stressDelta: 0,
        },
      },
    ],
  },
};

const endingInput: EndingReportPromptInput = {
  kind: "ending_report",
  runId: "run-1",
  summary: {
    finalYear: 4,
    outcome: "graduate",
    longTermAcademicAverage: 81,
    resumeHighlights: [
      {
        id: "resume-a",
        category: "project",
        title: "校园服务平台项目",
        summary: "负责产品方案与落地",
        month: 10,
        tags: ["项目"],
      },
    ],
    notableFacts: ["failed-semesters:1", "risk-flags:2"],
  },
};

describe("player-facing narrative helpers", () => {
  it("formats Chinese labels for month and rule-derived options", () => {
    expect(formatMonthLabel(2, 3)).toBe("第2学年 · 第3月");
    expect(formatAttendanceStrategy("mixed")).toBe("正常混课");
    expect(formatActionType("student_activity")).toBe("学生活动 / 讲座 / 社团");
    expect(formatActionType("big_meal")).toBe("吃大餐");
  });

  it("builds a player-facing monthly log from structured summary only", () => {
    const log = buildPlayerFacingMonthlyLog(monthlyInput.summary, 2, 3);

    expect(log.badge).toBe("本月回顾");
    expect(log.periodLabel).toBe("第2学年 · 第3月");
    expect(log.title).toContain("这个月");
    expect(log.message).toContain("正常混课");
    expect(log.message).toContain("复习 / 学习");
    expect(log.message).toContain("吃大餐");
    expect(log.details.some((detail) => detail.includes("没有额外推进周历"))).toBe(true);
    expect(log.details).toContain("房租、吃饭和日常开销一共扣掉了 920 元固定生活成本。");
    expect(log.details).toContain("履历新增了“组织院系分享会”。");
  });

  it("renders a humanized monthly journal fallback without inventing facts", () => {
    const report = renderMonthlyJournalFallback(monthlyInput);

    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("# 第2学年 第3月");
    expect(report.markdown).toContain("这个月我主要把心思放在");
    expect(report.markdown).toContain("正常混课");
    expect(report.markdown).toContain("组织院系分享会");
    expect(report.markdown).toContain("没有额外推进周历");
    expect(report.markdown).not.toContain("绩点");
  });

  it("renders a grounded ending fallback in first-person voice", () => {
    const report = renderEndingReportFallback(endingInput);

    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("# 毕业回望");
    expect(report.markdown).toContain("我最后还是顺利毕业了");
    expect(report.markdown).toContain("校园服务平台项目");
    expect(report.markdown).toContain("累计未通过学期数：1");
    expect(report.markdown).toContain("长期风险标签累计 2 个");
    expect(report.markdown).not.toContain("failed-semesters:1");
  });
});

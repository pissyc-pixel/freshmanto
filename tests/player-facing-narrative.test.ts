import { describe, expect, it } from "vitest";

import { renderEndingReportFallback, renderMonthlyJournalFallback } from "@/lib/ai/reports";
import {
  buildPlayerFacingMonthlyLog,
  formatActionType,
  formatAttendanceStrategy,
  formatMonthLabel
} from "@/lib/demo/options";
import type { EndingReportPromptInput, MonthlyJournalPromptInput } from "@/types/ai";

const monthlyInput: MonthlyJournalPromptInput = {
  kind: "monthly_journal",
  runId: "run-1",
  year: 2,
  month: 3,
  summary: {
    month: 3,
    actions: ["study", "student_activity", "social"],
    attendanceStrategy: "mixed",
    schedule: [],
    statsBefore: {
      money: 1200,
      mood: 62,
      stress: 38,
      fulfillment: 45,
      social: 50,
      semesterAcademics: 61
    },
    statsAfter: {
      money: 960,
      mood: 68,
      stress: 42,
      fulfillment: 57,
      social: 58,
      semesterAcademics: 74
    },
    statsDelta: {
      money: -240,
      mood: 6,
      stress: 4,
      fulfillment: 12,
      social: 8,
      semesterAcademics: 13
    },
    moneyDelta: -240,
    academicFeedback: "stable",
    eventIds: ["club-night"],
    resumeAdditions: [
      {
        id: "resume-1",
        category: "campus_activity",
        title: "组织院系分享会",
        summary: "负责活动统筹和现场执行",
        month: 3,
        tags: ["活动", "组织"]
      }
    ],
    notableFacts: ["参加了院系分享会筹备", "月底把课程进度补了回来"],
    resolvedActions: [],
    flags: [],
    cooldowns: {
      askFamilyMonths: 0
    },
    course: {
      strategy: "mixed",
      attendanceCounted: true,
      directRollCallPenalty: 0,
      academicRiskDelta: 0,
      academicGain: 8,
      moodDelta: -1
    }
  }
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
        tags: ["项目"]
      }
    ],
    notableFacts: ["大四完成毕业要求", "拿到校招 offer"]
  }
};

describe("player-facing narrative helpers", () => {
  it("formats Chinese labels for month and rule-derived options", () => {
    expect(formatMonthLabel(2, 3)).toBe("第2学年 · 第3月");
    expect(formatAttendanceStrategy("mixed")).toBe("正常混课");
    expect(formatActionType("student_activity")).toBe("学生活动 / 讲座 / 社团");
  });

  it("builds a player-facing monthly log from structured summary only", () => {
    const log = buildPlayerFacingMonthlyLog(monthlyInput.summary, 2, 3);

    expect(log.badge).toBe("本月回顾");
    expect(log.periodLabel).toBe("第2学年 · 第3月");
    expect(log.title).toContain("这个月");
    expect(log.message).toContain("正常混课");
    expect(log.message).toContain("复习 / 学习");
    expect(log.details).toContain("参加了院系分享会筹备");
    expect(log.details).toContain("新增履历：组织院系分享会");
  });

  it("renders a humanized monthly journal fallback without inventing facts", () => {
    const report = renderMonthlyJournalFallback(monthlyInput);

    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("# 第2学年 第3月");
    expect(report.markdown).toContain("这个月我主要把心思放在");
    expect(report.markdown).toContain("正常混课");
    expect(report.markdown).toContain("组织院系分享会");
    expect(report.markdown).not.toContain("绩点");
  });

  it("renders a grounded ending fallback in first-person voice", () => {
    const report = renderEndingReportFallback(endingInput);

    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("# 毕业回望");
    expect(report.markdown).toContain("我最后还是顺利毕业了");
    expect(report.markdown).toContain("校园服务平台项目");
    expect(report.markdown).toContain("拿到校招 offer");
  });
});

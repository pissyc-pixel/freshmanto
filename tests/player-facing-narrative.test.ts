import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActionResultCard } from "@/components/action-result-card";
import {
  actionOptions,
  skipClassDayOptions,
} from "@/components/action-plan-form-options";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import { LogFeed } from "@/components/log-feed";
import { ReportPreview } from "@/components/report-preview";
import { buildEndingReportPrompt } from "@/core/prompts/ending-report";
import { buildMonthlyJournalPrompt } from "@/core/prompts/monthly-journal";
import {
  actionEventTemplates,
  starterEventTemplates,
} from "@/data/events";
import {
  attendanceStrategyOptions,
  formatActionType,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
  formatTimeBlockKind,
  formatWeeklyDayType,
} from "@/lib/demo/options";
import {
  renderEndingReportFallback,
  renderMonthlyJournalFallback,
} from "@/lib/ai/reports";
import { buildGrowthJournalEntry, buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import type {
  EndingReportPromptInput,
  MonthlyJournalPromptInput,
} from "@/types/ai";

const eventTemplates = [...starterEventTemplates, ...actionEventTemplates];

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
        slotLabel: "第 1 周",
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
        slotLabel: "第 1 周",
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
  it("keeps raw internal action keys out of game page player copy", () => {
    const pageSource = readFileSync("app/game/page.tsx", "utf-8");

    expect(pageSource).not.toContain("skip_class 会");
  });

  it("formats skip class as natural Chinese instead of an internal action key", () => {
    const label = formatActionType("skip_class");

    expect(label).toContain("不去上课");
    expect(label).not.toBe("skip_class");
    expect(label).not.toContain("skip_class");
  });

  it("formats action event flags as natural Chinese without leaking internal keys", () => {
    const flags = [
      "instant-event:cash-crunch",
      "instant-event:stress-spillover",
      "instant-event:study-group-help",
      "instant-event:teacher-nudge",
      "insufficient-week-time",
    ];

    for (const flag of flags) {
      const formatted = formatPlayerFacingFlag(flag);

      expect(formatted).not.toBe(flag);
      expect(formatted).not.toContain(flag);
      expect(formatted).not.toContain("instant-event");
      expect(formatted).not.toContain("insufficient-week-time");
    }
  });

  it("formats collapsed study efficiency as player-facing Chinese instead of leaking the raw flag", () => {
    const formatted = formatPlayerFacingFlag("study-efficiency-collapsed");

    expect(formatted).not.toBe("study-efficiency-collapsed");
    expect(formatted).not.toContain("study-efficiency-collapsed");
  });

  it("formats action event notable facts as player-facing Chinese", () => {
    const facts = [
      "event:cash-crunch",
      "event:stress-spillover",
      "event:study-group-help",
      "event:teacher-nudge",
    ];

    for (const fact of facts) {
      const formatted = formatPlayerFacingFact(fact);

      expect(formatted).not.toBe(fact);
      expect(formatted).not.toContain(fact);
      expect(formatted).not.toContain("event:");
    }
  });

  it("sanitizes weekly internal fact keys like daily-living-cost before they reach player-facing copy", () => {
    const formatted = formatPlayerFacingFact("daily-living-cost:95");

    expect(formatted).not.toContain("daily-living-cost");
    expect(formatted).not.toContain(":95");
    expect(formatted).toContain("日常");
  });

  it.each(
    eventTemplates
      .map((template) => ({
        eventId: template.id,
        fact: template.effect.notableFact,
      }))
      .filter(
        (entry): entry is { eventId: string; fact: string } =>
          typeof entry.fact === "string" && entry.fact.startsWith("event:"),
      ),
  )("formats event notable fact for $eventId without leaking the raw fact", ({ fact }) => {
    const formatted = formatPlayerFacingFact(fact);

    expect(formatted).not.toBe(fact);
    expect(formatted).not.toContain("event:");
  });

  it.each(
    eventTemplates.flatMap((template) =>
      (template.effect.flags ?? []).map((flag) => ({
        eventId: template.id,
        flag,
      })),
    ),
  )("formats event flag for $eventId without leaking the raw flag", ({ flag }) => {
    const formatted = formatPlayerFacingFlag(flag);

    expect(formatted).not.toBe(flag);
    if (flag.includes(":")) {
      expect(formatted).not.toContain(flag);
    }
  });

  it("renders action planning options in natural Chinese", () => {
    expect(actionOptions.find((item) => item.value === "study")).toMatchObject({
      label: "复习 / 学习",
    });
    expect(actionOptions.find((item) => item.value === "study")?.description).toContain("耗时");
    expect(actionOptions.find((item) => item.value === "study")?.description).not.toContain("Cost");
    expect(actionOptions.find((item) => item.value === "big_meal")?.description).not.toContain("half-day");
    expect(skipClassDayOptions.map((item) => item.label)).toEqual([
      "周一白天",
      "周三白天",
      "周五白天",
    ]);
  });

  it("uses the unified 白天满课 wording in planner-facing schedule labels", () => {
    expect(formatTimeBlockKind("busy_day")).toContain("白天满课");
    expect(formatWeeklyDayType("night_only")).toContain("白天满课");
  });

  it("keeps truancy out of weekly attendance strategy options", () => {
    expect(attendanceStrategyOptions.map((item) => item.value)).toEqual([
      "serious",
      "mixed",
      "phone",
    ]);
    expect(attendanceStrategyOptions.map((item) => item.label).join("、")).not.toContain("翘课");
    expect(actionOptions.find((item) => item.value === "skip_class")?.label).toContain("不去上课");
  });

  it("renders a player-readable action result card with time impact and next-step guidance", () => {
    const markup = renderToStaticMarkup(
      createElement(ActionResultCard, {
        turn: monthlyInput.summary.turns[1],
        eventLines: [
          "这一轮没有额外事件，吃顿好的只是先把状态稳住。",
        ],
        nextStepHint: "这周时间还没推进，你还能继续安排本周的正式行动。",
      }),
    );

    expect(markup).toContain("本次行动结果");
    expect(markup).toContain("第 1 周");
    expect(markup).toContain("夜间");
    expect(markup).toContain("时间");
    expect(markup).toContain("本周还没推进");
    expect(markup).toContain("金钱 -180");
    expect(markup).toContain("心情 +8");
    expect(markup).toContain("压力 -6");
    expect(markup).toContain("学业 0");
    expect(markup).toContain("这周时间还没推进，你还能继续安排本周的正式行动");
    expect(markup).not.toContain("系统");
  });

  it("renders action-specific humane outcome sentences", () => {
    const bigMealMarkup = renderToStaticMarkup(
      createElement(ActionResultCard, {
        turn: monthlyInput.summary.turns[1],
        nextStepHint: "这周时间还没推进，你还能继续安排正式行动。",
      }),
    );
    const skipClassMarkup = renderToStaticMarkup(
      createElement(ActionResultCard, {
        turn: {
          ...monthlyInput.summary.turns[1],
          chosenAction: { action: "skip_class", time: "day", skipClassDays: ["mon"] },
          resolvedAction: { action: "skip_class", time: "day", accepted: true, skipClassDays: ["mon"] },
          statsDelta: {
            money: 0,
            mood: 2,
            stress: -1,
            fulfillment: 0,
            social: 0,
            semesterAcademics: 0,
          },
          releasedClassDays: ["mon"],
          notableFacts: ["skip_class released mon daytime blocks"],
        },
        nextStepHint: "你刚腾出了白天，可以继续安排这一周的行动。",
      }),
    );

    expect(bigMealMarkup).toContain("这顿大餐有点奢侈");
    expect(bigMealMarkup).toContain("吃完确实舒服多了");
    expect(skipClassMarkup).toContain("短时间轻松了");
    expect(skipClassMarkup).toContain("埋下了一点隐患");
  });

  it("renders player log feed copy in natural Chinese", () => {
    const playerMarkup = renderToStaticMarkup(
      createElement(LogFeed, {
        variant: "player",
        items: [
          {
            message: "这个月我主要还是一边混课，一边把手头状态拉回来。",
            details: ["月底终于把课程进度补上来了。"],
            year: 2,
            month: 3,
          },
        ],
      }),
    );
    const emptyMarkup = renderToStaticMarkup(
      createElement(LogFeed, {
        variant: "player",
        items: [],
      }),
    );

    expect(playerMarkup).toContain("本月回顾");
    expect(playerMarkup).toContain("这几件事我还记得");
    expect(playerMarkup).not.toContain("玩家回顾");
    expect(emptyMarkup).toContain("这里暂时还没有可回看的记录");
  });

  it("does not render raw English status labels in partial notices", () => {
    const markup = renderToStaticMarkup(
      createElement(FmPartialNotice, {
        title: "当前阶段尚未形成明确方向",
        body: "目前只展示已经落地的真实证据。",
      }),
    );

    expect(markup).not.toContain(">partial<");
    expect(markup).toContain("当前阶段尚未形成明确方向");
  });

  it("renders a humanized monthly journal fallback without inventing facts", () => {
    const report = renderMonthlyJournalFallback(monthlyInput);

    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("# 第2学年");
    expect(report.markdown).toContain("我");
    expect(report.markdown).not.toContain("整体而言");
    expect(report.markdown).not.toContain("这个月主要");
    expect(report.markdown).not.toContain("综上");
    expect(report.markdown).not.toContain("总体来说");
    expect(report.markdown).not.toContain("月度状态");
    expect(report.markdown).not.toContain("本月数据如下");
    expect(report.markdown).not.toContain("余额 960");
    expect(report.markdown).not.toContain("心情 68");
    expect(report.markdown).not.toContain("压力 42");
    expect(report.markdown).not.toContain("statsDelta");
    expect(report.markdown).not.toContain("eventIds");
    expect(report.markdown).not.toContain("moneyDelta");
    expect(report.markdown).not.toContain("fallback");
    expect(report.markdown).not.toContain("monthly");
    expect(report.markdown).not.toContain("project");
    expect(report.markdown).not.toContain("internship");
    expect(report.markdown).not.toContain("scholarship");
  });

  it("keeps monthly digest and fallback stable for legacy partial summaries", () => {
    const legacySummary = {
      ...monthlyInput.summary,
      actions: undefined,
      eventIds: undefined,
      resumeAdditions: undefined,
      notableFacts: undefined,
      resolvedActions: undefined,
      flags: undefined,
      statsDelta: undefined,
    } as unknown as MonthlyJournalPromptInput["summary"];
    const digest = buildMonthlyDiaryDigest(legacySummary, 2, 3);
    const journal = buildGrowthJournalEntry(legacySummary, 2, 3);
    const report = renderMonthlyJournalFallback({
      ...monthlyInput,
      summary: legacySummary,
    });

    expect(digest.mainActions).toEqual([]);
    expect(journal.title.length).toBeGreaterThan(0);
    expect(report.markdown).toContain("#");
    expect(report.usedFallback).toBe(true);
    expect(report.markdown).toContain("我");
    expect(report.markdown).not.toContain("本月数据如下");
  });

  it("does not fabricate GPA lines in monthly digest or fallback when the semester has not settled yet", () => {
    const unsettledSummary = {
      ...monthlyInput.summary,
      academicProfile: {
        gpa: null,
        rank: null,
        percentile: null,
        recommendationScore: 26,
      },
    };
    const digest = buildMonthlyDiaryDigest(unsettledSummary, 2, 3);
    const report = renderMonthlyJournalFallback({
      ...monthlyInput,
      summary: unsettledSummary,
    });

    expect(JSON.stringify(digest)).not.toContain("3.00");
    expect(report.markdown).not.toContain("GPA");
    expect(report.markdown).not.toContain("排名");
    expect(report.markdown).not.toContain("百分位");
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
    expect(report.markdown).not.toContain("规则层");
  });

  it("hides structured prompt JSON from player-facing report preview by default", () => {
    const markup = renderToStaticMarkup(
      createElement(ReportPreview, {
        title: "第 2 学年 · 第 3 月月记",
        contractLabel: "fallback",
        promptInput: {
          runId: "run-1",
          summary: {
            eventIds: ["monthly-living-expense"],
          },
        },
        markdown: "这个月我总算缓过来一点了。",
      }),
    );

    expect(markup).toContain("玩家可见正文");
    expect(markup).toContain("默认隐藏");
    expect(markup).not.toContain("\"runId\"");
    expect(markup).not.toContain("\"eventIds\"");
  });

  it("builds prompts that insist on first-person narration and reject system wording", () => {
    const monthlyPrompt = buildMonthlyJournalPrompt(monthlyInput);
    const endingPrompt = buildEndingReportPrompt(endingInput);
    const monthlyPromptText = monthlyPrompt.messages
      .map((message) => message.content)
      .join("\n");
    const endingPromptText = endingPrompt.messages
      .map((message) => message.content)
      .join("\n");

    expect(monthlyPromptText).toContain("第一人称");
    expect(monthlyPromptText).toContain("不要写成系统播报");
    expect(monthlyPromptText).toContain("AI 只负责表达");
    expect(monthlyPromptText).toMatch(
      /不要出现.*规则层|不要出现.*系统判定|不要原样复述.*字段名/,
    );
    expect(endingPromptText).toContain("第一人称毕业回望");
    expect(endingPromptText).toContain("不要写成系统汇报");
    expect(endingPromptText).toContain("只负责表达");
    expect(endingPromptText).toMatch(
      /不要出现.*规则层|不要出现.*系统判定|不要原样复述.*机器字段/,
    );
  });

  it("builds monthly journal prompts from compact monthly facts instead of raw turn history", () => {
    const monthlyPrompt = buildMonthlyJournalPrompt(monthlyInput);
    const promptText = monthlyPrompt.messages.map((message) => message.content).join("\n");

    expect(promptText).toContain("每周结算摘要");
    expect(promptText).toContain("主要行动分布");
    expect(promptText).not.toContain("\"turns\"");
    expect(promptText).not.toContain("\"resolvedActions\"");
    expect(promptText).not.toContain("\"runId\"");
    expect(promptText).not.toContain("OPENAI_API_KEY");
  });
});

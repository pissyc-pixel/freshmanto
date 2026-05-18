import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo/server", () => ({
  getServerEndingPreview: vi.fn(),
}));

import EndingPage from "@/app/ending/page";
import { getServerEndingPreview } from "@/lib/demo/server";

const mockedGetServerEndingPreview = vi.mocked(getServerEndingPreview);

describe("ending page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders player-facing ending labels instead of leaking internal enum values", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-readable-labels",
        status: "active",
        currentYear: 4,
        currentMonth: 8,
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 82,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "recommendation",
        pathResult: "ordinary",
        recommendationQualification: "eligible",
        dominantDirection: "public_exam",
        publicExamProgress: 32,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-readable-labels",
        }),
      }),
    );

    expect(markup).toContain("推免资格状态：已具备推免竞争力");
    expect(markup).toContain("长期主导倾向：公考");
    expect(markup).not.toContain("recommendationQualification");
    expect(markup).not.toContain("eligible");
    expect(markup).not.toContain("public_exam");
  });

  it("keeps the completed ending preview anchored to the final graduation month", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-completed-month",
        status: "completed",
        currentYear: 5,
        currentMonth: 1,
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 86,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "employment",
        pathResult: "success",
        recommendationQualification: "pending",
        dominantDirection: "employment",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-completed-month",
        }),
      }),
    );

    expect(markup).toContain("当前学年位置：第4学年 · 第12月");
    expect(markup).toContain("正式结局回望暂未存档");
    expect(markup).not.toContain("当前学年位置：第4学年 · 第1月");
    expect(markup).not.toContain("结局回望尚未落地");
  });

  it("renders a formal employment offer document for a completed employment ending", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-employment-offer",
        status: "completed",
        currentYear: 4,
        currentMonth: 12,
        profile: {
          name: "就业路线玩家",
          talents: [],
          familyBackground: "ordinary",
          monthlyAllowance: 1500,
          luck: 50,
          collegeTrack: "business",
          schoolTier: "211",
          cityTier: "tier_2",
        },
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 84,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "employment",
        pathResult: "success",
        recommendationQualification: "pending",
        dominantDirection: "employment",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-employment-offer",
        }),
      }),
    );

    expect(markup).toContain("正式结果文件");
    expect(markup).toContain("Offer Letter");
  });

  it("renders a formal recommendation document for a completed recommendation ending", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-recommendation-offer",
        status: "completed",
        currentYear: 4,
        currentMonth: 12,
        profile: {
          name: "推免路线玩家",
          talents: [],
          familyBackground: "ordinary",
          monthlyAllowance: 1500,
          luck: 50,
          collegeTrack: "engineering",
          schoolTier: "nankai_tianda",
          cityTier: "tier_2",
        },
        progression: {
          tendencies: {
            employment: 10,
            postgraduate: 50,
            public_exam: 2,
            recommendation: 90,
            undecided: 0,
          },
          dominantDirection: "recommendation",
          publicExam: {
            progress: 0,
            aptitudePrep: 0,
            essayPrep: 0,
          },
          postgraduateProgress: 58,
          employmentReadiness: 14,
          recommendationReadiness: 86,
          recommendationQualification: "eligible",
          latestHints: [],
        },
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 86,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "recommendation",
        pathResult: "success",
        recommendationQualification: "eligible",
        dominantDirection: "recommendation",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-recommendation-offer",
        }),
      }),
    );

    expect(markup).toContain("正式结果文件");
    expect(markup).toContain("推免接收函");
  });

  it("renders a formal postgraduate admission document for a completed postgraduate ending", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-postgraduate-offer",
        status: "completed",
        currentYear: 4,
        currentMonth: 12,
        profile: {
          name: "考研路线玩家",
          talents: [],
          familyBackground: "ordinary",
          monthlyAllowance: 1500,
          luck: 50,
          collegeTrack: "science",
          schoolTier: "211",
          cityTier: "tier_2",
        },
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 82,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "postgraduate_exam",
        pathResult: "success",
        recommendationQualification: "unlikely",
        dominantDirection: "postgraduate",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-postgraduate-offer",
        }),
      }),
    );

    expect(markup).toContain("正式结果文件");
    expect(markup).toContain("硕士研究生录取通知书");
  });

  it("renders the month-2 ending preview safely for a legacy save with missing activeMonth details", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-month-two-legacy",
        status: "active",
        currentYear: 1,
        currentMonth: 2,
        activeMonth: {
          year: 1,
          month: 2,
          currentWeek: 1,
          totalWeeks: 4,
          allowanceApplied: true,
          cooldownsAtStart: { askFamilyMonths: 0 },
          weeklyCalendar: [],
          currentWeekState: undefined,
          completedWeeks: [],
          statsAtStart: {
            money: 1200,
            mood: 60,
            stress: 30,
            fulfillment: 40,
            social: 35,
            semesterAcademics: 0,
          },
          turns: [],
        },
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 70,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "undecided",
        pathResult: "pivot",
        recommendationQualification: "pending",
        dominantDirection: "undecided",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-month-two-legacy",
        }),
      }),
    );

    expect(markup).toContain("未来还没有写完");
    expect(markup).toContain("当前学年位置：第1学年 · 第2月");
    expect(markup).toContain("关键证据");
  });
  it("renders saved ending evidence from the run state in the final report", async () => {
    mockedGetServerEndingPreview.mockResolvedValue({
      run: {
        id: "ending-run-saved-evidence",
        status: "completed",
        currentYear: 4,
        currentMonth: 12,
        endingEvidence: [
          {
            id: "saved-evidence-1",
            kind: "internship",
            title: "Saved Evidence Title",
            body: "Saved evidence body from actual run state.",
            monthIndex: 25,
          },
        ],
      },
      endingSummary: {
        finalYear: 4,
        outcome: "graduate",
        longTermAcademicAverage: 84,
        resumeHighlights: [],
        notableFacts: [],
        graduationPath: "employment",
        pathResult: "success",
        recommendationQualification: "pending",
        dominantDirection: "employment",
        publicExamProgress: 0,
      },
      savedEndingReport: null,
    } as never);

    const markup = renderToStaticMarkup(
      await EndingPage({
        searchParams: Promise.resolve({
          runId: "ending-run-saved-evidence",
        }),
      }),
    );

    expect(markup).toContain("Saved Evidence Title");
    expect(markup).toContain("Saved evidence body from actual run state.");
  });
});

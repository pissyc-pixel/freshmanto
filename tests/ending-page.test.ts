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

    expect(markup).toContain("第4学年 · 第12月");
    expect(markup).toContain("正式结局回望暂未存档");
  });

  it("renders a formal employment document for a completed employment ending", async () => {
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
    expect(markup).toContain("就业录用通知");
    expect(markup).toContain("人生去向");
    expect(markup).toContain("就业");
    expect(markup).not.toContain("你最后更接近的是");
    expect(markup).not.toContain("为什么会走到这个结局？");
    expect(markup).not.toContain("这里收着你四年里一步步走出来的结果。");
    expect(markup).not.toContain("毕业结果、去向和一路留下的证据，都会在这里回头看。");
    expect(markup).not.toContain("你把这四年过成了这样。");
    expect(markup).not.toContain("先看看四年最后落到了哪里。");
    expect(markup).not.toContain("最终结果");
    expect(markup).not.toContain("这不是突然给出的单点结论，而是四年里学业、风险和状态一路累积之后的落点。");
    expect(markup).not.toContain("如果这层结果已经形成，就在这里展示；没有时不硬编。");
    expect(markup).not.toContain(
      "这是根据最终结局事实生成的正式录取 / offer 文件，不补写未发生的学校、单位或录用细节。",
    );
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

  it("renders a formal postgraduate document for a completed postgraduate ending", async () => {
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
    expect(markup).toContain("硕士录取通知");
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
    expect(markup).toContain("关键证据");
  });

  it("keeps the final report focused on the ending document and letter instead of replaying raw evidence rows", async () => {
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

    expect(markup).not.toContain("Saved Evidence Title");
    expect(markup).not.toContain("Saved evidence body from actual run state.");
    expect(markup).not.toContain("存档证据链");
  });
});

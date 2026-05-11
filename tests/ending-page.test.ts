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
    expect(markup).not.toContain("当前学年位置：第4学年 · 第1月");
  });
});

import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import {
  acceptFutureOfferDecision,
  settleLongTermProgression,
} from "@/core/resolvers/progression";
import { normalizeSaveState } from "@/lib/demo/save-state";
import type { GameRun } from "@/types/game";

function createSettledRun(id: string, input?: Partial<GameRun>): GameRun {
  return normalizeSaveState({
    ...createInitialGameRun({
      id,
      name: "最终演示测试档",
      discipline: input?.profile?.collegeTrack ?? "business",
      randomValues: [0.82, 0.74, 0.68, 0.91, 0.77, 0.63, 0.88, 0.59],
    }),
    semesterAverage: 86,
    semesters: [
      { semester: 1, academicScore: 84, feedback: "excellent", passed: true },
      { semester: 2, academicScore: 86, feedback: "excellent", passed: true },
      { semester: 3, academicScore: 87, feedback: "excellent", passed: true },
      { semester: 4, academicScore: 88, feedback: "excellent", passed: true },
      { semester: 5, academicScore: 89, feedback: "excellent", passed: true },
      { semester: 6, academicScore: 88, feedback: "excellent", passed: true },
    ],
    stats: {
      money: 1800,
      mood: 58,
      stress: 52,
      fulfillment: 64,
      social: 55,
      semesterAcademics: 82,
    },
    progression: {
      tendencies: {
        employment: input?.progression?.tendencies.employment ?? 86,
        postgraduate: input?.progression?.tendencies.postgraduate ?? 36,
        public_exam: input?.progression?.tendencies.public_exam ?? 2,
        recommendation: input?.progression?.tendencies.recommendation ?? 38,
        undecided: 0,
      },
      dominantDirection: input?.progression?.dominantDirection ?? "employment",
      publicExam: { progress: 0, aptitudePrep: 0, essayPrep: 0 },
      postgraduateProgress: input?.progression?.postgraduateProgress ?? 34,
      employmentReadiness: input?.progression?.employmentReadiness ?? 72,
      recommendationReadiness: input?.progression?.recommendationReadiness ?? 44,
      recommendationQualification: input?.progression?.recommendationQualification ?? "pending",
      latestHints: [],
    },
    ...input,
  });
}

describe("final demo long-term rules", () => {
  it("normalizes the full final-demo memory fields for old saves", () => {
    const run = normalizeSaveState({
      id: "legacy-final-demo-run",
      currentYear: 2,
      currentMonth: 1,
    });

    expect(run.internshipRecords).toEqual([]);
    expect(run.futureOffers).toEqual([]);
    expect(run.acceptedOffer).toBeNull();
    expect(run.timelineNodes).toEqual([]);
    expect(run.monthlyLetters).toEqual([]);
    expect(run.endingEvidence).toEqual([]);
  });

  it("records scholarships at the documented academic-year review months without double paying", () => {
    const run = createSettledRun("scholarship-final-demo");

    const firstReview = settleLongTermProgression(run, { playedYear: 1, playedMonth: 12 });
    const duplicateReview = settleLongTermProgression(firstReview.run, { playedYear: 1, playedMonth: 12 });

    expect(firstReview.run.scholarships?.[0]).toMatchObject({
      academicYear: 1,
      amount: expect.any(Number),
    });
    expect(firstReview.notableFacts).toContain("milestone:scholarship-review:13");
    expect(firstReview.run.timelineNodes!.some((node) => node.kind === "scholarship" && node.monthIndex === 13)).toBe(true);
    expect(duplicateReview.run.scholarships).toHaveLength(firstReview.run.scholarships?.length ?? 0);
    expect(duplicateReview.run.stats.money).toBe(firstReview.run.stats.money);
  });

  it("creates internship choices, employment offers, and accepts one offer into the ending evidence chain", () => {
    let run = createSettledRun("employment-final-demo");

    run = settleLongTermProgression(run, { playedYear: 3, playedMonth: 4 }).run;
    expect(run.internshipRecords!.filter((item) => item.status === "available").length).toBeGreaterThanOrEqual(3);
    expect(run.timelineNodes!.some((node) => node.kind === "internship_choice" && node.monthIndex === 28)).toBe(true);

    run = settleLongTermProgression(run, { playedYear: 4, playedMonth: 1 }).run;
    const offer = run.futureOffers!.find((item) => item.type === "employment" && !item.rejected);
    expect(offer).toBeDefined();
    expect(offer?.salaryLevel).toBeDefined();
    expect(run.stats.money).toBe(1800);

    const accepted = acceptFutureOfferDecision(run, offer!.id, "accept");
    expect(accepted.acceptedOffer).toMatchObject({ id: offer!.id, accepted: true });
    expect(accepted.endingEvidence!.some((item) => item.kind === "offer" && item.sourceId === offer!.id)).toBe(true);
  });

  it("generates the month-28 postgraduate choice, month-34 recommendation offer, and month-36 exam result", () => {
    let run = createSettledRun("recommendation-final-demo", {
      profile: {
        name: "推免测试档",
        talents: ["self-disciplined"],
        familyBackground: "stable",
        monthlyAllowance: 1800,
        luck: 88,
        collegeTrack: "engineering",
        schoolTier: "nankai_tianda",
        cityTier: "tier_2",
      },
      progression: {
        tendencies: {
          employment: 18,
          postgraduate: 58,
          public_exam: 0,
          recommendation: 92,
          undecided: 0,
        },
        dominantDirection: "recommendation",
        publicExam: { progress: 0, aptitudePrep: 0, essayPrep: 0 },
        postgraduateProgress: 58,
        employmentReadiness: 18,
        recommendationReadiness: 86,
        recommendationQualification: "pending",
        latestHints: [],
      },
    });

    run = settleLongTermProgression(run, { playedYear: 3, playedMonth: 4 }).run;
    expect(run.progression?.postgraduateChoiceOpenedAtMonth).toBe(28);
    expect(run.timelineNodes!.some((node) => node.kind === "postgraduate_open" && node.monthIndex === 28)).toBe(true);

    run = settleLongTermProgression(run, { playedYear: 3, playedMonth: 10 }).run;
    const recommendationOffer = run.futureOffers!.find((item) => item.type === "recommendation");
    expect(recommendationOffer).toBeDefined();
    expect(recommendationOffer?.tier).toBe("nankai_tianda");
    expect(run.timelineNodes!.some((node) => node.kind === "recommendation_apply" && node.monthIndex === 34)).toBe(true);

    run = settleLongTermProgression(run, { playedYear: 3, playedMonth: 12 }).run;
    expect(run.futureOffers!.some((item) => item.type === "postgraduate_exam")).toBe(true);

    const accepted = acceptFutureOfferDecision(run, recommendationOffer!.id, "accept");
    expect(accepted.progression?.recommendationQualification).toBe("accepted");
    expect(accepted.endingEvidence!.some((item) => item.kind === "offer" && item.sourceId === recommendationOffer!.id)).toBe(true);
  });
});

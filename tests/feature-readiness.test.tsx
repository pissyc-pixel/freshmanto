import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  featureReadiness,
  getFeatureReadiness,
  isFeatureRoutedForPlayers,
} from "@/lib/feature-readiness";
import { FmComingSoon } from "@/components/fm-ui/FmComingSoon";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";

describe("feature readiness", () => {
  it("classifies current real and not-ready image2 features explicitly", () => {
    expect(featureReadiness.start.status).toBe("real");
    expect(featureReadiness.weeklyPlanner.status).toBe("real");
    expect(featureReadiness.actionModal.status).toBe("real");
    expect(featureReadiness.resume.status).toBe("real");
    expect(featureReadiness.monthlyJournal.status).toBe("real");
    expect(featureReadiness.admission.status).toBe("partial");
    expect(featureReadiness.endingPreview.status).toBe("partial");
    expect(featureReadiness.campusMap.status).toBe("not_ready");
    expect(featureReadiness.socialCircle.status).toBe("not_ready");
    expect(featureReadiness.jobInterview.status).toBe("not_ready");
    expect(featureReadiness.offerSelection.status).toBe("not_ready");
    expect(featureReadiness.gradSchoolChoice.status).toBe("not_ready");
    expect(featureReadiness.civilServicePostChoice.status).toBe("not_ready");
    expect(featureReadiness.recommendationChoice.status).toBe("not_ready");
  });

  it("treats only real and partial features as routable for formal player flows", () => {
    expect(isFeatureRoutedForPlayers("start")).toBe(true);
    expect(isFeatureRoutedForPlayers("admission")).toBe(true);
    expect(isFeatureRoutedForPlayers("weeklyPlanner")).toBe(true);
    expect(isFeatureRoutedForPlayers("recommendationChoice")).toBe(false);
    expect(isFeatureRoutedForPlayers("campusMap")).toBe(false);
  });

  it("returns metadata for known features", () => {
    expect(getFeatureReadiness("journal")).toMatchObject({
      status: "real",
      label: "成长日志",
    });
  });
});

describe("fm ui feedback states", () => {
  it("renders grounded empty and readiness copy without hype", () => {
    const emptyMarkup = renderToStaticMarkup(
      <FmEmptyState title="还没有足够的履历证据。" body="这条线索还没有在你的大学生活中出现。" />,
    );
    const comingSoonMarkup = renderToStaticMarkup(
      <FmComingSoon title="后续开放" body="这个功能仍在原型阶段，暂未进入正式流程。" />,
    );
    const partialMarkup = renderToStaticMarkup(
      <FmPartialNotice title="当前阶段尚未形成明确方向。" body="只展示已有真实数据，未开放区域不会伪造结果。" />,
    );

    expect(emptyMarkup).toContain("这条线索还没有在你的大学生活中出现。");
    expect(comingSoonMarkup).toContain("暂未进入正式流程");
    expect(partialMarkup).toContain("未开放区域不会伪造结果");

    expect(`${emptyMarkup}${comingSoonMarkup}${partialMarkup}`).not.toContain("敬请期待");
    expect(`${emptyMarkup}${comingSoonMarkup}${partialMarkup}`).not.toContain("超强");
  });
});

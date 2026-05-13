import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FmComingSoon } from "@/components/fm-ui/FmComingSoon";
import { FmEmptyState } from "@/components/fm-ui/FmEmptyState";
import { FmPartialNotice } from "@/components/fm-ui/FmPartialNotice";
import { FmShellLayout } from "@/components/fm-ui/FmScaffold";
import {
  featureReadiness,
  getFeatureReadiness,
  isFeatureRoutedForPlayers,
} from "@/lib/feature-readiness";

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
      route: "/journal",
    });
  });
});

describe("fm ui feedback states", () => {
  it("renders grounded empty and readiness copy without hype", () => {
    const emptyMarkup = renderToStaticMarkup(<FmEmptyState title="No evidence yet" body="Wait for a real run." />);
    const comingSoonMarkup = renderToStaticMarkup(
      <FmComingSoon title="Later" body="This feature is still outside the formal flow." />,
    );
    const partialMarkup = renderToStaticMarkup(
      <FmPartialNotice title="Partial" body="Only real data is shown here." />,
    );

    expect(emptyMarkup).toContain("No evidence yet");
    expect(emptyMarkup).toContain("Wait for a real run.");
    expect(comingSoonMarkup).toContain("Later");
    expect(comingSoonMarkup).toContain("formal flow");
    expect(partialMarkup).toContain("Partial");
    expect(partialMarkup).toContain("Only real data is shown here.");
    expect(partialMarkup).toContain("partial");
  });

  it("keeps not-ready features out of the formal player sidebar", () => {
    const shellMarkup = renderToStaticMarkup(
      <FmShellLayout active="game" title="Planner">
        <div>planner</div>
      </FmShellLayout>,
    );

    expect(shellMarkup).not.toContain("Campus Map");
    expect(shellMarkup).not.toContain("Social Circle");
  });
});

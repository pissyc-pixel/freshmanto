import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Locator, type Page } from "playwright/test";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "docs",
  "design-reference",
  "image2-ui",
  "__real-smoke__",
);

const preferredOptionIds = [
  "study",
  "job_prep",
  "postgraduate_prep",
  "public_exam_prep",
  "competition_project",
  "part_time",
  "student_activity",
  "social",
];

function ensureScreenshotDir() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function saveShot(page: Page, filename: string) {
  ensureScreenshotDir();
  try {
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, filename),
      fullPage: true,
    });
  } catch {
    // Screenshots are helpful for regression review, but a file-lock hiccup should not fail the gameplay smoke test itself.
  }
}

async function openDayModal(page: Page, weekday: "mon" | "tue" | "wed") {
  const modal = page.getByTestId("action-modal");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page.getByTestId(`planner-day-${weekday}`).click();
    await page.waitForLoadState("networkidle");

    if (await modal.isVisible().catch(() => false)) {
      return modal;
    }
  }

  await expect(modal).toBeVisible();
  return modal;
}

async function planDay(page: Page, weekday: "mon" | "tue" | "wed") {
  const modal = await openDayModal(page, weekday);
  for (const optionId of preferredOptionIds) {
    const option = modal.getByTestId(`action-option-${optionId}`);
    if ((await option.count()) > 0) {
      const label = (await option.getByTestId("action-option-label").textContent())?.trim();
      await option.getByTestId("action-option-submit").click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/game\?runId=/);
      await expect(page.getByTestId("action-modal")).toBeHidden();
      await expect(page.getByTestId(`planner-day-action-${weekday}`)).toContainText(label ?? "");
      return label ?? optionId;
    }
  }

  throw new Error(`No non-default action option found for ${weekday}.`);
}

function linkByExactName(page: Page, name: string): Locator {
  return page.getByRole("link", { name, exact: true });
}

test("image2 weekly planner smoke flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("start-page")).toBeVisible();
  await expect(page.getByText("Freshmanto")).toBeVisible();
  await saveShot(page, "01-home.png");

  await page.getByTestId("start-new-run-link").click();
  await page.waitForURL(/\/new-game/);
  await expect(page.getByTestId("new-game-page")).toBeVisible();
  await page.getByTestId("new-game-name").fill("林舒恒");
  await page.getByTestId("discipline-option-arts").click();
  await page.getByTestId("new-game-submit").click();
  await page.waitForURL(/\/admission\?runId=/);

  const runId = page.url().match(/runId=([^&]+)/)?.[1];
  expect(runId).toBeTruthy();

  await expect(page.getByTestId("admission-page")).toBeVisible();
  await expect(page.getByText("林舒恒")).toBeVisible();
  await expect(page.locator("text=文科").first()).toBeVisible();
  await expect(page.getByTestId("admission-share")).toBeVisible();
  await expect(page.getByText("阶段接入")).toHaveCount(0);
  await expect(page.getByText("规则层")).toHaveCount(0);
  await saveShot(page, "02-admission.png");

  await page.getByTestId("admission-confirm").click();
  await page.waitForURL(new RegExp(`/game\\?runId=${runId}`));

  await expect(page.getByTestId("game-page")).toBeVisible();
  await expect(page.getByTestId("formal-sidebar-nav")).toBeVisible();
  await expect(page.getByTestId("planner-client-ready")).toHaveAttribute("data-ready", "true");
  await expect(linkByExactName(page, "Campus Map")).toHaveCount(0);
  await expect(linkByExactName(page, "Social Circle")).toHaveCount(0);
  await expect(linkByExactName(page, "Offer")).toHaveCount(0);
  await expect(linkByExactName(page, "Interview")).toHaveCount(0);
  await expect(linkByExactName(page, "考研择校")).toHaveCount(0);
  await expect(linkByExactName(page, "考公岗位")).toHaveCount(0);
  await expect(linkByExactName(page, "保研去向")).toHaveCount(0);
  await saveShot(page, "03-game-weekly-planner.png");

  await page.getByTestId("formal-nav-journal").click();
  await page.waitForURL(new RegExp(`/journal\\?runId=${runId}`));
  await expect(page.getByText("还没有进行中的存档")).toHaveCount(0);

  await page.getByTestId("formal-nav-game").click();
  await page.waitForURL(new RegExp(`/game\\?runId=${runId}`));
  await expect(page.getByTestId("game-page")).toBeVisible();

  await page.getByTestId("formal-nav-resume").click();
  await page.waitForURL(new RegExp(`/resume\\?runId=${runId}`));
  await expect(page.getByText("还没有进行中的存档")).toHaveCount(0);

  await page.getByTestId("formal-nav-game").click();
  await page.waitForURL(new RegExp(`/game\\?runId=${runId}`));
  await expect(page.getByTestId("game-page")).toBeVisible();

  await page.getByTestId("set-attendance-submit").click();
  await expect(page.getByTestId("planner-attendance-locked")).toHaveAttribute("data-locked", "true");

  const mondayActionCopy = (await page.getByTestId("planner-day-action-mon").textContent())?.trim() ?? "";
  const thursdayActionCopy = (await page.getByTestId("planner-day-action-thu").textContent())?.trim() ?? "";

  await openDayModal(page, "mon");
  await saveShot(page, "04-action-modal-open.png");
  await page.getByTestId("action-modal-cancel").click();
  await expect(page.getByTestId("action-modal")).toBeHidden();
  await expect(page.getByTestId("planner-day-action-mon")).toHaveText(mondayActionCopy);

  const mondayLabel = await planDay(page, "mon");
  const tuesdayModal = await openDayModal(page, "tue");
  await page.waitForLoadState("networkidle");
  await expect(tuesdayModal).toBeVisible();
  let chosenTuesdayCard = "";
  for (const optionId of preferredOptionIds) {
    const option = tuesdayModal.getByTestId(`action-option-${optionId}`);
    if ((await option.count()) > 0) {
      chosenTuesdayCard = (await option.getByTestId("action-option-label").textContent())?.trim() ?? optionId;
      await option.getByTestId("action-option-submit").click();
      break;
    }
  }
  expect(chosenTuesdayCard).toBeTruthy();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("planner-day-action-mon")).toContainText(mondayLabel);
  await expect(page.getByTestId("planner-day-action-tue")).toContainText(chosenTuesdayCard);
  const chosenLabels = [mondayLabel, chosenTuesdayCard, await planDay(page, "wed")];

  await expect(page).toHaveURL(new RegExp(`/game\\?runId=${runId}`));
  await expect(page.getByTestId("weekly-settlement-card")).toHaveCount(0);
  await expect(page.getByTestId("planner-day-action-mon")).toContainText(chosenLabels[0] ?? "");
  await expect(page.getByTestId("planner-day-action-tue")).toContainText(chosenLabels[1] ?? "");
  await expect(page.getByTestId("planner-day-action-wed")).toContainText(chosenLabels[2] ?? "");
  await expect(page.getByTestId("planner-day-action-thu")).toHaveText(thursdayActionCopy);
  await saveShot(page, "05-action-selected.png");

  await page.getByTestId("confirm-week-submit").click();
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(new RegExp(`/((game\\?runId=${runId}.*focus=weekly-settlement)|(settlement\\?runId=${runId}.*))`));

  const weeklySettlement = page.getByTestId("weekly-settlement-card");
  await expect(weeklySettlement).toBeVisible();
  await saveShot(page, "06-weekly-settlement.png");

  const settlementDayLines = weeklySettlement.getByTestId("weekly-settlement-day-line");
  await expect(settlementDayLines).toHaveCount(7);

  const actionLabels = await weeklySettlement.getByTestId("weekly-settlement-action-label").allTextContents();
  expect(actionLabels.length).toBeGreaterThan(0);
  for (const chosenLabel of new Set(chosenLabels)) {
    expect(actionLabels.some((label) => label.trim() === chosenLabel.trim())).toBe(true);
  }

  const idleLabels = actionLabels.filter((label) => label.includes("摆烂") || label.includes("发呆"));
  expect(idleLabels.length).toBeGreaterThan(0);
  expect(idleLabels.length).toBeLessThan(actionLabels.length);

  for (let week = 0; week < 3; week += 1) {
    await expect(page).toHaveURL(new RegExp(`/game\\?runId=${runId}`));
    await page.getByTestId("set-attendance-submit").click();
    await expect(page.getByTestId("planner-attendance-locked")).toHaveAttribute("data-locked", "true");
    await page.getByTestId("confirm-week-submit").click();
    await page.waitForLoadState("networkidle");
  }

  await expect(page).toHaveURL(new RegExp(`/settlement\\?runId=${runId}`));
  await page.locator(`a[href="/journal?runId=${runId}"]`).first().click();
  await page.waitForURL(new RegExp(`/journal\\?runId=${runId}`));
  await expect(page.getByText("还没有进行中的存档")).toHaveCount(0);

  await page.getByTestId("formal-nav-game").click();
  await page.waitForURL(new RegExp(`/game\\?runId=${runId}`));
  await expect(page.getByTestId("game-page")).toBeVisible();
  await expect(page.getByText("还没有进行中的存档")).toHaveCount(0);
});

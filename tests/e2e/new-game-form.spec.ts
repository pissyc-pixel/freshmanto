import { expect, test } from "playwright/test";

test("new-game form shows selectable discipline state and submits name + discipline", async ({ page }) => {
  await page.goto("/new-game");

  await expect(page.getByTestId("new-game-page")).toBeVisible();
  await expect(page.getByTestId("new-game-submit")).toBeDisabled();
  await expect(page.getByText("请填写姓名")).toBeVisible();
  await expect(page.getByText("请选择一个学科方向")).toBeVisible();

  const disciplineInput = page.locator('input[name="discipline"]');
  await expect(disciplineInput).toHaveValue("");

  const artsCard = page.getByTestId("discipline-option-arts");
  const scienceCard = page.getByTestId("discipline-option-science");

  await page.getByTestId("new-game-name").fill("鄢书阅");
  await expect(page.getByTestId("new-game-submit")).toBeDisabled();
  await expect(page.getByText("请选择一个学科方向")).toBeVisible();
  await page.getByTestId("new-game-name").fill("");

  await artsCard.focus();
  await artsCard.press("Space");
  await expect(disciplineInput).toHaveValue("arts");
  await expect(artsCard).toHaveAttribute("aria-pressed", "true");
  await expect(artsCard).toHaveAttribute("data-selected", "true");
  await expect(scienceCard).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("new-game-submit")).toBeDisabled();
  await expect(page.getByText("请填写姓名")).toBeVisible();

  await scienceCard.click();
  await expect(disciplineInput).toHaveValue("science");
  await expect(artsCard).toHaveAttribute("aria-pressed", "false");
  await expect(scienceCard).toHaveAttribute("aria-pressed", "true");

  await artsCard.click();
  await expect(disciplineInput).toHaveValue("arts");
  await expect(artsCard).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("new-game-submit")).toBeDisabled();

  await page.getByTestId("new-game-name").fill("鄢书阅");
  await expect(page.getByTestId("new-game-submit")).toBeEnabled();

  await page.getByTestId("new-game-submit").click();
  await page.waitForURL(/\/admission\?runId=/);

  await expect(page.getByTestId("admission-page")).toBeVisible();
  await expect(page.getByText("鄢书阅")).toBeVisible();
  await expect(page.getByText("文科").first()).toBeVisible();
});

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const root = process.cwd();
const referenceDir = path.join(root, "docs", "design-reference", "image2-ui");
const actualDir = path.join(referenceDir, "__actual__");
const diffDir = path.join(referenceDir, "__diff__");
const baseUrl = process.env.UI_LAB_BASE_URL ?? "http://127.0.0.1:3100";

const pages = [
  {
    route: "/ui-lab/start",
    reference: "03-start-page.png",
    output: "start.png",
    width: 1600,
    height: 1280,
  },
  {
    route: "/ui-lab/admission",
    reference: "01-admission-letter.png",
    output: "admission.png",
    width: 1448,
    height: 1086,
  },
  {
    route: "/ui-lab/planner",
    reference: "04-weekly-planner.png",
    output: "planner.png",
    width: 1448,
    height: 1086,
  },
  {
    route: "/ui-lab/action-modal",
    reference: "05-action-modal.png",
    output: "action-modal.png",
    width: 1448,
    height: 1086,
  },
  {
    route: "/ui-lab/journal",
    reference: "06-growth-journal.png",
    output: "journal.png",
    width: 1448,
    height: 1086,
  },
  {
    route: "/ui-lab/resume",
    reference: "07-resume.png",
    output: "resume.png",
    width: 1448,
    height: 1086,
  },
  {
    route: "/ui-lab/monthly-journal",
    reference: "02-monthly-journal.png",
    output: "monthly-journal.png",
    width: 1448,
    height: 1086,
  },
];

async function ensureDirs() {
  await fs.mkdir(actualDir, { recursive: true });
  await fs.mkdir(diffDir, { recursive: true });
}

async function comparePng(referencePath, actualPath, diffPath) {
  const [referenceBuffer, actualBuffer] = await Promise.all([
    fs.readFile(referencePath),
    fs.readFile(actualPath),
  ]);

  const reference = PNG.sync.read(referenceBuffer);
  const actual = PNG.sync.read(actualBuffer);

  if (reference.width !== actual.width || reference.height !== actual.height) {
    throw new Error(
      `Image size mismatch for ${path.basename(actualPath)}: reference ${reference.width}x${reference.height}, actual ${actual.width}x${actual.height}`,
    );
  }

  const diff = new PNG({ width: reference.width, height: reference.height });
  const mismatchedPixels = pixelmatch(
    reference.data,
    actual.data,
    diff.data,
    reference.width,
    reference.height,
    {
      threshold: 0.12,
      alpha: 0.6,
      diffColor: [239, 104, 56],
      diffColorAlt: [15, 121, 116],
      includeAA: false,
    },
  );

  await fs.writeFile(diffPath, PNG.sync.write(diff));

  return {
    mismatchedPixels,
    ratio: mismatchedPixels / (reference.width * reference.height),
  };
}

async function captureAll() {
  await ensureDirs();
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const pageConfig of pages) {
      const page = await browser.newPage({
        viewport: { width: pageConfig.width, height: pageConfig.height },
        deviceScaleFactor: 1,
      });
      await page.goto(`${baseUrl}${pageConfig.route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

      const actualPath = path.join(actualDir, pageConfig.output);
      await page.screenshot({ path: actualPath, fullPage: false });
      await page.close();

      const comparison = await comparePng(
        path.join(referenceDir, pageConfig.reference),
        actualPath,
        path.join(diffDir, pageConfig.output),
      );

      results.push({
        ...pageConfig,
        ...comparison,
      });
    }
  } finally {
    await browser.close();
  }

  const lines = results.map(
    (result) =>
      `${result.output}: ${(result.ratio * 100).toFixed(2)}% diff (${result.mismatchedPixels} pixels)`,
  );

  console.log(lines.join("\n"));
}

captureAll().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { RESUME_CATEGORY_VALUES } from "@/types/game";

function extractResumeItemCategoriesFromSchema(source: string) {
  const match = source.match(/resume_items[\s\S]*?category text not null check \(category in \(([^)]+)\)\)/i);
  if (!match) {
    throw new Error("resume_items category check not found");
  }

  return match[1]
    .split(",")
    .map((value) => value.trim().replace(/^'/, "").replace(/'$/, ""))
    .filter(Boolean)
    .sort();
}

describe("resume item schema categories", () => {
  it("keeps the SQL constraint aligned with the TypeScript resume category source of truth", () => {
    const schema = readFileSync("db/schema.sql", "utf8");
    const sqlCategories = extractResumeItemCategoriesFromSchema(schema);

    expect(sqlCategories).toEqual([...RESUME_CATEGORY_VALUES].sort());
  });
});

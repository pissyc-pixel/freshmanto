import { describe, expect, it } from "vitest";

import { createInitialGameRun } from "@/core/game-engine";
import {
  ACTIVE_RUN_STORAGE_KEY,
  BROWSER_SAVE_INDEX_KEY,
  buildBrowserSaveSnapshotKey,
  clearBrowserSave,
  persistBrowserSaveSnapshot,
} from "@/lib/demo/browser-save";

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

describe("browser save mirror", () => {
  it("persists active run id plus a normalized browser snapshot for refresh recovery", () => {
    const storage = createMemoryStorage();
    const run = createInitialGameRun({
      id: "browser-save-run",
      name: "浏览器存档",
      discipline: "business",
      randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
    });

    persistBrowserSaveSnapshot(storage, run);

    expect(storage.getItem(ACTIVE_RUN_STORAGE_KEY)).toBe(run.id);
    expect(storage.getItem(BROWSER_SAVE_INDEX_KEY)).toBe(run.id);
    expect(JSON.parse(storage.getItem(buildBrowserSaveSnapshotKey(run.id)) ?? "{}")).toMatchObject({
      id: run.id,
      currentYear: 1,
      currentMonth: 1,
      futureOffers: [],
      timelineNodes: [],
    });
  });

  it("clears the active pointer and mirrored snapshot together", () => {
    const storage = createMemoryStorage();
    const run = createInitialGameRun({
      id: "browser-save-clear-run",
      discipline: "engineering",
      randomValues: [0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7],
    });

    persistBrowserSaveSnapshot(storage, run);
    clearBrowserSave(storage, run.id);

    expect(storage.getItem(ACTIVE_RUN_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(BROWSER_SAVE_INDEX_KEY)).toBeNull();
    expect(storage.getItem(buildBrowserSaveSnapshotKey(run.id))).toBeNull();
  });
});

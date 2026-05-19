import { ACTIVE_RUN_STORAGE_KEY } from "@/lib/demo/active-run";
import { normalizeSaveState } from "@/lib/demo/save-state";
import type { GameRun } from "@/types/game";

export { ACTIVE_RUN_STORAGE_KEY };

export const BROWSER_SAVE_INDEX_KEY = "freshmanto.latestRunId";

export type BrowserStorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function buildBrowserSaveSnapshotKey(runId: string) {
  return `freshmanto.runSnapshot.${runId}`;
}

export function persistBrowserSaveSnapshot(storage: BrowserStorageLike, run: GameRun) {
  const normalized = normalizeSaveState(run);
  storage.setItem(ACTIVE_RUN_STORAGE_KEY, normalized.id);
  storage.setItem(BROWSER_SAVE_INDEX_KEY, normalized.id);
  storage.setItem(buildBrowserSaveSnapshotKey(normalized.id), JSON.stringify(normalized));
}

export function clearBrowserSave(storage: BrowserStorageLike, runId?: string | null) {
  const activeRunId = runId ?? storage.getItem(ACTIVE_RUN_STORAGE_KEY) ?? storage.getItem(BROWSER_SAVE_INDEX_KEY);
  storage.removeItem(ACTIVE_RUN_STORAGE_KEY);
  storage.removeItem(BROWSER_SAVE_INDEX_KEY);

  if (activeRunId) {
    storage.removeItem(buildBrowserSaveSnapshotKey(activeRunId));
  }
}

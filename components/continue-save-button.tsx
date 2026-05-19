"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";

import { ACTIVE_RUN_STORAGE_KEY } from "@/lib/demo/active-run";
import { clearBrowserSave } from "@/lib/demo/browser-save";
import { FmIcon } from "@/components/fm-ui/FmScaffold";

export function ContinueSaveButton() {
  const [revision, setRevision] = useState(0);
  const savedRunId = useSyncExternalStore(
    useCallback((onStoreChange: () => void) => {
      const handler = () => onStoreChange();
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }, []),
    () => {
      try {
        return window.localStorage.getItem(ACTIVE_RUN_STORAGE_KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );

  const clearSave = useCallback(() => {
    try {
      clearBrowserSave(window.localStorage, savedRunId);
    } catch {
      // ignore
    }
    setRevision((n) => n + 1);
  }, [savedRunId]);

  if (!savedRunId && revision === 0) {
    return null;
  }

  if (!savedRunId) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Link href={`/game?runId=${savedRunId}`} className="fm-button-primary">
        <FmIcon name="calendar" className="h-6 w-6" />
        <span>继续上次存档</span>
      </Link>
      <button
        type="button"
        className="fm-button-secondary"
        onClick={clearSave}
      >
        清除存档
      </button>
    </div>
  );
}

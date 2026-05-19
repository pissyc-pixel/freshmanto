"use client";

import { useEffect } from "react";

import { ACTIVE_RUN_COOKIE } from "@/lib/demo/active-run";
import { persistBrowserSaveSnapshot } from "@/lib/demo/browser-save";
import type { GameRun } from "@/types/game";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

export function ActiveRunSync({
  runId,
  snapshot,
}: {
  runId?: string | null;
  snapshot?: GameRun | null;
}) {
  useEffect(() => {
    if (!runId) {
      return;
    }

    if (snapshot) {
      persistBrowserSaveSnapshot(window.localStorage, snapshot);
    }
    document.cookie = `${ACTIVE_RUN_COOKIE}=${encodeURIComponent(runId)}; path=/; max-age=${THIRTY_DAYS_IN_SECONDS}; samesite=lax`;
  }, [runId, snapshot]);

  return null;
}

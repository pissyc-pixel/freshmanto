"use client";

import { useEffect } from "react";

import { ACTIVE_RUN_COOKIE, ACTIVE_RUN_STORAGE_KEY } from "@/lib/demo/active-run";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

export function ActiveRunSync({ runId }: { runId?: string | null }) {
  useEffect(() => {
    if (!runId) {
      return;
    }

    window.localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, runId);
    document.cookie = `${ACTIVE_RUN_COOKIE}=${encodeURIComponent(runId)}; path=/; max-age=${THIRTY_DAYS_IN_SECONDS}; samesite=lax`;
  }, [runId]);

  return null;
}

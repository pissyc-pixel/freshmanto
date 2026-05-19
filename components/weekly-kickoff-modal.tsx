"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { FmBadge } from "@/components/fm-ui/FmBadge";

export type WeeklyKickoffNotice = {
  id: string;
  title: string;
  kind: "event" | "money" | "mood" | "stress";
  whatHappened: string;
  changes: string[];
  reminder: string;
};

function buildSeenKey(runId: string, monthIndex: number, week: number) {
  return `freshmanto.weeklyKickoff.${runId}.${monthIndex}.${week}`;
}

function readSeenState(runId: string, monthIndex: number, week: number) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(buildSeenKey(runId, monthIndex, week)) === "seen";
  } catch {
    return false;
  }
}

export function WeeklyKickoffModal({
  runId,
  monthIndex,
  week,
  notices,
}: {
  runId: string;
  monthIndex: number;
  week: number;
  notices: WeeklyKickoffNotice[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
  }, []);
  const alreadySeen = useSyncExternalStore(
    subscribe,
    () => readSeenState(runId, monthIndex, week),
    () => false,
  );
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const close = useCallback(() => {
    try {
      window.localStorage.setItem(buildSeenKey(runId, monthIndex, week), "seen");
    } catch {
      // Ignore storage failures; dismissing the modal still matters more.
    }
    setDismissed(true);
  }, [monthIndex, runId, week]);

  useEffect(() => {
    if (!mounted || dismissed || alreadySeen || notices.length === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [alreadySeen, close, dismissed, mounted, notices.length]);

  if (!mounted || dismissed || alreadySeen || notices.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fm-kickoff-backdrop" role="dialog" aria-modal="true" aria-label="本周开始前">
      <section className="fm-kickoff-modal">
        <div className="fm-kickoff-modal__head">
          <div>
            <div className="fm-ending-cover__eyebrow">Week Start</div>
            <h2>本周开始前</h2>
          </div>
          <button type="button" className="fm-dialog__close" onClick={close}>
            我知道了
          </button>
        </div>
        <div className="fm-stack">
          {notices.map((notice) => (
            <article key={notice.id} className="fm-kickoff-card">
              <div className="fm-kickoff-card__head">
                <FmBadge tone={notice.kind === "event" ? "event" : notice.kind === "money" ? "money" : "warning"}>
                  {notice.kind === "event" ? "周初事件" : notice.kind === "money" ? "经济提醒" : "状态提醒"}
                </FmBadge>
                <h3>{notice.title}</h3>
              </div>
              <p>
                <strong>发生了什么：</strong>
                {notice.whatHappened}
              </p>
              <div className="fm-kickoff-card__changes">
                {notice.changes.map((change) => (
                  <span key={`${notice.id}-${change}`}>{change}</span>
                ))}
              </div>
              <p>
                <strong>本周要留意：</strong>
                {notice.reminder}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}

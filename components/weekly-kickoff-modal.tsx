"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { FmBadge } from "@/components/fm-ui/FmBadge";

export type WeeklyKickoffNotice = {
  id: string;
  title: string;
  subtitle: string;
  bodyLines: string[];
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

  const notice = notices[0]!;

  return createPortal(
    <div
      className="fm-kickoff-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="本周开始前"
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          close();
        }
      }}
    >
      <section className="fm-kickoff-modal" onClick={(event) => event.stopPropagation()}>
        <div className="fm-kickoff-modal__head">
          <div>
            <div className="fm-ending-cover__eyebrow">本周提醒</div>
            <h2>这周有件事</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">{notice.subtitle}</p>
          </div>
          <button type="button" className="fm-dialog__close" onClick={close} aria-label="关闭本周提醒弹窗">
            关闭
          </button>
        </div>
        <div className="fm-stack">
          <article key={notice.id} className="fm-kickoff-card">
            <div className="fm-kickoff-card__head">
              <FmBadge tone="event">{notice.title}</FmBadge>
            </div>
            <div className="space-y-3 text-sm leading-6 text-stone-700">
              {notice.bodyLines.map((line) => (
                <p key={`${notice.id}-${line}`}>{line}</p>
              ))}
            </div>
          </article>
          <button type="button" className="fm-solid-button" onClick={close}>
            知道了
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

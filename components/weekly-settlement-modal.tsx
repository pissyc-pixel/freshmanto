"use client";

import type { ComponentProps } from "react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { WeeklySettlementCard } from "@/components/weekly-settlement-card";

type WeeklySettlementView = ComponentProps<typeof WeeklySettlementCard>;

function replaceUrlWithoutReload(nextHref: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState(window.history.state, "", nextHref);
}

export function stripWeeklySettlementFocus(href: string) {
  const [pathname, query = ""] = href.split("?");
  const search = new URLSearchParams(query);

  if (search.get("focus") !== "weekly-settlement") {
    return href;
  }

  search.delete("focus");
  const nextQuery = search.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function WeeklySettlementModal({
  open,
  settlement,
  closeHref,
}: {
  open: boolean;
  settlement: WeeklySettlementView | null;
  closeHref: string;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const nextHref = useMemo(() => stripWeeklySettlementFocus(closeHref), [closeHref]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        replaceUrlWithoutReload(nextHref);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextHref, open]);

  if (!mounted || !open || !settlement) {
    return null;
  }

  return createPortal(
    <div
      className="fm-weekly-settlement-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Weekly Settlement"
    >
      <section className="fm-weekly-settlement-modal">
        <div className="fm-weekly-settlement-modal__head">
          <div className="fm-ending-cover__eyebrow">Weekly Settlement</div>
          <button type="button" className="fm-dialog__close" onClick={() => replaceUrlWithoutReload(nextHref)}>
            Close
          </button>
        </div>
        <WeeklySettlementCard {...settlement} />
      </section>
    </div>,
    document.body,
  );
}

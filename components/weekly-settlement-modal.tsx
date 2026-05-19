"use client";

import type { ComponentProps } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { WeeklySettlementCard } from "@/components/weekly-settlement-card";

type WeeklySettlementView = ComponentProps<typeof WeeklySettlementCard>;

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
  onClose,
}: {
  open: boolean;
  settlement: WeeklySettlementView | null;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted || !open || !settlement) {
    return null;
  }

  return createPortal(
    <div
      className="fm-weekly-settlement-backdrop"
      data-testid="weekly-settlement-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="周行动日志"
      onClick={onClose}
    >
      <section
        className="fm-weekly-settlement-modal"
        data-testid="weekly-settlement-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fm-weekly-settlement-modal__head">
          <div className="fm-ending-cover__eyebrow">本周结算</div>
          <button
            type="button"
            className="fm-dialog__close"
            data-testid="weekly-settlement-close"
            onClick={onClose}
            aria-label="关闭周行动日志弹窗"
          >
            关闭
          </button>
        </div>
        <WeeklySettlementCard {...settlement} />
      </section>
    </div>,
    document.body,
  );
}

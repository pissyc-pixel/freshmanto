"use client";

import { useCallback, useState } from "react";

import { WeeklySettlementModal, stripWeeklySettlementFocus } from "@/components/weekly-settlement-modal";

type WeeklySettlementModalProps = Parameters<typeof WeeklySettlementModal>[0];

export function WeeklySettlementModalHost({
  focusParam,
  settlement,
}: {
  focusParam: string | undefined;
  settlement: WeeklySettlementModalProps["settlement"];
}) {
  const [dismissed, setDismissed] = useState(false);

  const open = focusParam === "weekly-settlement" && !dismissed;

  const onClose = useCallback(() => {
    setDismissed(true);

    if (typeof window !== "undefined") {
      const cleanHref = stripWeeklySettlementFocus(window.location.href);
      window.history.replaceState(window.history.state, "", cleanHref);
    }
  }, []);

  return (
    <WeeklySettlementModal
      open={open}
      onClose={onClose}
      settlement={settlement}
    />
  );
}

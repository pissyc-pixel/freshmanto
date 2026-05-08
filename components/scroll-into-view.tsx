"use client";

import { useEffect } from "react";

type ScrollIntoViewProps = {
  targetId: string;
  active?: boolean;
};

export function ScrollIntoView({ targetId, active = true }: ScrollIntoViewProps) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [active, targetId]);

  return null;
}

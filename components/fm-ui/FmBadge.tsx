import type { ReactNode } from "react";

type FmBadgeTone =
  | "academic"
  | "money"
  | "mood"
  | "stress"
  | "resume"
  | "event"
  | "ending"
  | "warning"
  | "danger"
  | "neutral";

type FmBadgeProps = {
  tone?: FmBadgeTone;
  children: ReactNode;
  className?: string;
};

export function FmBadge({ tone = "neutral", children, className = "" }: FmBadgeProps) {
  return <span className={`fm-badge fm-badge--${tone} ${className}`.trim()}>{children}</span>;
}

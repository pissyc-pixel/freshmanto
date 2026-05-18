import type { ComponentPropsWithoutRef, ReactNode } from "react";

type FmCardVariant = "normal" | "active" | "completed" | "warning" | "danger" | "muted";

type FmCardProps = {
  children: ReactNode;
  variant?: FmCardVariant;
  padded?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<"section">;

export function FmCard({
  children,
  variant = "normal",
  padded = true,
  className = "",
  ...props
}: FmCardProps) {
  return (
    <section
      className={`fm-card fm-card--${variant} ${padded ? "fm-card--pad" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </section>
  );
}

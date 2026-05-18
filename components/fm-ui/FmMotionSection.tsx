import type { ComponentPropsWithoutRef, ReactNode } from "react";

type FmMotionSectionProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
} & ComponentPropsWithoutRef<"div">;

export function FmMotionSection({
  children,
  delay = 0,
  className = "",
  style,
  ...props
}: FmMotionSectionProps) {
  return (
    <div
      className={`fm-motion-section ${className}`.trim()}
      style={{ ...style, ["--fm-motion-delay" as string]: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

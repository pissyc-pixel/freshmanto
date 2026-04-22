import { ReactNode } from "react";
import { SectionCard } from "@/components/section-card";

type PlaceholderPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PlaceholderPanel({
  title,
  description,
  children
}: PlaceholderPanelProps) {
  return (
    <SectionCard title={title} description={description}>
      {children}
    </SectionCard>
  );
}

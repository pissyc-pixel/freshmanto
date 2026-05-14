"use client";

import { useFormStatus } from "react-dom";

import { FmIcon } from "@/components/fm-ui/FmScaffold";

export function StartNewRunButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="fm-button-primary"
      data-testid="start-new-run-submit"
      disabled={pending}
      aria-busy={pending}
    >
      <FmIcon name="chevron-right" className="h-7 w-7" />
      <span>{pending ? "正在创建档案..." : "开始新档"}</span>
    </button>
  );
}

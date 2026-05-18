"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { FmLoadingState } from "@/components/fm-ui/FmLoadingState";

type LoadingOverlayProps = {
  title: string;
  body: string;
};

export function LoadingOverlay({ title, body }: LoadingOverlayProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fm-loading-overlay" data-testid="loading-overlay" role="status" aria-live="polite">
      <div className="fm-loading-overlay__card">
        <FmLoadingState title={title} body={body} />
      </div>
    </div>,
    document.body,
  );
}

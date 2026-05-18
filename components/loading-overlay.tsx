"use client";

import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";

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
    <div className="fm-loading-overlay" data-testid="loading-overlay">
      <div className="fm-loading-overlay__card">
        <div className="fm-loading-overlay__spinner" />
        <h2 className="fm-loading-overlay__title">{title}</h2>
        <p className="fm-loading-overlay__body">{body}</p>
      </div>
    </div>,
    document.body,
  );
}

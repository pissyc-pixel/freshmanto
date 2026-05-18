"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("App route failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="fm-app-root fm-app-root--centered px-6 py-12">
      <section className="fm-card fm-card--pad fm-card--warning w-full max-w-2xl">
        <p className="fm-enroll-eyebrow">内测提示</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--fm-brand-dark)]">这一页刚刚没跑起来</h1>
        <p className="mt-4 leading-7 text-stone-700">
          可能是本地存档、测试数据或刚才的操作状态没接上。你可以重试，或者回到首页继续。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="fm-button-primary min-h-0 w-auto px-5 py-3 text-base"
          >
            重试这一页
          </button>
          <Link href="/" className="fm-button-secondary px-5 py-3">
            回到首页
          </Link>
        </div>
      </section>
    </main>
  );
}

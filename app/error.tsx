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
    <main className="min-h-screen bg-[#f7efe3] px-6 py-12 text-stone-900">
      <section className="mx-auto max-w-2xl rounded-[32px] border border-stone-200 bg-white/85 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">测试版提示</p>
        <h1 className="mt-4 text-3xl font-semibold">这一页刚刚没跑起来</h1>
        <p className="mt-4 leading-7 text-stone-700">
          朋友内测版还在打磨中。这个错误通常和测试库、环境变量或刚才的操作状态有关，不代表存档一定坏了。
          你可以先重试，或者回到首页重新开一局。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            重试这一页
          </button>
          <Link
            href="/"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 transition hover:bg-stone-50"
          >
            回到首页
          </Link>
        </div>
      </section>
    </main>
  );
}

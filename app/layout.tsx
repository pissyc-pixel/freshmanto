import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大学生模拟器 v0 Demo",
  description: "用于演示 UI 与 AI 表达层接线方式的本地 Demo。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

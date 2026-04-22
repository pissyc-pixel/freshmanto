import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大学生模拟器 v0 Demo",
  description: "本地可运行的大学生模拟器 Demo 脚手架，采用模块化边界设计。"
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


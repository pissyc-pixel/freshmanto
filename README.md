# 大学生模拟器 v0 Demo

一个本地优先的大学四年时间管理模拟器 Demo。当前仓库聚焦先跑通最小闭环，而不是直接上线部署。

## 当前目标

- 新开一局并生成随机开局
- 进入主游戏页并完成至少 1 个月流程
- 看到月度属性变化和关键日志
- 生成并保存 1 篇 AI 月记
- 为后续学期结算、结局扩展和更多事件留出模块边界

## 技术选型

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI 兼容服务端接口

## 目录结构

- `app`：页面入口与路由
- `components`：共享展示组件
- `lib/supabase`：Supabase client 与后续数据访问封装
- `lib/ai`：AI 客户端与报告调用封装
- `core/game-engine`：游戏主引擎
- `core/generators`：开局随机生成器
- `core/resolvers`：行动、事件、学期与结局结算器
- `core/prompts`：AI 月记与结局报告 prompt 合约
- `types`：共享类型
- `data`：数据驱动事件与静态表
- `db`：最小 schema 草案
- `docs`：架构与实施说明

## 环境变量

项目依赖以下本地配置键：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`

`.env.local` 已加入忽略规则，不会入库。

## 本地运行

```bash
npm install
npm run dev
```

然后访问 [http://localhost:3000](http://localhost:3000)。

## 数据层初始化

最小 Supabase schema 位于 `db/schema.sql`。

建议在 Supabase SQL Editor 中执行该文件，完成以下表初始化：

- `runs`
- `monthly_states`
- `game_event_logs`
- `ai_reports`
- `resume_items`

## 当前阶段说明

阶段 1 只完成：

- 可启动的 Next.js 工程
- 共享类型骨架
- 模块边界文档
- 基础占位页面

阶段 2 会并行补齐：

- Supabase 数据层
- 核心规则层
- UI + AI 表达层

阶段 3 由主 agent 进行整合联调与文档更新。

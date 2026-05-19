<div align="center">

# Freshmanto

[![Next.js](https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Status](https://img.shields.io/badge/Status-Playable%20Demo-C46A4B)](#当前状态)

**A playable life-sim demo that turns four years of college into 48 months of choices, trade-offs, and reflection.**

**一款把大学四年压缩成 48 个月，用模拟体验缓冲“未来选择焦虑”的成长型 Demo。**

[演示地址（见项目文档）](http://freshmanto.shuyue.ccxixi.top/) · [项目文档 PDF](docs/project-pack/freshmanto.pdf) · [项目总览](docs/project-pack/00-project-overview.md) · [架构说明](docs/architecture.md) · [部署说明](docs/deployment.md)

</div>

## Overview

![Freshmanto 周历与行动规划界面](docs/project-pack/images/02-weekly-calendar.png)

Freshmanto 是一款面向大学生生涯选择焦虑的心理支持型模拟产品。它把大学四年压缩成 48 个月，让玩家在学业、竞赛、实习、社交、就业、推免/考研等分岔口里反复试一试，先在低风险环境里体验选择，再理解后果、复盘成长。

这个项目不是“告诉你标准答案”的规划工具，而是一个可以重来的模拟空间。我们希望把抽象的未来焦虑，变成一段可尝试、可理解、可回看的成长体验。

## Why This Project

- **Simulate before real commitment**: 先在虚拟大学里试错，再回到现实做选择。
- **Rules decide outcomes**: 核心结果全部由代码规则判定，不交给 AI 幻觉发挥。
- **AI adds emotional texture**: AI 只负责月记、回顾和结局信，让反馈更像“被看见”。
- **Growth is multi-path**: 就业、读研、竞赛、实习、社交、休息都可以成为有意义的路径。

## What You Can Do

- 创建新生档案，生成初始背景与状态
- 在周历里安排学习、竞赛、社交、休息、兼职和实习准备
- 每次行动后立即看到学业、金钱、心情、压力与能力变化
- 在月末阅读 AI 月记与成长回顾
- 在履历页查看奖学金、竞赛、项目、技能与关键经历沉淀
- 查看 offer、录取通知和毕业结局等正式结果页

## Product Flow

```text
New Game
  -> Weekly Planning
  -> Action Feedback
  -> Weekly / Monthly Settlement
  -> AI Journal + Resume Growth
  -> Offer / Admission / Ending
```

## Screens

| New Game | Weekly Planner |
| --- | --- |
| ![Onboarding](docs/project-pack/images/01-onboarding.png) | ![Weekly Planner](docs/project-pack/images/02-weekly-calendar.png) |

| AI Monthly Journal | Resume |
| --- | --- |
| ![Monthly Letter](docs/project-pack/images/04-monthly-letter.png) | ![Resume](docs/project-pack/images/05-resume.png) |

## Architecture

Freshmanto keeps a strict boundary between the **rule layer** and the **narrative layer**:

```text
Player UI
  |
  v
Next.js App Router + Server Actions
  |
  +--> lib/demo/              # 运行编排、状态读写、流程衔接
  +--> core/game-engine/      # 月度推进与结算入口
  +--> core/resolvers/        # 行动、事件、考勤、进度、结局等规则
  +--> core/generators/       # 开局生成
  +--> lib/supabase/ + db/    # 数据存储、schema、仓储层
  |
  +--> core/prompts/ + lib/ai/
         # AI 月记、结局报告、fallback 与调用配置
```

That separation keeps the simulation deterministic while still allowing the product to feel personal and reflective.

## Tech Stack

| 类别 | 技术 |
| --- | --- |
| 前端 | Next.js 16, React 19, TypeScript |
| UI | 全局样式、页面级样式文件、自定义组件体系 |
| 数据层 | Supabase, PostgreSQL, `pg` |
| AI 调用 | OpenAI SDK, OpenAI-compatible API |
| 校验与类型 | Zod, TypeScript |
| 测试 | Vitest, Playwright |
| 工程质量 | ESLint |
| 部署 | PM2, Nginx, Next.js production mode |

## Project Structure

```text
freshmanto/
├─ app/                  # 页面、路由、Server Actions
├─ components/           # UI 组件与交互模块
├─ core/
│  ├─ game-engine/       # 月度推进与结算逻辑
│  ├─ generators/        # 开局生成逻辑
│  ├─ prompts/           # AI prompt contract
│  └─ resolvers/         # 行动、事件、进度、结局等规则判定
├─ data/                 # 行动与事件数据池
├─ db/                   # schema 与 schema 初始化脚本
├─ lib/
│  ├─ ai/                # AI 客户端、配置、报告生成
│  ├─ demo/              # Demo 编排、状态存储、运行服务
│  └─ supabase/          # Supabase client 与 repository
├─ tests/                # 规则、页面、流程与回归测试
├─ docs/                 # 架构、部署、环境与项目包文档
└─ scripts/              # 辅助脚本与 smoke/e2e 支撑
```

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure env

以 `.env.example` 为模板创建 `.env.local`。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-service-role-or-secret-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
OPENAI_API_KEY=your-openai-compatible-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
AI_REPORT_TIMEOUT_MS=8000
```

### 3. Run locally

```bash
npm run dev
```

默认访问：[`http://localhost:3000`](http://localhost:3000)

### 4. First run notes

首次创建 run 时，服务端会尝试：

1. 读取 `db/schema.sql`
2. 使用 `DATABASE_URL` 初始化最小 schema
3. 刷新相关 schema cache

如果没有可用的 AI 配置，系统会自动回退到本地 fallback 月记/结局文案，不会阻塞 Demo 试玩。

## Scripts

```bash
npm run dev            # 本地开发
npm run build          # 生产构建
npm run start          # 生产启动
npm run lint           # 代码检查
npm test               # 单元/集成测试
npm run test:e2e       # Playwright E2E
npm run test:e2e:smoke # 轻量冒烟流程
npm run ui-lab:capture # UI Lab 截图辅助脚本
```

## Deployment

项目当前主要面向本地演示和 VPS 朋友内测，推荐使用 `PM2 + Nginx + Next.js production mode`：

```bash
npm ci
npm run build
pm2 start ecosystem.config.js --env production
```

部署后可通过 `GET /api/health` 做最小健康检查。更完整的生产部署步骤见：

- [docs/deployment.md](docs/deployment.md)
- [deploy/nginx/freshmanto-beta.conf.example](deploy/nginx/freshmanto-beta.conf.example)

## Current Status

当前仓库已经具备从开局、行动安排、阶段结算、成长日志、履历沉淀到结局展示的主流程闭环，适合作为：

- 一个可玩的产品原型
- 一个 AI + rules 分层设计样例
- 一个可以继续扩展的大学生成长模拟项目

当前仍然更偏 Demo，而不是完整商业化产品。事件池、长期路径和内容密度都还有继续扩展的空间。

## Docs

- [项目最终文档 PDF](docs/project-pack/freshmanto.pdf)
- [项目概览](docs/project-pack/00-project-overview.md)
- [完整 PRD](docs/project-pack/01-full-prd.md)
- [当前 Demo 状态](docs/project-pack/02-current-demo-state.md)
- [当前问题清单](docs/project-pack/03-current-bug-list.md)
- [迭代历史](docs/project-pack/04-iteration-history.md)
- [下一步路线图](docs/project-pack/05-next-step-roadmap.md)
- [环境变量说明](docs/environment.md)
- [系统架构说明](docs/architecture.md)

## Principle

> AI 参与表达，不替代规则；AI 增强体验，不决定命运。

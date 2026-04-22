# 大学生模拟器 v0 Demo

一个本地优先的大学四年时间管理模拟器 Demo。当前版本优先跑通真实闭环，而不是先做部署或复杂玩法堆叠。

## 现在已经能做什么

- 开新档并生成随机开局
- 在主游戏页查看学院、学校档次、城市等级、家庭背景、生活费、天赋和当前状态
- 按月提交课程策略与行动计划
- 完成 1 个月结算并看到数值变化
- 生成并保存 1 篇 AI 月记
- 查看结构化履历、关键日志和当前结局预览
- 将 `runs`、`monthly_states`、`game_event_logs`、`ai_reports`、`resume_items` 写入数据库

## 技术栈

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase SDK
- PostgreSQL schema bootstrap
- OpenAI 兼容接口
- Vitest

## 目录结构

- `app`：页面入口、动态页面和 server actions
- `components`：共享展示组件与月度行动表单
- `lib/supabase`：Supabase client 与最小 repository
- `lib/ai`：AI 客户端与月记/结局报告生成封装
- `lib/demo`：主 agent 在阶段 3 新增的整合层，负责把规则层、数据层、AI 层接成真实闭环
- `core/game-engine`：游戏主引擎与月推进入口
- `core/generators`：开局随机生成器
- `core/resolvers`：课程、行动、事件、学期与结局判定
- `core/prompts`：AI 月记与结局报告的 prompt contract
- `types`：共享类型
- `data`：数据驱动事件池
- `db`：数据库 schema 与 schema bootstrap
- `docs`：架构与实施说明
- `tests`：规则层与整合服务层测试

## 环境变量

项目使用以下本地配置键：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`：可选，不填时默认使用 `gpt-4.1-mini`

`.env.local` 已加入忽略规则，不会入库。

## 本地运行

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

首次通过页面或服务层创建 run 时，服务端会：

1. 读取 `db/schema.sql`
2. 使用 `DATABASE_URL` 自动尝试应用最小 schema
3. 发送 `NOTIFY pgrst, 'reload schema'` 让 Supabase 立即刷新 schema cache

这意味着本地 Demo 不需要你手动先建表，就可以直接跑开局和月结算闭环。

## 验证命令

```bash
npm test
npm run lint
npm run build
```

## 当前 Demo 流程

1. 在开局页点击“开新档”
2. 跳转到主游戏页，查看随机开局结果
3. 提交课程策略与 3 个行动槽位
4. 跳转到月结算页，查看数值变化和 AI 月记
5. 在月记、履历、结局页继续查看数据库中已保存的数据

## 扩展方向

- 把当前月度表单升级为更细粒度的周计划或时间块决策
- 丰富必须事件与补救事件池
- 将学期结算和四年结局真正接入长流程 UI
- 收紧 demo 阶段的开放策略，切换到更正式的 RLS / 服务端写入模型
- 加入更完整的求职、实习和恋爱相关事件链


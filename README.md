# 大学生模拟器 v0.2 朋友内测版 Demo

这是一个以“大学四年时间管理”为主题的 Next.js Demo。当前版本重点不是正式公测，而是让本地闭环和 VPS 朋友内测都能稳定跑起来。

当前实现坚持以下边界：

- 核心规则全部由代码判定。
- AI 只负责月记和结局报告。
- 页面负责展示和交互，不负责核心规则结算。
- 数据层保留结构化快照、日志、履历和 AI 输入输出，方便继续扩展和排查。

## v0.2 这轮重点改了什么

- 行动系统从“整月一次性批处理”改成了“按次行动、即时结算、即时推进”。
- 时间表达从 30 天平铺改成了 4 周周历，而且同一周内可以连续安排多个动作直到时间耗尽或主动结束。
- 日志拆成两套：
  - 前台日志：给玩家看的中文月度回顾。
  - 后台日志：给开发和数据库留档的系统记录。
- 月记 fallback 和 AI prompt 都改成了第一人称、拟人、自述式表达。
- 金钱系统改成了每周补给 + 每周固定生活支出。
- 新增“吃大餐”即时消费动作：
  - 花钱
  - 回心情
  - 降压力
  - 不推进周历
- 主游戏页现在会直接显示“本次行动结果卡”，把时间、金钱、心情、压力、学业变化和下一步提示一起给玩家看。
- 翘课不再直接扣学业值，代价改为点名风险、平时分风险、代签花费和补救压力。
- 学习收益被削弱，并加入连续学习递减、低心情/高压力效率下降。
- 加入了最小状态驱动随机事件：
  - 奖学金
  - 社交互助
  - 经济压力
  - burnout / 摆烂低潮

## 当前可试玩闭环

你现在可以在本地完成这条主流程：

1. 开新档
2. 随机开局
3. 在主游戏页按周历逐步提交行动
4. 每次行动后立即看到结果卡、状态变化和“接下来还能做什么”
5. 月末看到月结算、前台中文日志和 AI 月记
6. 在履历页查看履历条目、前台日志和后台日志
7. 在结局页查看基于规则层判定的当前结局预览

## 项目结构

- `app`
  Next.js 页面和 server actions。
- `components`
  UI 组件，不承载核心规则。
- `lib/demo`
  整合层，负责把规则层、数据层和 AI 表达层接起来。
- `lib/supabase`
  Supabase client 与 repository。
- `lib/ai`
  AI 调用封装与 fallback 表达层。
- `core/game-engine`
  主流程推进与月度/周度结算入口。
- `core/generators`
  开局随机生成。
- `core/resolvers`
  行动、课程、事件、学期、结局等规则判定。
- `core/prompts`
  月记和结局报告的 prompt contract。
- `data`
  数据驱动事件池。
- `db`
  最小 schema 与 schema bootstrap。
- `types`
  跨层共享类型。
- `docs`
  架构边界和本轮迭代说明。
- `tests`
  规则层与整合层测试。

## 环境变量

项目从根目录的 `.env.local` 读取配置，当前不会把它提交进 git。

常用变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

如果没有可用的 AI 配置，系统会自动退回到本地 fallback 月记 / 结局报告，不会阻塞 Demo 试玩。

完整环境变量说明见 [`docs/environment.md`](docs/environment.md)。仓库提供了 `.env.example`，只包含占位符，不包含真实 secret。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

首次创建 run 时，服务端会自动尝试：

1. 读取 `db/schema.sql`
2. 使用 `DATABASE_URL` 初始化最小 schema
3. 刷新 Supabase schema cache

## 验证命令

```bash
npm test
npm run lint
npm run build
```

本轮主 agent 整合与审查修补完成后，这三条命令都已通过。

## VPS 朋友内测部署

推荐使用 PM2 + Nginx + Next.js 生产模式：

```bash
npm ci
npm run build
pm2 start ecosystem.config.js --env production
```

Nginx 反向代理示例在 [`deploy/nginx/freshmanto-beta.conf.example`](deploy/nginx/freshmanto-beta.conf.example)。

详细部署步骤见 [`docs/deployment.md`](docs/deployment.md)，包括：

- VPS 依赖安装
- 生产环境变量区分
- PM2 启动和重启
- Nginx 反向代理
- HTTPS 配置建议
- 更新部署流程

部署后可以访问 `/api/health` 做最小健康检查。该端点只返回配置是否存在的布尔值，不返回任何 secret。

## 已知限制

- 当前“按次行动”是按周推进，不是细到每天或每个半天。
- “吃大餐”已经是不推进周历的即时消费，但其他即时型生活动作还没有扩展出来。
- 随机事件系统已具备最小可扩展结构，但事件池仍然偏小。
- 学期结算和最终结局已经接通基础演示流，但还没有形成完整四年长线内容密度。
- 履历、求职、恋爱和更细的人际关系仍然是后续扩展方向。

## 后续可扩展方向

- 把周推进继续细化成“周内多个时间块”的策略层。
- 扩充必须事件、补救事件和状态事件池。
- 让社交资源、帮签到、人脉补救进入更多规则链路。
- 丰富经济系统中的消费选择、债务压力和不同家庭支持策略。
- 把结局维度扩展到就业、关系、精神状态和城市去向。

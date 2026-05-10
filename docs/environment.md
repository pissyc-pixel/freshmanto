# 环境变量说明

本项目会从运行环境读取变量。本地开发通常使用 `.env.local`，生产部署建议使用 VPS 上的 `.env.production` 或 PM2 注入的环境变量。

不要提交任何真实 secret。仓库里的 `.env.example` 只用于展示变量名和占位符。

## 本地开发

本地开发优先放在 `.env.local`：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL，前端可见。
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`：Supabase publishable key，前端可见。
- `SUPABASE_SECRET_KEY`：服务端写入和刷新 schema cache 使用，不能暴露到前端。
- `DATABASE_URL`：Postgres 连接串，服务端用于初始化最小 schema，不能暴露到前端。
- `OPENAI_API_KEY`：OpenAI 兼容接口 key，服务端使用，不能暴露到前端。
- `OPENAI_BASE_URL`：OpenAI 兼容接口地址，可选。
- `OPENAI_MODEL`：月记和结局报告使用的模型名，可选。
- `AI_REPORT_TIMEOUT_MS`：AI 月记 / 结局报告请求超时，默认 8000ms；超时会使用本地 fallback。

## 生产部署

生产环境至少准备：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `NODE_ENV=production`

AI 相关变量可选。如果缺少 `OPENAI_API_KEY`，系统会使用本地 fallback 月记和结局报告，试玩流程不会因此中断。

## 前端可见与服务端专用

前端可见：

- 只有 `NEXT_PUBLIC_*` 前缀变量会进入浏览器 bundle。

服务端专用：

- `SUPABASE_SECRET_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `AI_REPORT_TIMEOUT_MS`

上线前请确认页面和组件没有直接读取服务端专用变量。

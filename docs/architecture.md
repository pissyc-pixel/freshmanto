# 大学生模拟器 v0 架构边界

## 目标

本地先跑通最小闭环 Demo，同时保持清晰分层，方便在后续阶段继续扩展。当前架构优先保证：

- 核心规则全部由代码判定
- AI 只负责月记和结局报告
- 页面只负责展示与交互，不承载核心结算逻辑
- 数据层可替换，不让规则层强依赖数据库

## 分层约定

### 1. 数据层

目录：

- `lib/supabase`
- `db`

职责：

- 管理 Supabase client 与服务端访问封装
- 提供 `runs`、`monthly_states`、`game_event_logs`、`ai_reports`、`resume_items` 的读写能力
- 为排查问题保存结构化快照、关键日志、AI 输入摘要与 AI 输出

禁止：

- 在数据访问层做游戏规则判定
- 在数据层拼接 UI 展示文案

### 2. 规则层

目录：

- `core/game-engine`
- `core/generators`
- `core/resolvers`
- `data`

职责：

- 开局随机生成
- 时间系统与行动合法性判定
- 课程、学业、社交、金钱、事件、学期结算与毕业风险判定
- 生成供 UI 和 AI 使用的结构化事实摘要

禁止：

- 直接依赖页面组件状态
- 把关键规则写进 prompt
- 依赖 AI 决定结果

### 3. UI 层

目录：

- `app`
- `components`

职责：

- 组织页面路由
- 展示开局信息、状态面板、行动入口、月结算、月记、履历、结局
- 调用规则层和数据层接口

禁止：

- 在页面组件中直接堆放大段规则逻辑
- 在组件里自行改写核心判定结果

### 4. AI 表达层

目录：

- `lib/ai`
- `core/prompts`

职责：

- 只处理月记和结局报告生成
- 只消费规则层提供的结构化摘要
- 保存 AI 请求摘要和返回文本，便于排查

禁止：

- AI 参与核心判定
- AI 发明未发生的重要事实
- prompt 中承载毕业判定、事件成功率、课程风险等规则

## 并行开发边界

为了支持主 agent 与辅助 agent 并行开发，按以下方式分配文件所有权：

- 数据层辅助 agent：`lib/supabase`、`db`、数据访问相关 `types`
- 规则层辅助 agent：`core/game-engine`、`core/generators`、`core/resolvers`、`data`、规则相关 `types`
- UI + AI 辅助 agent：`app`、`components`、`lib/ai`、`core/prompts`、展示相关 `types`

主 agent 负责最后整合、接口对齐、联调和文档更新。


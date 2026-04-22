# 大学生模拟器 v0 架构边界

## 目标

当前版本先跑通本地最小闭环 Demo，同时保持清晰分层，方便继续扩展。当前架构优先保证：

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

- 管理 Supabase client 与最小 repository
- 管理 `runs`、`monthly_states`、`game_event_logs`、`ai_reports`、`resume_items`
- 负责 schema bootstrap 与 schema cache 刷新
- 保存状态快照、关键日志、AI 输入摘要与 AI 输出

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
- 通过 server actions 触发整合层服务

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

### 5. 整合层

目录：

- `lib/demo`
- `app/actions.ts`

职责：

- 把规则层、数据层、AI 层接成一条真实演示链路
- 负责 create run、advance month、保存快照、写日志、写 AI 报告
- 保证页面不需要直接拼装跨层流程

禁止：

- 把规则实现挪回页面
- 绕过结构化摘要直接让 AI“自由发挥”

## 当前真实闭环

1. 开局页通过 server action 创建 run
2. 整合层调用规则生成器，写入 `runs`
3. 主游戏页读取真实 run 与数据库日志
4. 提交月度计划后，整合层调用月推进、保存 `monthly_states`
5. AI 层使用规则摘要生成月记，并写入 `ai_reports`
6. 履历与日志落入 `resume_items`、`game_event_logs`
7. 结局页读取规则层预估或正式 ending report

## 并行开发边界

阶段 2 并行开发的文件所有权如下：

- 数据层辅助 agent：`lib/supabase`、`db`、`types/db.ts`
- 规则层辅助 agent：`core/game-engine`、`core/generators`、`core/resolvers`、`data`、`types/game.ts`
- UI + AI 辅助 agent：`app`、`components`、`lib/ai`、`core/prompts`、`types/ai.ts`

主 agent 在阶段 3 负责把这些模块整合成真实闭环，并补最终验证与文档更新。

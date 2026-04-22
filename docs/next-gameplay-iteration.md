# 下一轮玩法迭代计划

## 目标

- 这轮不推翻现有 v0.2，而是在现有 `4 周 / 月`、规则层先算事实、AI 只做表达的架构上继续增量修改。
- 保留“月结算 + 月记”作为月末闭环，把“每周一个动作”改成“每周一个时间池，玩家在池内连续做多个动作直到时间耗尽或主动结束本周”。
- 核心规则继续全部由代码决定，AI 仍然只负责月记和结局报告。

## 关键改动

### 时间模型

- 把当前 `ActionTurnPlan = 每周 1 个 action` 改成“每周时间池”模型。
- 内部统一用“半天单位”计时，但允许动作声明不同时间消耗。
- 每周默认可行动时间按当前作息生成：
  - 周一、周三、周五：只有夜间空闲。
  - 周二、周四：白天半天 + 夜间空闲。
  - 周六、周日：白天 + 夜间空闲。
- 动作默认耗时：
  - `study`、`social`、`relax`、`student_activity`、`remedy`：1 个半天单位。
  - `job_prep`、`part_time`：2 个半天单位。
  - `big_meal`、`ask_family`：0 单位，即时结算。
  - 新增 `skip_class`：0 单位，但会释放时间并立刻结算课程风险。
- 主流程每做完一次动作都返回：
  - `timeDelta`
  - `remainingTime`
  - `statDelta`
  - `triggeredEvents`
  - `nextOptions`

### 翘课逻辑

- 保留课程策略作为“本周默认课程态度”，但新增显式 `skip_class` 动作。
- `skip_class` 允许玩家选择本周要翘的天数，MVP 只作用于当前周仍然被课程锁住的整块白天课程日。
- `skip_class` 不直接扣学业值，代价全部转成：
  - `rollCallRiskDelta`
  - `usualScoreRiskDelta`
  - `proxyCost`
  - `remedyPressure`
- 成功翘课后，系统立即把对应天数的课程锁定时间转成自由时间，并在本轮反馈里明确显示释放了多少时间。

### 经济与事件

- 把“月度固定生活费”改成“每周固定生活费”，并在每周开始时只结算一次。
- 每周支出 = `城市基础消费 + 家庭背景消费修正`。
- 每周开始时同步发放 `weeklyAllowance = round(monthlyAllowance / 4)`，并在反馈中一起展示“本周到账 / 本周固定支出”。
- `big_meal` 保留 0 时间消耗，但必须在即时反馈里清楚显示“没占时间，只花钱换心情 / 降压力”。
- 随机事件拆成两层：
  - 行动后即时事件
  - 月度兜底事件
- 事件权重必须和状态联动：
  - 高压力：更容易触发负面、拖延、burnout 事件。
  - 高社交：更容易触发帮忙签到、共享资料、人脉机会。
  - 高学业：更容易触发奖学金、老师关注、学习机会。
  - 低金钱：更容易触发经济窘迫、兼职机会、消费压力。

### 玩家反馈与 AI

- 主游戏页新增明显的“本次行动结果卡”。
- 结果卡至少包含：
  - 时间变化
  - 金钱变化
  - 心情变化
  - 压力变化
  - 学业变化
  - 是否触发事件
  - 是否释放了翘课时间
  - 当前还能做什么
- 前台日志继续只给玩家看，后台日志继续只给系统留档。
- 月记继续只在月末生成，但 prompt 和 fallback 都必须是一人称月度回顾，不能写成系统汇报。
- `ReportPreview` 默认隐藏结构化原始 JSON，只在显式调试开关打开时展示。

## 并行边界

## 续跑恢复（2026-04-23）

### 当前仓库状态

- 工作树干净，可直接在现有提交链上继续增量修改。
- 已存在上一轮主 agent 规划提交：`18278fa docs: plan next gameplay iteration and subagent boundaries`
- 已存在三块实现提交：
  - `81f6c76 feat: improve player feedback logs and humanized monthly journal`
  - `133e4af feat: add expenses rebalance study and state-linked random events`
  - `0ef170a feat: refactor flow into time-cost actions with continuous decisions`
- 这说明本轮不需要重做 A / B / C，而是要在现状上补齐“真正收口”的整合、回归、审查与修补。

### 已确认完成的部分

- 周内剩余时间与连续行动入口已经进入主流程。
- `skip_class`、`big_meal`、周补给 / 周支出、状态联动事件、即时反馈卡、第一人称月记 prompt / fallback 已有代码落点。
- 规则判定仍在代码层，AI 仍只负责月记与结局表达。

### 当前阻塞

- 回归测试里仍有旧语义残留，至少 `tests/core-rules.test.ts` 还按“每次推进后直接进入下一周”断言，和当前“同一周持续行动直到时间耗尽”的规则不一致。
- 本轮提交链缺少独立的“主 agent 整合联调”提交和“代码审查后修补”提交，验收闭环还没补全。

### 本次续跑的增量边界

- Subagent A：只检查时间流 / 行动系统里仍未覆盖的边角与测试语义收口，不推翻当前多动作时间池实现。
- Subagent B：只检查经济压力、学习收益递减、状态联动事件的缺口与失衡点，不重写事件框架。
- Subagent C：只检查行动后即时反馈、中文化文本、月记 / 结局表达与玩家可读性缺口，不把规则塞回 AI。
- 主 agent：负责合并 A / B / C 的增量结果、统一共享接口、修复回归测试与文档，再做独立代码审查和收尾修补。

### 阶段 1：主 agent 规划

- 只更新规划文档，不改业务实现。
- 输出共享类型归属、并行接口和整合风险点。
- 提交信息：`docs: plan next gameplay iteration and subagent boundaries`

### Subagent A：时间流与行动系统重构

- 负责文件：
  - `types/game.ts`
  - `core/game-engine/*`
  - `core/resolvers/schedule.ts`
  - `core/resolvers/attendance.ts`
  - `lib/demo/run-service.ts`
  - `app/actions.ts`
  - `app/game/page.tsx`
  - `components/action-plan-form.tsx`
  - `components/time-block-strip.tsx`
  - `tests/demo-run-service.test.ts`
- 任务：
  - 把周推进从“1 周 1 动作”改成“1 周多动作直到时间耗尽”。
  - 实现 `skip_class` 释放时间与风险链。
  - 在主游戏页体现剩余时间、可继续决策入口和提前结束本周入口。
- 约束：
  - A 是共享核心类型 owner。
  - B/C 不改 `types/game.ts`。
- 提交信息：`feat: refactor flow into time-cost actions with continuous decisions`

### Subagent B：经济系统 / 状态平衡 / 事件联动

- 负责文件：
  - `core/resolvers/actions.ts`
  - `core/resolvers/events.ts`
  - `core/resolvers/semester.ts`
  - `data/events.ts`
  - `tests/core-rules.test.ts`
- 任务：
  - 周度生活费和周度补给。
  - 家境影响消费但保留高家境容错。
  - 学习收益继续压低，并确保连续学习、低心情、高压力都能明显削收益。
  - 扩充事件池并改成“动作后即时事件 + 月度兜底事件”。
- 约束：
  - 不改主页面。
  - 不改 `types/game.ts`。
  - 若需要新增共享字段，由主 agent 在阶段 3 收口。
- 提交信息：`feat: add expenses rebalance study and state-linked random events`

### Subagent C：前台反馈 / 月记 / 玩家可读性

- 负责文件：
  - `components/log-feed.tsx`
  - `components/report-preview.tsx`
  - 新增即时反馈组件
  - `app/settlement/page.tsx`
  - `app/journal/page.tsx`
  - `app/resume/page.tsx`
  - `app/ending/page.tsx`
  - `lib/ai/reports.ts`
  - `core/prompts/*`
  - `tests/player-facing-narrative.test.ts`
- 任务：
  - 玩家即时反馈卡和“下一步还能做什么”的可读组件。
  - 前台日志继续中文化和事件叙事化。
  - 月记 / 结局 fallback 与 prompt 进一步拟人化。
  - 修正本轮涉及的玩家可见乱码文本。
- 约束：
  - 不改 `app/game/page.tsx` 主流程。
  - 不改规则层。
- 提交信息：`feat: improve player feedback logs and humanized monthly journal`

### 阶段 3：主 agent 整合

- 主 agent 负责合并 A/B/C 成果，修复共享类型和接口不匹配。
- 整合热点：
  - `types/game.ts`
  - `lib/demo/run-service.ts`
  - `app/game/page.tsx`
  - `lib/demo/options.ts`
  - `README.md`
  - `docs/architecture.md`
- 提交信息：`feat: integrate next gameplay iteration end to end`

## 验证重点

- 周时间池生成与剩余时间递减。
- 0 时间动作不会消耗时间。
- `skip_class` 会立即释放时间，但只增加课程风险链，不直接扣学业值。
- 每周生活费和周补给只结算一次。
- 连续学习、低心情、高压力下的学习收益递减。
- 事件权重随压力、社交、学业、金钱变化而变化。
- 当月没有即时事件时，月末一定补 1 个事件。
- 回归命令：
  - `npm test`
  - `npm run lint`
  - `npm run build`

## 假设

- 本轮继续保留“月末才生成 AI 月记 / 结局报告”，不把 AI 拉进行动中判定。
- 当前作息结构继续保留“周二 / 周四半自由、周末自由”的基线，不重做学校日历。
- `skip_class` 的 MVP 范围是释放当前周仍被课程锁住的整块白天课程日，不处理更细的单节课粒度。
- 即时反馈优先做成明显的服务端渲染结果卡，而不是先引入复杂客户端弹窗状态管理。

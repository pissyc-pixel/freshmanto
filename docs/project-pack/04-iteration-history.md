# 关键迭代历史

下面只记录对当前项目形态影响最大的几轮，不追求完整流水账。

## 第 1 轮：把周排程骨架从抽象月行动改成逐天周历

- 主题：
  - 重构主玩法主干
- 主要改动：
  - 从“抽象行动池 + 模糊半天数”改为“先定课程态度 -> 周前事件落位 -> 逐天选 1 个行动 -> 确认后统一周结算”
- 对应提交：
  - `c21903f` `feat: refactor weekly planner into day-by-day scheduling`
- 当前结果：
  - 确立了现阶段最重要的玩法骨架
- 下一步影响：
  - 后续所有成长、方向和前台表达优化都建立在这条骨架上

## 第 2 轮：刷新成长日志、月记与履历页

- 主题：
  - 前台表达从系统流水改成人话
- 主要改动：
  - 前台日志改为成长日志
  - 月记更像大学生自述
  - 履历优先展示 GPA / 排名 / 百分比 / 比赛 / 实习 / 奖学金
- 对应提交：
  - `fddee8e` `feat: refresh growth journal monthly diary and resume views`
- 当前结果：
  - 玩家可见信息结构明显更清楚
- 下一步影响：
  - 为后续“方向形成可感知化”打底

## 第 3 轮：接入长期人生导向倾向系统

- 主题：
  - 让未来方向开始在大学过程中逐步形成
- 主要改动：
  - 新增就业 / 考研 / 考公 / 推免 / 未定等长期倾向层
- 对应提交：
  - `6819f09` `feat: add long-term direction tendency system`
- 当前结果：
  - 后半程路径第一次从规则层接进来了
- 下一步影响：
  - 为推免、公考、就业、考研分支打通状态基础

## 第 4 轮：接入长期竞赛项目与奖项层级

- 主题：
  - 竞赛从一次性动作升级为长期项目线
- 主要改动：
  - 竞赛入口、投入、门槛、奖项层级、履历回流
- 对应提交：
  - `bf6646f` `feat: introduce competition projects and award tiers`
- 当前结果：
  - 长期项目成长线有了第一版骨架
- 下一步影响：
  - 进一步支撑推免与履历竞争力

## 第 5 轮：把周前事件扩成 ABDE 结构

- 主题：
  - 事件系统从零散事件进入结构化阶段
- 主要改动：
  - 强制占用、信息机会、履历机会、学院/学校风味类事件接入
- 对应提交：
  - `12d8593` `feat: expand weekly events into ABDE categories`
- 当前结果：
  - 事件终于能真实影响本周排程选择
- 下一步影响：
  - 给后续路径形成提供现实节奏感

## 第 6 轮：把“方向形成”真正前台可感知化

- 主题：
  - 不是后台有数值，而是前台能感觉到“我正在变成什么样的人”
- 主要改动：
  - 游戏页方向提示
  - 履历页证据化解释
  - 成长日志和月记更明确地反映未来方向形成
- 对应提交：
  - `c4ba877` `feat: surface direction signals in game and resume views`
  - `4f2f813` `feat: make growth journal reflect future direction shaping`
  - `4bdc0c2` `feat: improve diary narration for emerging life paths`
- 当前结果：
  - 后期路径第一次真正被玩家感知到
- 下一步影响：
  - 可以继续补具体路径内容，而不是只堆隐藏值

## 第 7 轮：上线前收尾与项目清理

- 主题：
  - 清理构建产物、补忽略规则、收尾结局页
- 主要改动：
  - 补 `.gitignore`
  - 清理 `tsconfig.tsbuildinfo`
  - 整理结局页前台展示
- 对应提交：
  - `b375e01` `chore: finalize preflight cleanup and ending view review`
- 当前结果：
  - 工程状态更适合提交和部署
- 下一步影响：
  - 减少无关脏改动污染后续迭代

## 第 8 轮：修周排程状态同步与玩家文案混乱

- 主题：
  - 收敛周排程主交互的前台问题
- 主要改动：
  - 同步周排程状态
  - 清理玩家可见 copy
  - 收敛“本月概览”和“安排这一周”的重复感
- 对应提交：
  - `d23a707` `fix: sync weekly planner state and clean player copy`
- 当前结果：
  - 方向正确，但这条链路后来仍暴露出更深的状态问题
- 下一步影响：
  - 促成后续继续修 weekly settlement source of truth

## 第 9 轮：修月度 summary 丢失周结算的问题

- 主题：
  - 保住月度 summary 里的 weekly settlements
- 主要改动：
  - 修正 `weeklySettlements` 保留逻辑
- 对应提交：
  - `03db403` `fix: preserve weekly settlements in monthly summaries`
- 当前结果：
  - 月结算与周结算之间的衔接更稳
- 下一步影响：
  - 有利于成长日志、月记和月度汇总稳定读取

## 第 10 轮：修规则层关键 bug 与现金预警

- 主题：
  - 收紧周排程、比赛线和现金风险规则
- 主要改动：
  - 比赛线只在真正开放后才可继续投入
  - 跳过比赛入口后当天仍回退普通行动
  - 周结算优先读取真实 `plannedAction`
  - 增加周前现金风险 warning
- 对应提交：
  - `b148926` `fix: tighten weekly planning rules and cash warnings`
- 当前结果：
  - 当前最重要的规则层 bug 已做集中修复
- 下一步影响：
  - 后续开发前应先做足链路回归，而不是继续堆新系统

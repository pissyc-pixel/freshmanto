# freshmanto 全面代码审查与下一步方向

## 1. 总体结论
- 项目当前更接近“可玩原型 / 内测原型”，不是正式产品；开局、周排程、周结算、月结算、成长日志、月记、履历、结局预览已经形成可运行闭环。
- 核心规则目前基本仍是代码驱动，AI 主要只接在月记和结局表达层，没有发现 AI 直接决定规则、成功失败、奖学金、推免、就业结果的实现。
- `lint`、`test`、`build` 当前都通过；`test` 为 `107 passed`，`build` 也完成了 Next.js 编译和 TypeScript 检查，但 `package.json` 里没有独立 `typecheck` 脚本。
- 周排程到周结算的主链路，当前已经比历史版本稳很多：玩家逐天选择会保存到 `currentWeekState.days[].plannedAction`，确认一周时也确实优先读取这个字段。
- 当前最明确的 P0 风险是：竞赛说明会类周前事件存在“漏选也会默认参加”的逻辑，会把“未选择”误判成“接受入口”，这和“漏选只补摆烂”的核心预期冲突。
- 当前事件系统 ABDE、竞赛长期线、方向形成、奖学金、推免资格判断都已经有规则骨架，但内容厚度和状态覆盖还明显偏首发版。
- 历史月结算页存在表达层漂移风险：部分解释读取当前 run，而不是该月 snapshot，回看旧月份时可能看到“后来的状态解释”。
- 工程层没有看到大面积 `any` 滥用，Server Action 也有基础 Zod 校验；但页面和表单组件明显偏大，历史兼容逻辑开始增多，维护成本会继续上升。
- 下一轮不建议先加新系统，应该先把周排程、竞赛线、月末 summary、前台解释同步、现金预警这五条回归链路压实。

## 2. 当前项目阶段判断
判断：可玩原型，接近内测原型，但还不适合当成正式产品。

依据：
- 已有完整主流程：开局 -> 周排程 -> 周结算 -> 月结算 -> 成长日志 / 月记 / 履历 / 结局预览。
- 核心规则已经代码化，不是纯概念 demo。
- 测试、lint、build 已接入，且本轮全部通过。
- 但竞赛、后期路径、事件池、历史页面一致性、多路径状态转移覆盖仍有明显空白。

## 3. 已经跑通的核心闭环
当前玩家流程已经能这样走通：

开局：
- `createInitialGameRun` 生成基础画像和初始状态。
- `lib/demo/run-service.ts` 的 `createDemoRun` 负责持久化 run。

周排程：
- `app/game/page.tsx` 通过 `app/game/view-model.ts` 渲染 `activeMonth.currentWeekState.days`。
- `components/action-plan-form.tsx` 提交 `set_attendance`、`plan_day`、`confirm_week` 到 `app/actions.ts`。
- 服务层依次调用 `setDemoWeekAttendance`、`planDemoWeekday`、`confirmDemoWeek`。

周结算：
- 规则入口是 `core/game-engine/monthly.ts` 的 `confirmPlannedWeek`。
- 它逐天读取 `currentWeekState.days[].plannedAction`，仅在缺失时补默认动作，然后逐日叠加：
  - `resolveActionPlan`
  - 事件 boost
  - 每日生活成本
  - 翘课 penalty
- 最后生成 `latestWeekSettlement` 和 `weeklySettlements[]`。

月结算：
- 第 4 周确认后，`finalizePlannedWeek` -> `buildMonthlySummary` -> `persistMonthArtifacts`。
- 月度 snapshot 会保存到 `monthly_states`，AI 月记输入也从这个结构化 summary 生成。

成长日志 / 月记 / 履历 / 结局预览：
- `lib/demo/monthly-digest.ts` 基于 `StructuredMonthlySummary` 生成成长日志和 digest。
- `lib/ai/reports.ts` 负责月记与结局 prompt/fallback。
- `app/resume/page.tsx` 读取 resume items 和当前 progression。
- `app/ending/page.tsx` 读取 `evaluateGraduationOutcome` 的结构化结果。

## 4. P0 风险

### P0-1 周前竞赛入口会在“未选择”时被自动接受
- 现象：
  玩家如果没有给竞赛说明会那一天安排动作，系统不会补成默认摆烂，而是会自动补成“参加说明会”，从而激活长期竞赛线。
- 涉及文件：
  - `core/game-engine/monthly.ts`
  - `core/resolvers/weekly-events.ts`
- 根因猜测：
  竞赛事件模板把 `defaultAttendIfUnplanned` 设为 `true`，而 `confirmPlannedWeek` 在缺少 `plannedAction` 时，会优先调用 `createAutoFilledSpecialAction`，不是直接补 idle。
- 证据：
  - `core/resolvers/weekly-events.ts` 的 `buildCompetitionInviteInstance` 返回 `defaultAttendIfUnplanned: true`。
  - `core/game-engine/monthly.ts` 的 `createDefaultPlannedActionForDay` 会优先 `createAutoFilledSpecialAction(...) ?? createAutoFilledIdleAction(...)`。
  - `confirmPlannedWeek` 对缺失日期使用 `day.plannedAction ?? createDefaultPlannedActionForDay(...)`。
  - 后续如果该动作被接受，且 `sourceEventId === weekState.event.id`，会执行 `activateCompetitionProject(...)`。
- 修复/验证建议：
  - 把“漏选默认补摆烂”和“事件默认参加”二选一，优先保持前者。
  - 至少补一个 P0 测试：有竞赛入口事件时，若玩家未选择该日，结算后该日应为 `idle`，项目线不应自动 `active`。
  - 如果产品上确实想保留“默认参加”，前台必须明确写出这是强制默认行为，且不能与“漏选只补摆烂”同时存在。

## 5. P1 风险

### P1-1 月结算页的部分解释读取当前 run，而不是该月 summary snapshot
- 现象：
  回看旧月份结算页时，成长日志和 AI 月记基于该月 snapshot，但奖学金 / 推免 / 公考解释来自当前最新 run，存在历史页面漂移。
- 涉及文件：
  - `app/settlement/page.tsx`
  - `lib/demo/monthly-digest.ts`
  - `core/resolvers/progression.ts`
- 根因猜测：
  页面同时用了 `monthlyState.snapshot_json` 和 `bundle.run` 两套来源，但没有统一“历史页只看 snapshot”的约束。
- 证据：
  - `summary = monthlyState.snapshot_json`
  - `growthLog` / `digest` 使用 `summary`
  - `scholarshipExplanation` / `recommendationExplanation` / `publicExamExplanation` 却使用 `ensureProgressionState(bundle.run)`
- 修复/验证建议：
  - 历史结算页优先全部基于 `monthlyState.snapshot_json`。
  - 如果某些解释必须基于当前 run，就要明确标记“当前视角”而不是“该月视角”。
  - 补 integration test：打开旧月份 settlement 时，解释面板与该月 snapshot 中的 progression / scholarship 一致。

### P1-2 竞赛长期线支持“多项目并存”不完整，后续投入默认只记到首个 active 项目
- 现象：
  如果同学期存在多个 active 竞赛项目，后续 `competition_project` 投入只会累加到 `getLeadCompetitionProject` 返回的首个 active 项目。
- 涉及文件：
  - `core/resolvers/progression.ts`
  - `core/resolvers/schedule.ts`
- 根因猜测：
  行动层只有通用 `competition_project`，没有把“投入哪个项目”显式带进 planned action。
- 证据：
  - `resolveAvailableWeeklyActions` 只判断“是否存在 active 项目”，不区分具体项目。
  - `applyAcceptedActionProgression` 调用 `getLeadCompetitionProject(nextRun)`，随后 `touchCompetitionProject` 只推进一个项目。
- 修复/验证建议：
  - 下一轮若要做厚竞赛线，应把具体 `projectId` 带进 optionId 或 plannedAction。
  - 补测试：两个项目同时 active 时，玩家能明确选择投入哪一个，结算后 investedDays 落到正确项目。

### P1-3 “确认本周”约束比文案更宽，服务端并未要求先选满 7 天
- 现象：
  当前只要课程态度锁定，周计划就可以直接确认；未选日期会自动补全。这和“选满 7 天后统一确认”的文案不完全一致。
- 涉及文件：
  - `core/resolvers/schedule.ts`
  - `core/game-engine/monthly.ts`
  - `components/action-plan-form.tsx`
- 根因猜测：
  `isWeekReadyToConfirm` 只检查 `attendanceLocked` 与 `days.length > 0`，不是“7 天都已计划”。
- 证据：
  - `core/resolvers/schedule.ts` 的 `isWeekReadyToConfirm(...)` 直接返回 true。
  - `components/action-plan-form.tsx` 的 `readyToConfirmNow` 也允许提前确认。
- 修复/验证建议：
  - 要么修改文案，明确“可提前确认，未选日会补摆烂”。
  - 要么收紧规则，只在玩家确认“我接受剩余自动补全”后才允许提交。

### P1-4 后期路径规则骨架已通，但过程内容仍薄
- 现象：
  就业 / 考研 / 考公 / 推免方向已经有 tendency 和 progress，但真正的阶段性过程内容仍偏少。
- 涉及文件：
  - `core/resolvers/progression.ts`
  - `data/weekly-events.ts`
  - `app/game/page.tsx`
  - `app/resume/page.tsx`
- 根因猜测：
  当前实现先把方向形成数值、解释层和少量入口事件打通，再补内容池。
- 证据：
  - `applyAcceptedActionProgression` 已更新 tendency / readiness / publicExamProgress。
  - `buildDirectionPerception`、`buildRecommendationExplanation`、`buildPublicExamExplanation` 已有前台解释。
  - 但周前事件里对应 B/E 类内容池仍很少，且就业 / 考研 / 公考后续过程动作没有显式阶段。
- 修复/验证建议：
  - 第二阶段优先补“过程”，不是继续堆抽象数值。
  - 先选一条路径做厚，推荐先做就业或考研。

## 6. P2 风险

### P2-1 文档与实现整体接近，但仍有细节滞后
- 证据：
  - README 和 project pack 已经覆盖“周排程版”主流程。
  - 但 `package.json` 没有 `typecheck` 脚本，文档容易让人误以为存在独立类型检查入口。
  - 部署文档建议 Node 20 LTS，但本地实际运行环境是 Node `v24.14.0`；当前构建通过，不是 bug，但说明文档更偏“推荐环境”，不是实际约束。

### P2-2 页面与表单组件开始偏大，继续迭代会提高维护成本
- 重点文件：
  - `app/game/page.tsx`
  - `components/action-plan-form.tsx`
  - `app/resume/page.tsx`
- 判断：
  当前还没到必须立刻重构的程度，但已经值得在“稳定性回归”完成后拆 view model / section component。

### P2-3 仓库里存在较多本地运行痕迹文件
- 例如：
  - `.tmp-manual-dev.err.log`
  - `.tmp-manual-dev.out.log`
  - `.tmp-next-dev.err.log`
  - `.tmp-next-dev.out.log`
  - `build-debug.log`
  - `build-output.log`
- 说明：
  这些多数被 `.gitignore` 覆盖，不会直接泄露，但会增加工作区噪音。

## 7. 关键链路数据流

### 周排程数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 周开始初始化 | `ensureActiveMonth` / `buildWeekPlanningState` | `GameRun` | `activeMonth.currentWeekState` | 历史兼容逻辑较多 | 是 |
| 课程态度锁定 | `selectWeekAttendanceStrategy` | `attendanceStrategy` | `attendanceLocked=true` | `readyToConfirm` 语义偏宽 | 是 |
| 周前事件落日 | `resolveWeeklyEvent` | `run, week` | `WeeklyEventInstance` | 事件可能影响当天动作池 | 是 |
| 每天行动池生成 | `resolveAvailableWeeklyActions` | `day, event, run` | `WeeklyActionOption[]` | 竞赛 / 考研 / 考公解锁条件要回归 | 是 |
| 前端保存选择 | `planWeeklyDayAction` | `weekday, optionId, skipClass` | `days[].plannedAction` | optimistic UI 与服务端状态必须一致 | 是 |
| 周确认提交 | `confirmDemoWeek` -> `confirmPlannedWeek` | `runId` | `WeeklySettlementSummary` | 入口简单，核心全在后端 | 是 |
| 规则层逐日结算 | `confirmPlannedWeek` | `days[].plannedAction` | `dailyResults[]` | 默认补全不能覆盖真实选择 | 是 |
| 默认摆烂补全 | `createDefaultPlannedActionForDay` | 缺失的 `plannedAction` | `idle` 或 `specialAction` | 当前竞赛入口会默认参加 | 是 |
| 周结算写回 | `finalizePlannedWeek` | `dayTurns[]` | `latestWeekSettlement`, `weeklySettlements[]` | 月度保留逻辑已修过，仍要回归 | 是 |
| 月末汇总 | `buildMonthlySummary` | `turns`, `weeklySettlements` | `StructuredMonthlySummary` | snapshot 与当前 run 混用风险 | 是 |

### 事件数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 选模板 | `pickWeeklyEventTemplate` | `run, week` | `WeeklyEventTemplate` | 内容池偏少 | 是 |
| 实例化为具体某天 | `resolveWeeklyEvent` | `run, week` | `weekday` 固定的 `WeeklyEventInstance` | 真正落某天已实现 | 是 |
| 作用到动作池 | `resolveAvailableWeeklyActions` | `limitedActions / specialAction / actionBoosts` | 缩窄或追加选项 | 已选动作在事件变化时的安全性 | 是 |
| 作用到结算 | `findWeeklyEventBoost` + `confirmPlannedWeek` | `event, option` | 额外 stat/risk/resume/fact | 自动参加与主动参加边界 | 是 |

### 竞赛数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 学期生成入口 | `ensureProgressionState` / `createSeededProject` | `run` | `competitionProjects` 中的 `open` 项目 | 默认每学期补两个项目 | 是 |
| 入口事件曝光 | `buildCompetitionInviteInstance` | `open project` | 周前 D 类事件 | 目前可能默认自动接受 | 是 |
| 接受入口 | `confirmPlannedWeek` + `activateCompetitionProject` | event-day selected specialAction | `status=open -> active` | 漏选也会激活是主要风险 | 是 |
| 跳过入口 | `confirmPlannedWeek` + `closeCompetitionProject` | event-day selected normalAction | `status -> expired` | 关闭后应不可继续投入 | 是 |
| 长期投入 | `applyAcceptedActionProgression` | `competition_project` | `investedDays +1` | 多 active 项目时归属不清 | 是 |
| 学期结算 | `settleLongTermProgression` | active/open project at month 6/12 | `completed/expired + award` | 最低投入门槛已实现 | 是 |

### 方向形成数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 行动触发倾向变化 | `applyAcceptedActionProgression` | accepted action | tendency/readiness/progress | 主要靠动作，不靠 AI | 是 |
| 月末写入 summary | `persistMonthArtifacts` | settled run | `summary.progression` | 历史页应读 snapshot | 是 |
| 前台解释 | `buildDirectionPerception` / `buildRecommendationExplanation` / `buildPublicExamExplanation` | run 或 summary-derived state | 人可读解释 | settlement 页当前有漂移风险 | 是 |

### 月末 summary 数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 周内 turns 汇总 | `buildMonthlySummary` | `activeMonth.turns`, `weeklySettlements` | `StructuredMonthlySummary` | 周结算数组必须完整保留 | 是 |
| 长期进程追加 | `persistMonthArtifacts` + `settleLongTermProgression` | `nextRun` | `progression`, `competitionProjects`, `scholarshipAwarded` | 时间点要和设计一致 | 是 |
| 存储 | `saveMonthlyState` | `summary` | `monthly_states.snapshot_json` | 无额外 schema 校验 | 是 |

### AI 月记 / 结局表达数据流

| 步骤 | 文件/函数 | 输入 | 输出 | 风险点 | 是否需要测试 |
|---|---|---|---|---|---|
| 组 prompt | `buildMonthlyJournalPrompt` / `buildEndingReportPrompt` | structured summary | prompt payload | 已明确禁止编造 | 是 |
| 调用模型 | `generateAiReport` | payload | markdown | 超时 / 失败走 fallback | 是 |
| fallback | `renderMonthlyJournalFallback` / `renderEndingReportFallback` | same structured input | grounded markdown | 当前边界相对安全 | 是 |

## 8. 测试缺口

### P0
- 竞赛入口事件日未选择时，应补 `idle` 而不是自动参加说明会。
- 历史 settlement 页面读取指定月份时，解释面板必须和该月 snapshot 一致，而不是当前 run。
- 明确覆盖“有真实 `plannedAction` 时，默认补全绝不能覆盖它”的回归测试，最好再加 7 天混合选择版本。

### P1
- 两个 active 竞赛项目并存时，投入归属测试。
- 推免资格评估触发时点测试：确认是在大三下开始，而不是更早或更晚。
- 奖学金结算时点测试：确认产品设定和当前 month/year 映射是否一致。
- 不同学院 E 类事件的分布与效果差异测试。
- 不同城市生活成本和现金 warning 测试。

### P2
- 历史月记 / 成长日志 / 履历页的快照一致性测试。
- 文案层 contract test：避免前台出现 raw enum / internal tag。

## 9. 下一步开发路线建议

### 阶段一：稳定性回归
目标：先把现有规则链路稳住。

范围：
- 周排程到周结算
- 竞赛长期线
- 月末 summary
- 前台解释同步
- 现金风险 warning

建议：
- 先补测试，再修最关键边界。
- 先统一“未选择”的语义，再做竞赛线厚化。
- settlement 历史页先切到 snapshot 视角，避免表达层继续漂移。

### 阶段二：后半程路径做厚
目标：不是再加抽象数值，而是补真实过程。

范围：
- 推免资格后的选择
- 考研准备过程
- 公考准备与事件链
- 求职宣讲、投递、面试、offer

建议：
- 只选 1-2 条路径先做厚，避免四条一起摊薄。
- 优先“就业”或“考研”，因为当前动作和解释基础最完整。

### 阶段三：内容池扩容与产品化
目标：提高可玩时长和长期维护能力。

范围：
- 事件池
- 比赛池
- 学院/城市风味
- 结局内容库
- 观测与埋点
- 部署与运维文档

建议：
- 内容池扩容应建立模板和分类，不要继续把事件写死在大数组里而缺少维护策略。

## 10. 明确不建议现在做的事
- 不建议马上继续堆新系统。
- 不建议先做账号系统。
- 不建议让 AI 参与规则判定。
- 不建议在没有 P0 回归测试前重构周排程。
- 不建议先大改 UI 而不验证规则链路。

## 11. 建议的最小下一轮任务清单

### 1. 修正竞赛入口“漏选自动参加”边界
- 为什么做：
  这是当前最明确的规则越界风险，会把“未选择”误判成“接受长期线”。
- 涉及文件：
  - `core/game-engine/monthly.ts`
  - `core/resolvers/weekly-events.ts`
  - `tests/core-rules.test.ts`
- 验收标准：
  - 事件日未选择时，只补 idle。
  - 项目状态保持 `open` 或按设计关闭，但不能默认 `active`。
- 风险等级：P0

### 2. 为周排程到周结算补一组固定种子回归测试
- 为什么做：
  这是历史上最脆弱的链路，也是最近修复最频繁的区域。
- 涉及文件：
  - `tests/core-rules.test.ts`
  - 可拆分到新的 `tests/weekly-confirmation-regression.test.ts`
- 验收标准：
  - 7 天已选动作逐日准确落到 settlement。
  - 只漏选的日期才被 auto-fill。
  - 事件、skip class、现金支出都能逐日对上。
- 风险等级：P0

### 3. settlement 历史页改为 snapshot-first
- 为什么做：
  旧月份回看不该被最新 run 状态污染。
- 涉及文件：
  - `app/settlement/page.tsx`
  - `lib/demo/monthly-digest.ts`
  - 可能新增 view helper
- 验收标准：
  - 指定年/月时，解释面板与该月 snapshot 一致。
  - 回看旧月份不会显示后续月份才出现的推免 / 公考状态。
- 风险等级：P1

### 4. 竞赛项目投入显式带 projectId
- 为什么做：
  多项目并存时，当前投入归属不够稳。
- 涉及文件：
  - `types/game.ts`
  - `core/resolvers/schedule.ts`
  - `core/resolvers/progression.ts`
  - `components/action-plan-form.tsx`
- 验收标准：
  - active 项目可区分选择。
  - 结算后 `investedDays` 落到正确项目。
- 风险等级：P1

### 5. 现金 warning 回归测试与前台解释统一
- 为什么做：
  现金系统已经有入口，但“事前 warning”是玩家能否做出决策的关键。
- 涉及文件：
  - `core/game-engine/monthly.ts`
  - `app/game/view-model.ts`
  - `tests/core-rules.test.ts`
- 验收标准：
  - 低现金且本周无现金计划时，周前提示出现。
  - 提示文案能说清“固定开销 + 缺口 + 建议动作”。
- 风险等级：P1

### 6. 明确奖学金与推免判定时间点的自动测试
- 为什么做：
  规则骨架已在，但时间点是最容易被后续改坏的部分。
- 涉及文件：
  - `core/resolvers/progression.ts`
  - `tests/core-rules.test.ts`
- 验收标准：
  - 大一不会错误拿到奖学金。
  - 推免资格只在大三下开始评估。
  - 说明层与规则层时间点一致。
- 风险等级：P1

### 7. 拆分 `ActionPlanForm` 和 `game/page` 的 view state
- 为什么做：
  当前逻辑已经可维护，但继续加功能会明显变脆。
- 涉及文件：
  - `components/action-plan-form.tsx`
  - `app/game/page.tsx`
  - `app/game/view-model.ts`
- 验收标准：
  - 不改变现有行为。
  - 把表单状态、弹窗、提交反馈拆到更小单元。
- 风险等级：P2

### 8. 清理工作区辅助产物与文档说明
- 为什么做：
  降低维护噪音，避免把调试痕迹误当项目资产。
- 涉及文件：
  - `.gitignore`
  - `README.md`
  - `docs/deployment.md`
  - 根目录若干 `.log`
- 验收标准：
  - README 明确当前实际脚本。
  - 部署与校验命令表述一致。
- 风险等级：P2

## 附：本轮执行结果
- `git status --short`：`?? docs/project-pack/`
- `git branch --show-current`：`codex/stabilize-planning-economy-stress-journal`
- `git log --oneline -n 10`：最近提交集中在 weekly planner / monthly summary / cash warning / competition fixes
- `node -v`：`v24.14.0`
- `npm -v`：`11.9.0`
- `package.json scripts`：存在 `dev` / `build` / `start` / `start:local` / `lint` / `test`
- `npm run lint`：通过
- `npm run typecheck`：脚本不存在
- `npm run test`：通过，`107 passed`
- `npm run build`：通过

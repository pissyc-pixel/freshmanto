# Image2 UI Real Integration Audit

本审计基于当前仓库代码、现有 App Router 页面、规则层与数据存取链路，而不是 UI Lab 原型图本身。

## Start / 开局

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/start`
- 当前真实页面位置：`/app/page.tsx`
- 数据来源：`startNewRunAction` -> `createServerDemoRun` -> `createInitialGameRun`
- 是否可真实接入：`real`
- 风险：主要风险在于只允许改视觉，不应改变开局动作、run 创建方式或首跳主流程
- 本轮处理方式：迁移开始页视觉；保留真实开档 action，不引入 mock 角色信息

## Admission / 录取通知书

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/admission`
- 当前真实页面位置：当前无独立真实页面；开局后直接进入 `app/game/page.tsx`
- 数据来源：可用数据仅来自 `GameRun.profile`（学校层级、城市层级、科类、家庭背景、天赋）；暂无真实姓名、院校名、专业名、校区字段
- 是否可真实接入：`partial`
- 风险：参考图依赖大量当前后端未存储字段；如果直接复刻完整通知书内容，很容易写入假学校、假专业、假校区
- 本轮处理方式：新增安全的开局确认页，只显示真实已有画像字段；缺失字段统一使用“待生成 / 未记录 / 暂未确认”类 fallback；保证能继续进入主玩法

## Weekly Planner / 周历主玩法

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/planner`
- 当前真实页面位置：`/app/game/page.tsx`
- 数据来源：`getServerDemoBundle(runId)`，`run.activeMonth`，`app/game/view-model.ts`，`confirmServerWeek` / `planServerWeekdayAction` / `setServerWeekAttendance`
- 是否可真实接入：`real`
- 风险：周排程 -> 周结算链路极其敏感；任何对 `currentWeekState`、`plannedAction`、确认 payload、默认补全逻辑的改写都会带来回归风险
- 本轮处理方式：只迁移视觉壳与布局层；不改状态管理、不改规则层、不改 payload、不引入静态周数据

## Action Modal / 行动选择弹窗

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/action-modal`
- 当前真实页面位置：`components/action-plan-form.tsx` 中的当前日行动弹窗
- 数据来源：`PlannerDayView.normalOptions / skipOptions`，`submitActionTurnAction`
- 是否可真实接入：`real`
- 风险：弹窗表单同时承载 `weekday`、`optionId`、`skipClass` 与 attendance context；UI 换壳时不能碰选中、提交、取消、关闭逻辑
- 本轮处理方式：仅调整结构与样式；保留所有现有提交行为和 option 来源

## Growth Journal / 成长日志

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/journal`
- 当前真实页面位置：当前主要嵌入在 `app/resume/page.tsx` 与 `app/settlement/page.tsx`，由 `buildGrowthJournalEntry` 生成；暂无独立高保真成长日志页
- 数据来源：`monthly_states.snapshot_json` -> `buildGrowthJournalEntry`
- 是否可真实接入：`partial`
- 风险：真实成长日志数据存在，但当前没有单独的稳定页面边界；若直接伪造人际、地图、社团网络等扩展内容会越界
- 本轮处理方式：优先把成长日志视觉迁移进已有真实页面，并在有必要时把 `/journal` 调整为真实日志 / 月记联合页，但仅展示真实月度快照能推出的内容

## Resume / 履历

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/resume`
- 当前真实页面位置：`/app/resume/page.tsx`
- 数据来源：`getServerDemoBundle(runId)`，`bundle.resumeItems`，`deriveAcademicProfile`，`ensureProgressionState`
- 是否可真实接入：`real`
- 风险：GPA、排名、百分比、奖学金、方向解释都是真实规则结果，不能被 UI mock 覆盖；空数据时不能伪造履历条目
- 本轮处理方式：迁移视觉并保留现有数据来源；无数据区域改为统一空状态

## Monthly Journal / 月记

页面 / 功能：
- UI Lab 对应页面：`/app/ui-lab/monthly-journal`
- 当前真实页面位置：`/app/journal/page.tsx`（AI 月记归档）与 `app/settlement/page.tsx`（单月结算页中的 AI 月记）
- 数据来源：`bundle.aiReports` 中的 `monthly_journal`，输入摘要来自 `monthly_states.snapshot_json`
- 是否可真实接入：`real`
- 风险：AI 只能表达，不能决定事实；历史月记必须锚定真实已保存摘要，不能注入 UI Lab 叙事照片或虚构人物
- 本轮处理方式：迁移纸张式视觉到真实月记展示区域；无月记时显示空状态，不生成 mock 月记

## Ending Preview / 结局预览

页面 / 功能：
- UI Lab 对应页面：无直接 UI Lab 对应，但属于 Image2 第二阶段提到的真实能力判定范围
- 当前真实页面位置：`/app/ending/page.tsx`
- 数据来源：`getServerEndingPreview(runId)` -> `evaluateGraduationOutcome(run)`
- 是否可真实接入：`partial`
- 风险：预览存在，但正式结局报告只在四年毕业结算后落地；若把预览包装成已定结局，会误导玩家
- 本轮处理方式：保留真实预览页，明确“预览 / 未落地”状态，不伪造完成态

## Campus Map / 校园地图

页面 / 功能：
- UI Lab 对应页面：仅在 admission 原型导航文案中出现
- 当前真实页面位置：无
- 数据来源：无真实地图、建筑状态或可交互层
- 是否可真实接入：`not_ready`
- 风险：一旦放进正式导航，玩家会误以为已有真实建筑系统
- 本轮处理方式：不进入正式导航，不创建假页面

## Social Circle / 社交圈

页面 / 功能：
- UI Lab 对应页面：仅在 admission 原型导航文案中出现
- 当前真实页面位置：无
- 数据来源：无真实好友列表、关系网、社团图谱
- 是否可真实接入：`not_ready`
- 风险：最容易通过写死好友与关系伪造系统完整度，必须避免
- 本轮处理方式：不进入正式导航，不创建假数据页

## Job Interview / 面试流程

页面 / 功能：
- UI Lab 对应页面：无
- 当前真实页面位置：无独立页面；仅有 `job_prep` 行为与部分就业倾向 / 履历解释
- 数据来源：规则层有就业倾向与求职准备行为，但没有真实面试公司、轮次、结果流程
- 是否可真实接入：`not_ready`
- 风险：伪造公司、面试轮次、反馈最容易越界
- 本轮处理方式：不接入正式页，仅保留现有履历与方向解释

## Offer Selection / Offer 选择

页面 / 功能：
- UI Lab 对应页面：无
- 当前真实页面位置：无
- 数据来源：无真实 offer 列表或 offer 规则结果
- 是否可真实接入：`not_ready`
- 风险：不能用静态公司名或薪资列表冒充系统能力
- 本轮处理方式：不做真实接入

## Grad School Choice / 考研院校选择

页面 / 功能：
- UI Lab 对应页面：无
- 当前真实页面位置：无
- 数据来源：有 `postgraduateProgress` 与方向倾向，但没有真实院校选择链
- 是否可真实接入：`not_ready`
- 风险：容易伪造院校志愿、上岸结果
- 本轮处理方式：不做真实接入，仅保留方向解释

## Civil Service Post Choice / 公考岗位选择

页面 / 功能：
- UI Lab 对应页面：无
- 当前真实页面位置：无
- 数据来源：有 `publicExam.progress` 及说明层，但没有真实岗位池或报考流程
- 是否可真实接入：`not_ready`
- 风险：禁止写死岗位、地区、招录信息
- 本轮处理方式：不做真实接入，仅保留进度说明

## Recommendation Choice / 推免去向选择

页面 / 功能：
- UI Lab 对应页面：无
- 当前真实页面位置：无独立选择页；只有 `recommendationQualification` 评估状态与结局解释
- 数据来源：`progression.recommendationQualification`，相关解释 helper
- 是否可真实接入：`not_ready`
- 风险：当前没有“接受推免 / 转考研 / 转就业”的正式交互与规则闭环
- 本轮处理方式：不增加伪选择器；仅展示已有资格判断与解释

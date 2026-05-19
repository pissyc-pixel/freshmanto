# Final Demo Coverage Matrix

更新日期：2026-05-19
验收基准：`goal/docs/final-demo-goal.md`
状态约定：本文件不再保留 `部分实现`、`MVP 骨架`、`fixture-only`、`未实现` 作为最终状态；需要真实浏览器体感判断的项目单独标为 `需要人工试玩确认`，并列出自动化证据。

## P0 稳定性、存档与长线验证

| 要求 | 最终状态 | 主要实现文件 | 主要测试文件 | 规则链路说明 |
| --- | --- | --- | --- | --- |
| 第 2 月真实页面稳定 | 已完整实现 | `lib/demo/run-service.ts`, `lib/demo/server.ts`, `lib/demo/save-state.ts`, `app/game/page.tsx`, `app/journal/page.tsx`, `app/resume/page.tsx`, `app/ending/page.tsx` | `tests/month-two-real-flow.test.tsx`, `tests/key-month-game-page.test.tsx`, `tests/fm-real-pages.test.tsx` | 测试从真实 run state 推进第 1 月四周结算到第 2 月，再渲染 game / journal / resume / ending；不是单纯 normalize 防崩。 |
| localStorage 保存 / 继续 / 清档 / 载入演示存档 | 已完整实现 | `lib/demo/browser-save.ts`, `components/active-run-sync.tsx`, `components/continue-save-button.tsx`, `app/actions.ts`, `lib/demo/run-service.ts` | `tests/browser-save.test.ts`, `tests/demo-save-presets.test.ts`, `tests/demo-save-deterministic.test.ts` | active id、latest index、完整 normalized snapshot 同步写入；清档同时清 active pointer 与镜像；demo save 载入后仍进入真实 run service。 |
| 旧存档缺字段 normalize | 已完整实现 | `lib/demo/save-state.ts`, `lib/demo/monthly-digest.ts` | `tests/save-state-normalization.test.ts`, `tests/normalize-monthly-summary.test.ts`, `tests/final-demo-rules.test.ts` | final-demo 新字段、履历/证据链/offer/timeline/monthly digest 缺失时自动补齐默认结构。 |
| 两个核心演示存档是真实可继续玩的 run state | 已完整实现 | `lib/demo/presets.ts`, `lib/demo/run-service.ts`, `core/resolvers/progression.ts` | `tests/demo-save-presets.test.ts`, `tests/demo-save-deterministic.test.ts` | M25 前历史可由 deterministic preset 初始化；M25 之后走真实月推进、offer、结局 resolver。 |
| 48 个月 smoke test 验证关键节点 | 已完整实现 | `core/resolvers/progression.ts`, `core/game-engine/monthly.ts`, `lib/demo/run-service.ts` | `tests/long-run-smoke.test.ts` | 覆盖 M4/10/16/22/28/34/40/46 竞赛评奖、M13/25/37 奖学金、M28 考研、M34 推免、M36 考研结果、大四就业 offer、M48 结局。 |
| 关键月份页面渲染覆盖 1/2/13/25/28/34/36/37/46/48 | 已完整实现 | `app/game/page.tsx`, `app/resume/page.tsx`, `app/journal/page.tsx`, `app/ending/page.tsx` | `tests/key-month-game-page.test.tsx`, `tests/key-month-resume-page.test.tsx`, `tests/month-two-real-flow.test.tsx` | game page 已逐月覆盖全部指定月份，resume/正式结果补充关键结果展示。 |

## P1 路线、规则与正式结果

| 要求 | 最终状态 | 主要实现文件 | 主要测试文件 | 规则链路说明 |
| --- | --- | --- | --- | --- |
| 南开商科｜就业路线｜大三上 | 已完整实现 | `lib/demo/presets.ts`, `core/resolvers/progression.ts`, `lib/demo/formal-artifacts.ts`, `app/ending/page.tsx` | `tests/demo-save-presets.test.ts`, `tests/demo-save-deterministic.test.ts` | preset 初始化第 1 学年市奖、商赛二等奖、市场调研项目、大二实习；M25 后真实触发多段实习、大四 offer、接受较好 offer、M48 就业结局与证据链。 |
| 天大工科｜推免路线｜大三上 | 已完整实现 | `lib/demo/presets.ts`, `core/resolvers/progression.ts`, `lib/demo/formal-artifacts.ts`, `app/ending/page.tsx` | `tests/demo-save-presets.test.ts`, `tests/demo-save-deterministic.test.ts` | preset 初始化国家奖学金、市奖、电赛一等奖、工程训练市三等奖、科研助理；M28/M34/M36/M48 走真实后期路径并进入推免结局。 |
| 奖学金线 | 已完整实现 | `core/resolvers/progression.ts`, `lib/demo/formal-artifacts.ts`, `components/formal-artifacts.tsx`, `app/resume/page.tsx`, `app/journal/page.tsx` | `tests/final-demo-rules.test.ts`, `tests/core-rules.test.ts`, `tests/key-month-resume-page.test.tsx`, `tests/formal-artifacts-experience.test.tsx` | 国家 10000 / 市级 6000 / 校级 4000 / 院级 2000；同学年最高项、只入账一次；进入履历、timeline、fact pack、结局证据链，并用正式证书 UI 展示。 |
| 竞赛线 | 已完整实现 | `core/resolvers/progression.ts`, `core/resolvers/schedule.ts`, `core/resolvers/actions.ts`, `core/game-engine/monthly.ts` | `tests/final-demo-rules.test.ts`, `tests/game-view-model.test.ts`, `tests/core-rules.test.ts`, `tests/long-run-smoke.test.ts` | 每学期机会、最多同时 2 个、独立进度、专属行动标签如【电赛】方案设计/【商赛】案例分析；学期末按节点评奖，未达门槛不获奖，结果进入履历/评分/timeline/证据链。 |
| 实习 / Offer 线 | 已完整实现 | `core/resolvers/progression.ts`, `lib/demo/formal-artifacts.ts`, `components/formal-artifacts.tsx`, `app/resume/page.tsx` | `tests/final-demo-rules.test.ts`, `tests/resume-page-offer-actions.test.tsx`, `tests/demo-save-deterministic.test.ts` | 大一职业启蒙、大二第一段实习、大三多段可选实习、大四 0-3 个就业 offer；薪资不进在校现金，offer 可接受/拒绝并进入结局。 |
| 推免 / 考研 / 就业后期路径 | 已完整实现 | `core/resolvers/progression.ts`, `core/resolvers/semester.ts`, `lib/demo/formal-artifacts.ts`, `components/formal-artifacts.tsx` | `tests/final-demo-rules.test.ts`, `tests/recommendation-qualification-window.test.ts`, `tests/demo-save-deterministic.test.ts`, `tests/long-run-smoke.test.ts` | 正常毕业；长期不足才产生风险；M28 开启考研行动但不锁线，M34 推免申请，M36 考研结果；清北/南开天大/985/211/一本/二本层级，推免/考研/就业 offer 均可接受或拒绝。 |
| 结局页 | 已完整实现 | `app/ending/page.tsx`, `core/resolvers/ending.ts`, `lib/demo/formal-artifacts.ts`, `components/formal-artifacts.tsx` | `tests/ending-page.test.ts`, `tests/demo-save-deterministic.test.ts`, `tests/formal-artifacts-experience.test.tsx` | 未毕业时展示预览；M48 展示四年之后封面、毕业状态、人生去向、结果质量、关键证据链、最后一封信和正式结果文档。 |

## P2 表达层、体验层与证据链

| 要求 | 最终状态 | 主要实现文件 | 主要测试文件 | 规则链路说明 |
| --- | --- | --- | --- | --- |
| 月记页是本月来信 / 点击打开的信件式 UI | 已完整实现 | `app/journal/page.tsx`, `app/fm-ui.css` | `tests/journal-page-fallback.test.tsx` | latest report、规则 fallback、归档信件都包在可点击打开的 letter shell 中。 |
| 月记正文像手机备忘录，不裸露后台字段 | 已完整实现 | `core/prompts/monthly-journal.ts`, `lib/demo/monthly-digest.ts`, `app/journal/page.tsx` | `tests/monthly-journal-prompt.test.ts`, `tests/player-facing-narrative.test.ts`, `tests/journal-page-fallback.test.tsx` | prompt 与 fallback 使用 fact pack，页面把 money/stress/mood 转成玩家可读状态词，不展示后台字段名。 |
| 成长时间线记录关键节点 | 已完整实现 | `core/resolvers/progression.ts`, `app/journal/page.tsx`, `app/resume/page.tsx` | `tests/demo-save-presets.test.ts`, `tests/long-run-smoke.test.ts`, `tests/key-month-resume-page.test.tsx` | 竞赛入口/评奖、奖学金、第一段实习、多实习选择、考研开启、推免申请、考研结果、offer、最终结局进入 timeline。 |
| 履历页是成长证据板 | 已完整实现 | `app/resume/page.tsx`, `lib/demo/formal-artifacts.ts` | `tests/key-month-resume-page.test.tsx`, `tests/resume-page-offer-actions.test.tsx` | 展示学业档案、奖学金、竞赛/项目、实习/实践、Offer/录取、路线证据链与温和空状态。 |
| 经济 / 压力 / 心情反馈有账本、预警和结果卡 | 已完整实现 | `core/game-engine/monthly.ts`, `components/action-result-card.tsx`, `components/weekly-settlement-card.tsx`, `app/game/page.tsx` | `tests/core-rules.test.ts`, `tests/metric-risk.test.ts`, `tests/weekly-confirmation-regression.test.ts`, `tests/game-page-experience.test.tsx` | money ledger 区分生活费、奖学金、兼职、向家里要钱、事件收入和支出；余额/压力/心情风险通过 metric、settlement、周初弹窗反馈。 |
| 当月月历提前展示关键 / 机会 / 风险事件 | 已完整实现 | `app/game/page.tsx`, `app/fm-ui.css` | `tests/game-page-experience.test.tsx`, `tests/key-month-game-page.test.tsx` | 本月事件月历分层展示 milestone、机会事件、风险事件和当前项目状态，只预告节点不提前泄露结果。 |
| 经济事件、情绪/压力事件每周开始弹窗 | 已完整实现 | `components/weekly-kickoff-modal.tsx`, `app/game/page.tsx`, `app/fm-ui.css` | `tests/game-page-experience.test.tsx` | 每周开始前按真实 run state 弹出事件/金钱/压力/心情提醒，说明发生了什么、数据变化和本周注意点。 |
| AI 写作基于 FACTS、人性化且不编造结果 | 已完整实现 | `core/prompts/monthly-journal.ts`, `lib/ai/reports.ts`, `lib/demo/monthly-digest.ts`, `core/resolvers/ending.ts` | `tests/monthly-journal-prompt.test.ts`, `tests/ai-report-fallback.test.ts`, `tests/player-facing-narrative.test.ts` | 奖学金、竞赛、实习、offer、录取、毕业结果先由规则层落入 facts，AI 只能改写表达。 |
| 正式结果 UI 像证书 / 通知书 / offer letter / 毕业档案 / 最后一封信 | 已完整实现 | `components/formal-artifacts.tsx`, `lib/demo/formal-artifacts.ts`, `app/resume/page.tsx`, `app/ending/page.tsx`, `app/fm-ui.css` | `tests/key-month-resume-page.test.tsx`, `tests/ending-page.test.ts`, `tests/formal-artifacts-experience.test.tsx` | 奖学金、竞赛、实习、推免、考研、就业 offer、最终结局使用正式文档卡和文档预览。 |
| 重要结果具备等待 → 揭晓 → 被认可 → 回看付出 → 留下纪念 | 需要人工试玩确认 | `components/formal-artifacts.tsx`, `app/ending/page.tsx`, `app/fm-ui.css` | `tests/formal-artifacts-experience.test.tsx`, `tests/ending-page.test.ts` | 自动化确认五段情绪轨道已渲染；真实录屏体感仍需人工判断是否足够有纪念感。 |

## Demo Preset 与真实规则边界

- `lib/demo/presets.ts` 只负责把两个核心演示存档初始化到 M25W1，并写入文档指定的历史履历、奖学金、竞赛、项目、实习和证据。
- M25 之后的多段实习、M28 考研开启、M34 推免申请、M36 考研结果、大四就业 offer、offer 接受/拒绝、M48 结局均通过 `core/resolvers/progression.ts`、`core/game-engine/monthly.ts` 和 `lib/demo/run-service.ts` 推进。
- 结局页和证据链读取 `run.resume`、`timelineNodes`、`endingEvidence`、`futureOffers`、`scholarships`、`competitionProjects`、`internshipRecords`，不在页面层硬编码假结局。

## 最终验证命令

- `cmd.exe /c npx vitest run tests/browser-save.test.ts tests/formal-artifacts-experience.test.tsx tests/game-view-model.test.ts tests/final-demo-rules.test.ts tests/journal-page-fallback.test.tsx tests/game-page-experience.test.tsx tests/month-two-real-flow.test.tsx tests/key-month-game-page.test.tsx --reporter=verbose`
- `cmd.exe /c npm run lint`
- `cmd.exe /c npm run build`
- `cmd.exe /c npm test`
- `cmd.exe /c npx vitest run tests/long-run-smoke.test.ts tests/demo-save-deterministic.test.ts --reporter=verbose`

## 仍需人工试玩确认

- 本月来信打开/关闭在真实浏览器中的手感。
- 周初弹窗是否过于频繁，是否适合演示录屏节奏。
- 正式证书、offer letter、结局报告的视觉冲击是否达到“纪念感”。
- 两个核心 demo save 手动从 M25W1 连续玩到 M48 的完整录屏路径。

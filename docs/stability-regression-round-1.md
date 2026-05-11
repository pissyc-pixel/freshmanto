# Stability Regression Round 1

## 本轮修复摘要

- 修正了周前竞赛说明会事件的错误默认补全：玩家漏选事件日时，不再被系统自动补成“参加说明会”。
- 保留了“玩家主动参加才会激活竞赛项目线”的规则边界，避免隐性接受机会。
- 把周前现金 warning 补成了可执行信息，明确展示当前现金、预计固定开销、缺口和缓解建议。
- 修复了历史 settlement 页的 snapshot-first 风险，奖学金 / 推免 / 公考解释改为优先读取当月 `snapshot_json`。
- 新增一组周确认回归测试和一条历史 settlement snapshot 一致性测试，覆盖本轮最关键的稳定性风险。

## P0 竞赛入口问题的根因

- 根因在 `core/resolvers/weekly-events.ts` 和 `core/game-engine/monthly.ts` 的组合逻辑。
- 竞赛说明会事件实例此前带有 `defaultAttendIfUnplanned: true`。
- 周确认 `confirmPlannedWeek` 在某天没有 `plannedAction` 时，会走自动补全逻辑。
- 旧逻辑会优先构造 `specialAction`，而不是统一补 `idle`，导致漏选也会被当成“参加说明会”。
- 一旦该自动补出的 `specialAction` 被结算接受，就会触发竞赛项目 `active`，形成错误激活。

## 新增测试清单

- `tests/weekly-confirmation-regression.test.ts`
- 覆盖：竞赛入口日漏选不会自动参加说明会。
- 覆盖：竞赛入口日主动参加时，项目可以激活。
- 覆盖：竞赛入口日主动选择普通行动时，项目不会激活并按当前规则过期。
- 覆盖：真实周排程不会被默认补全覆盖，只有漏选日期会补 `idle`。
- 覆盖：月末 `weeklySettlements` 仍会保留，并能进入月记输入摘要。
- 覆盖：低现金状态下，周前 warning 会在玩家决策前出现，并包含现金、开销、缺口和建议。
- `tests/progression-perception.test.ts`
- 覆盖：历史 settlement 的推免 / 奖学金 / 公考解释锚定当月 snapshot，而不是被后续 run 状态污染。

## 剩余风险

- 竞赛入口“漏选后是否应立即关闭项目线”目前沿用现有跳过逻辑，本轮只保证“不会被自动激活”；如果产品要把“漏选”和“主动跳过”区分成不同状态，还需要下一轮单独定规则并补测试。
- `types/game.ts` 里 `defaultAttendIfUnplanned` 字段仍然保留，用于兼容现有事件结构；本轮已经不再在周确认链路中使用它，但后续可以考虑清理类型残留。
- 历史 settlement 页现在已经改为 snapshot-first，但如果未来某些解释需要跨月聚合信息，需要先明确哪些字段允许显式使用 `currentView`，避免再次混入历史污染。

## 下一轮建议

- 先补一条“漏选竞赛入口日是否应该 `expired` 还是保持 `open` 到学期末”的规则测试，把这个边界彻底钉死。
- 给历史 settlement 页再加一条更贴近页面层的 integration test，直接验证旧月份不会显示后续月份才出现的推免资格或公考进度。
- 把周前 warning 文案抽成可复用 helper，并补一条 UI / view-model 层测试，确保前台展示顺序始终发生在玩家确认前。

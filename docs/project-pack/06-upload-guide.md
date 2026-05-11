# 上传到 ChatGPT Project 的建议说明

这份文档是写给项目维护者的，不是写给玩家的。

## 推荐上传顺序

### 第 1 批：先让 AI 快速知道项目是什么

1. `project-context-brief.md`
2. `00-project-overview.md`
3. `02-current-demo-state.md`

这 3 份最适合先传，因为它们能最快建立：

- 项目定位
- 当前阶段
- 已做到哪
- AI 在这个项目里不能越界做什么

### 第 2 批：再给完整产品与规则背景

4. `01-full-prd.md`
5. `04-iteration-history.md`

这两份用于建立：

- 完整设计目标
- 为什么现在会长成这样
- 哪些能力是最近几轮才接上的

### 第 3 批：最后补项目管理资料

6. `03-current-bug-list.md`
7. `05-next-step-roadmap.md`
8. `06-upload-guide.md`

这批更适合做后续长期协作、debug、规划使用。

## 哪些文件最关键

如果你一次不想上传太多，最关键的是：

1. `project-context-brief.md`
2. `00-project-overview.md`
3. `01-full-prd.md`
4. `02-current-demo-state.md`
5. `03-current-bug-list.md`

只要这 5 份在，新的 ChatGPT Project 基本就能较快理解项目边界。

## 哪些文件适合持续更新

最建议长期维护的是：

- `02-current-demo-state.md`
- `03-current-bug-list.md`
- `04-iteration-history.md`
- `05-next-step-roadmap.md`
- `project-context-brief.md`

原因：

- 它们最直接反映“现在是什么状态”
- 比完整 PRD 更常变
- 也最适合在每轮开发后顺手更新

## 如果你还要补截图，优先补哪些

最推荐补 6 类截图：

1. 开局页
   - 让 AI 看见项目一开始让玩家选 / 看什么

2. 游戏主页面
   - 要包含“方向正在形成”的提示区
   - 要包含“安排这一周”的操作区

3. 行动选择弹窗 / 操作面板
   - 让 AI 理解逐天选行动的交互方式

4. 周结算页 / 周结算区
   - 最好能看到逐日结果与本周总变化

5. 月结算 / 成长日志 / 月记页面
   - 让 AI 理解“规则层 -> 表达层”的样子

6. 履历页
   - 要能看到 GPA、排名、比赛、实习、奖学金与方向解释

如果只能补 3 张，优先：

1. 游戏主页面
2. 周结算结果
3. 履历页

## 上传时的小建议

- 文件名尽量保持当前顺序，不要随意改
- 可以把这些文档单独打包成一个“project-pack”上传
- 截图文件名建议也按顺序命名，例如：
  - `screen-01-opening.png`
  - `screen-02-game-main.png`
  - `screen-03-weekly-settlement.png`
  - `screen-04-journal.png`
  - `screen-05-resume.png`

## 给未来自己的提醒

如果后面又经历了几轮大改，至少记得同步更新三份：

- `02-current-demo-state.md`
- `03-current-bug-list.md`
- `04-iteration-history.md`

这三份最容易过时，也最影响 ChatGPT Project 的后续判断质量。

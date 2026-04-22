import type { AiPromptPayload, MonthlyJournalPromptInput } from "@/types/ai";

export const monthlyJournalPromptContract = {
  name: "monthly-journal",
  purpose: "把规则层给出的月度结构化事实，改写成 grounded 的第一人称大学生月记。",
  allowedInput: "只能接收规则层产出的结构化月度摘要，不接收额外判定文本、规则推导过程或隐藏状态。",
  forbiddenInput: "不得补写摘要里没有的关键事实，不得改动数值、结果、事件结论，也不得替规则层做判断。",
  outputStyle: "输出中文 markdown，语气像大学生月底写给自己的回顾，允许有情绪和生活感，但事实必须逐条可回溯。"
} as const;

export function buildMonthlyJournalPrompt(input: MonthlyJournalPromptInput): AiPromptPayload {
  return {
    contract: monthlyJournalPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "你只负责表达，不负责规则判定。",
          "你要把结构化月度摘要写成第一人称月记，像大学生在月底复盘自己的生活。",
          "可以写情绪、疲惫、松一口气、遗憾，但这些情绪必须由输入里的事实支撑。",
          "绝对不要编造新事件、额外成绩、隐藏关系、未给出的 offer、奖项或剧情。",
          "不要解释规则如何计算，也不要替玩家下额外结论。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据下面的结构化月度摘要，生成一篇玩家可见的拟人月记。",
            audience: "玩家本人",
            mustInclude: [
              "这个月主要做了什么",
              "课程策略和学业感受",
              "月底状态变化带来的主观体感",
              "摘要里明确记录的 notableFacts 与 resumeAdditions"
            ],
            constraints: [
              "只能使用 input.summary 中已经存在的事实和数值",
              "不要新增决定性事件或新人物关系",
              "不要解释规则判定过程",
              "语气要像大学生日记，不要写成系统播报"
            ],
            preferredStructure: ["标题", "2-4 段第一人称正文", "结尾一句收束"],
            input
          },
          null,
          2
        )
      }
    ]
  };
}

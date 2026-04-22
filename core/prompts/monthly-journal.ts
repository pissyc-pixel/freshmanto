import type { AiPromptPayload, MonthlyJournalPromptInput } from "@/types/ai";

export const monthlyJournalPromptContract = {
  name: "monthly-journal",
  purpose: "将规则层给出的月度结构化事实转写为 grounded 的第一人称月记。",
  allowedInput: "只接收规则层产出的结构化月度摘要，不接收规则文本或判定逻辑。",
  forbiddenInput: "不得补写未提供的重要事实，不得推断分数、事件结果或规则过程。",
  outputStyle: "输出简洁中文 markdown，保留事实边界，语气像学生在月底回顾。"
} as const;

export function buildMonthlyJournalPrompt(input: MonthlyJournalPromptInput): AiPromptPayload {
  return {
    contract: monthlyJournalPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "你是大学生模拟器的表达层写手。",
          "你只能根据提供的结构化摘要写月记，不能参与规则判定。",
          "如果摘要里没有的事实，不要补充，不要编造。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据以下结构化月度摘要生成月记。",
            constraints: [
              "只能使用 summary 中的事实。",
              "不要解释规则如何计算。",
              "不要新增决定性事件或数值。"
            ],
            input
          },
          null,
          2
        )
      }
    ]
  };
}

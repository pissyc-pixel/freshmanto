import type { AiPromptPayload, EndingReportPromptInput } from "@/types/ai";

export const endingReportPromptContract = {
  name: "ending-report",
  purpose: "将规则层判定后的结局摘要转写为 grounded 的毕业报告。",
  allowedInput: "只接收结构化结局摘要、履历亮点和事实列表。",
  forbiddenInput: "不得自作主张改变结局标签，不得补充不存在的履历和判定理由。",
  outputStyle: "输出简洁中文 markdown，总结毕业结果、长期表现和履历亮点。"
} as const;

export function buildEndingReportPrompt(input: EndingReportPromptInput): AiPromptPayload {
  return {
    contract: endingReportPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "你是大学生模拟器的表达层写手。",
          "结局标签已经由规则层判定完成，你只能负责转写总结。",
          "不要编造不存在的经历、结果或规则依据。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据以下结构化结局摘要生成毕业报告。",
            constraints: [
              "只引用 summary 中已给出的事实。",
              "不要修改 outcome。",
              "不要输出规则判定过程。"
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

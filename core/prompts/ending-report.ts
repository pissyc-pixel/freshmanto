import type { AiPromptPayload, EndingReportPromptInput } from "@/types/ai";

export const endingReportPromptContract = {
  name: "ending-report",
  purpose: "把规则层已经判定完成的毕业结果与结构化事实，改写成 grounded 的毕业回望。",
  allowedInput: "只能接收结构化结局摘要、履历亮点和事实列表。",
  forbiddenInput: "不得改写 outcome，不得补写不存在的履历、成就、去向或判定理由。",
  outputStyle: "输出中文 markdown，像玩家毕业后回头写下的一段总结，允许带情绪，但不能编造关键事实。"
} as const;

export function buildEndingReportPrompt(input: EndingReportPromptInput): AiPromptPayload {
  return {
    contract: endingReportPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "你只负责表达规则层已经确认的毕业结果，不参与判定。",
          "请把输入写成第一人称毕业回望，像一个学生回头看完四年的总结。",
          "可以表达松一口气、遗憾、释然、复杂感，但都必须建立在提供的事实之上。",
          "不要改 outcome，不要发明新的履历亮点，也不要补充规则层没提供的原因链。",
          "不要出现“规则层”“系统判定”“failed-semesters”“risk-flags”这类幕后说法或机器字段。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据下面的结构化结局摘要，生成一篇玩家可见的毕业回望。",
            audience: "玩家本人",
            mustInclude: [
              "最终毕业结果",
              "长期学业表现",
              "履历亮点",
              "已经发生过的重要事实"
            ],
            constraints: [
              "只能引用 input.summary 中已有的事实",
              "不得修改 outcome",
              "不要解释规则判定过程",
              "不要写成系统汇报",
              "如果输入里有机器标记，要翻译成玩家读得懂的自然中文，不要原样照抄"
            ],
            preferredStructure: ["标题", "2-4 段第一人称正文", "一句收束"],
            input
          },
          null,
          2
        )
      }
    ]
  };
}

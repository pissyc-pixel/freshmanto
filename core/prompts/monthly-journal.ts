import { buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import type { AiPromptPayload, MonthlyJournalPromptInput } from "@/types/ai";

export const monthlyJournalPromptContract = {
  name: "monthly-journal",
  purpose: "把规则层已经确认的月度事实改写成更像大学生本人写的月底月记。",
  allowedInput: "只能接收规则层产出的结构化月度摘要和整理后的 digest，AI 不参与规则判定。",
  forbiddenInput: "不得编造新的关键事实，不得修改数值、事件结果或规则结论，也不得直接复读系统字段。",
  outputStyle: "输出中文 markdown，像大学生月底写给自己的回顾，有情绪、有重点，会主动跳过细碎重复。",
} as const;

export function buildMonthlyJournalPrompt(input: MonthlyJournalPromptInput): AiPromptPayload {
  const digest = buildMonthlyDiaryDigest(input.summary, input.year, input.month);

  return {
    contract: monthlyJournalPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "AI 只负责表达，不负责规则判定。",
          "请把输入写成第一人称月记，像大学生在月底复盘自己这个月是怎么过来的。",
          "重点写主线、情绪、体感和最重要的几件事，不要把动作名一条条流水账复述。",
          "还要自然写出角色对未来方向的意识变化，比如越来越像在往推免、考研、考公、就业某条路靠，或者依然没想清楚。",
          "可以有疲惫、松口气、懊恼、期待，但这些感受都必须由输入里的事实支撑。",
          "绝对不要编造新事件、新人物关系、新 offer、新奖项或额外剧情。",
          "不要解释规则如何计算，也不要出现“系统”“规则层”“eventIds”“statsDelta”之类幕后说法。",
          "不要写成系统播报，也不要把代码字段翻译成人话后硬塞进正文。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据下面的结构化月度摘要，生成一篇玩家可见的拟人月记。",
            audience: "玩家本人",
            mustInclude: [
              "这个月主线到底放在了什么上",
              "课程态度和学业线的体感",
              "这个月最明显的情绪变化",
              "未来方向开始往哪里收束，或者为什么还没收束",
              "真正值得记住的几件事",
            ],
            constraints: [
              "只能使用 input.summary 和 digest 中已经存在的事实与数值",
              "不要新增决定性事件或新人物关系",
              "不要把几十个动作名逐条复述",
              "语气像大学生月底写给自己的月记，不要写成系统播报",
            ],
            preferredStructure: ["标题", "2-4 段第一人称正文", "结尾一句收束"],
            digest,
            input,
          },
          null,
          2,
        ),
      },
    ],
  };
}

import { buildMonthlyDiaryDigest } from "@/lib/demo/monthly-digest";
import {
  formatActionType,
  formatAttendanceStrategy,
  formatPlayerFacingFact,
  formatPlayerFacingFlag,
} from "@/lib/demo/options";
import type { AiPromptPayload, MonthlyJournalPromptInput } from "@/types/ai";
import type { ActionType, DynamicStats, StructuredMonthlySummary } from "@/types/game";

export const monthlyJournalPromptContract = {
  name: "monthly-journal",
  purpose: "把规则层已经确认的月度 summary 改写成更像普通大学生本人写的月底月记。",
  allowedInput: "只能接收规则层产出的结构化月度摘要、weekly settlements 和整理后的 digest，AI 不参与规则判定。",
  forbiddenInput:
    "不得编造新的关键事实，不得修改数值、事件结果或规则结论，不得把 summary 里没有的人物、地点、奖项、比赛结果写进去。",
  outputStyle: "输出中文 markdown，像普通大学生月底写给自己的生活记录，克制、有生活感，不写总结报告腔。",
} as const;

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function emptyStats(): DynamicStats {
  return {
    money: 0,
    mood: 0,
    stress: 0,
    fulfillment: 0,
    social: 0,
    semesterAcademics: 0,
  };
}

function summarizeStats(stats?: Partial<DynamicStats>): Record<string, string> {
  const safeStats = {
    ...emptyStats(),
    ...(stats ?? {}),
  };

  return {
    金钱: formatSignedValue(safeStats.money),
    心情: formatSignedValue(safeStats.mood),
    压力: formatSignedValue(safeStats.stress),
    学业: formatSignedValue(safeStats.semesterAcademics),
    社交: formatSignedValue(safeStats.social),
    成就感: formatSignedValue(safeStats.fulfillment),
  };
}

function summarizeActionDistribution(actions?: ActionType[]) {
  const counts = new Map<ActionType, number>();

  for (const action of actions ?? []) {
    counts.set(action, (counts.get(action) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([action, count]) => `${formatActionType(action)} x${count}`);
}

function summarizeWeeklySettlements(summary: StructuredMonthlySummary) {
  return (summary.weeklySettlements ?? []).slice(0, 4).map((settlement) => {
    const activeDays = settlement.dailyResults.filter((day) => !day.resolvedAction.autoFilled).length;
    const autoFilledDays = settlement.dailyResults.filter((day) => day.resolvedAction.autoFilled).length;
    const facts = [
      ...settlement.dailyResults.flatMap((day) => day.notableFacts ?? []),
      ...settlement.dailyResults.flatMap((day) => day.flags ?? []),
      ...(settlement.flags ?? []),
    ];
    const readableFacts = facts
      .map((fact) => {
        const readableFact = formatPlayerFacingFact(fact);
        return readableFact === fact ? formatPlayerFacingFlag(fact) : readableFact;
      })
      .filter((fact) => fact && !fact.includes("daily-living-cost"))
      .slice(0, 4);

    return {
      周次: settlement.week,
      课程态度: formatAttendanceStrategy(settlement.attendanceStrategy),
      主动安排天数: activeDays,
      自动补成摆烂天数: autoFilledDays,
      本周状态变化: summarizeStats(settlement.totals),
      本周收支说明: (settlement.budgetLines ?? []).slice(0, 3),
      本周值得记住: readableFacts,
    };
  });
}

function buildCompactMonthlyJournalInput(input: MonthlyJournalPromptInput) {
  const summary = input.summary;
  const digest = buildMonthlyDiaryDigest(summary, input.year, input.month);

  return {
    当前学年: input.year,
    当前月份: input.month,
    月份标签: digest.monthLabel,
    课程态度: digest.attendanceStrategy,
    每周结算摘要: summarizeWeeklySettlements(summary),
    主要行动分布: summarizeActionDistribution(summary.actions),
    本月关键状态变化: {
      月初: summarizeStats(summary.statsBefore),
      月末: summarizeStats(summary.statsAfter),
      变化: summarizeStats(summary.statsDelta),
    },
    重要事件和履历变化: {
      关键事实: digest.keyMoments,
      履历变化: digest.resumeHighlights,
    },
    当前人生方向倾向: {
      轻量提示: digest.directionSignal,
      后续信号: digest.futureSignals,
    },
  };
}

export function buildMonthlyJournalPrompt(input: MonthlyJournalPromptInput): AiPromptPayload {
  const compactInput = buildCompactMonthlyJournalInput(input);

  return {
    contract: monthlyJournalPromptContract,
    input,
    messages: [
      {
        role: "system",
        content: [
          "AI 只负责表达，不负责规则判定。",
          "请基于提供的 monthly summary 和 digest 来写，不能超出输入事实。",
          "请写成第一人称月记，像普通大学生在月底写给自己的生活记录。",
          "重点写主线、情绪、体感和最重要的几件小事，不要把动作名一条条流水账复述。",
          "允许出现排队、下课、图书馆、宿舍、食堂、犯困、焦虑、松一口气这类生活感细节，但前提是不能编造输入里没有的事实结论。",
          "如果 summary 信息不足，可以明确写“这个月好像没留下太多特别清晰的记忆”，不要硬编大事。",
          "还要自然写出角色对未来方向的意识变化，比如越来越像在往推免、考研、考公、就业某条路靠，或者依然没想清楚。",
          "可以有疲惫、松口气、懊恼、期待，但这些感受都必须由输入里的事实支撑。",
          "绝对不要编造新事件、新人物关系、新 offer、新奖项、新比赛结果或额外剧情。",
          "不要解释规则如何计算，也不要出现“系统”“规则层”“eventIds”“statsDelta”之类幕后说法。",
          "避免总结报告腔、鸡汤腔和宏大抒情，不要写成系统播报。",
          "正文建议 250-500 字，2-4 段，每段不要太长。",
          "每段之间用空行分开，段落不要太长，像给自己写的日记而不是报告。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "根据下面的紧凑月度事实，生成一篇玩家可见的拟人月记。",
            audience: "玩家本人",
            mustInclude: [
              "这个月主线到底放在了什么上",
              "课程态度和学业线的体感",
              "这个月最明显的情绪变化",
              "未来方向开始往哪里收束，或者为什么还没收束",
              "真正值得记住的几件事",
            ],
            constraints: [
              "只能使用下面紧凑事实中已经存在的事实与数值，必须基于 summary",
              "不要新增决定性事件、新人物关系、新地点、新奖项或新结果",
              "不要把几十个动作名逐条复述",
              "语气像大学生月底写给自己的月记，不要写成系统播报或总结报告",
              "如果某周没有主动安排，只能说它被自动补成摆烂 / 发呆，不要编出额外活动",
            ],
            preferredStructure: ["标题（一行）", "正文（2-4 段，第一人称，有生活感）", "结尾一句收束或留白"],
            compactInput,
          },
          null,
          2,
        ),
      },
    ],
  };
}

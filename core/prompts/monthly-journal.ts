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
  purpose: "把规则层已经结算完成的事实，写成一段像大学生夜里记在手机备忘录里的月记。",
  allowedInput: "只能使用当前月份已经发生并确认过的事实，包括周结算、月结算、履历新增和后续方向信号。",
  forbiddenInput: "不得编造未发生的奖学金、竞赛、实习、offer、录取或毕业结果，也不要暴露后台字段、内部 key、turns、resolvedActions 一类结构。",
  outputStyle: "200-300 字，第一人称，自然口语，有具体生活细节，不要写成系统报告。",
} as const;

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

function summarizeStats(stats?: Partial<DynamicStats>) {
  const safe = {
    ...emptyStats(),
    ...(stats ?? {}),
  };

  return {
    现金变化: safe.money,
    心情变化: safe.mood,
    压力变化: safe.stress,
    学业变化: safe.semesterAcademics,
    社交变化: safe.social,
    成就感变化: safe.fulfillment,
  };
}

function summarizeActionDistribution(actions?: ActionType[]) {
  const counts = new Map<ActionType, number>();
  for (const action of actions ?? []) {
    counts.set(action, (counts.get(action) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([action, count]) => `${formatActionType(action)} x${count}`);
}

function summarizeWeeklySettlements(summary: StructuredMonthlySummary) {
  return (summary.weeklySettlements ?? []).slice(0, 4).map((settlement) => {
    const facts = [
      ...settlement.dailyResults.flatMap((day) => day.notableFacts ?? []),
      ...settlement.dailyResults.flatMap((day) => day.flags ?? []),
      ...(settlement.flags ?? []),
    ]
      .map((fact) => {
        const playerFact = formatPlayerFacingFact(fact);
        return playerFact === fact ? formatPlayerFacingFlag(fact) : playerFact;
      })
      .filter((fact) => fact && !fact.includes("daily-living-cost"))
      .slice(0, 3);

    return {
      第几周: settlement.week,
      课程态度: formatAttendanceStrategy(settlement.attendanceStrategy),
      周内事实: facts,
    };
  });
}

function buildCompactMonthlyJournalInput(input: MonthlyJournalPromptInput) {
  const digest = buildMonthlyDiaryDigest(input.summary, input.year, input.month);

  return {
    月份: digest.monthLabel,
    每周结算摘要: summarizeWeeklySettlements(input.summary),
    主要行动分布: summarizeActionDistribution(input.summary.actions),
    月底变化: {
      月初: summarizeStats(input.summary.statsBefore),
      月末: summarizeStats(input.summary.statsAfter),
      本月波动: summarizeStats(input.summary.statsDelta),
    },
    已确认事实: {
      关键片段: digest.keyMoments,
      履历新增: digest.resumeHighlights,
      后续信号: digest.futureSignals,
    },
    方向提示: digest.directionSignal,
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
          "你是一个正在读大学的普通学生，今晚在手机备忘录里写这个月的月记。",
          "必须用第一人称“我”。",
          "整篇文字必须基于 FACTS，只能源于已经结算完成的规则层事实，不得编造任何结果。",
          "不要写成系统播报、后台报告、班主任评语或公众号总结。",
          "不要出现规则层、系统判定、eventIds、statsDelta、moneyDelta、runId、turns、resolvedActions 之类字段。",
          "FACTS 里的余额、心情、压力、学业变化只能转成感受，不要直接写数字和后台字段。",
          "语气可以有停顿、有但是、有一点说不清楚的地方，要像真的人在夜里记一笔。",
          "要有一个具体生活细节，比如宿舍灯、食堂、手机备忘录、桌面、晚风。",
          "结尾留一个没完全放下的问题或感受。",
          "AI 只负责表达，不负责改写结果，也不能编造奖学金、竞赛、实习、offer、录取或毕业结果。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "基于这个月已经结算完成的事实，写成一段 200-300 字的月记。",
            mustInclude: [
              "第一人称",
              "一个具体生活细节",
              "至少一个真实发生过的月内推进",
              "结尾留一点没说完的感觉",
            ],
            mustAvoid: [
              "整体而言",
              "这个月主要",
              "综上",
              "总体来说",
              "月度状态",
              "本月数据如下",
              "余额 1180 / 心情 55 / 压力 63 这种裸数值",
              "project / internship / scholarship / monthly / fallback 这类内部词",
            ],
            compactInput,
          },
          null,
          2,
        ),
      },
    ],
  };
}

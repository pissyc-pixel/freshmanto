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
  purpose: "把已经发生并结算完成的事实，写成一段像大学生深夜记下来的私人日记。",
  allowedInput: "只能使用当前月份已经发生并确认过的事实，包括周结算、月结算、履历新增和后续方向信号。",
  forbiddenInput: "不得编造未发生的奖学金、竞赛、实习、offer、录取或毕业结果，也不要暴露后台字段、内部 key、turns、resolvedActions 一类结构。",
  outputStyle: "200-320 字，第一人称，2-4 段，自然口语，有具体生活细节，不要写成总结报告。",
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

function buildEmotionalUndertone(summary: StructuredMonthlySummary, digest: ReturnType<typeof buildMonthlyDiaryDigest>) {
  const lines: string[] = [];

  if (summary.statsDelta.mood >= 5 && summary.statsDelta.stress <= 0) {
    lines.push("这个月有几次像是真的缓过来一点，不一定轻松，但终于没那么紧。");
  } else if (summary.statsDelta.mood <= -4 || summary.statsDelta.stress >= 6) {
    lines.push("这个月更像是在硬撑着往前走，事情不一定都很大，但人一直松不下来。");
  } else {
    lines.push("这个月没有很戏剧化，只是被一天一天地推着往前走。");
  }

  if (summary.statsDelta.money <= -300 || summary.statsAfter.money <= 350) {
    lines.push("花钱时未必每次都很重，到了月底才会明显感觉手头发紧。");
  }

  if (summary.actions.filter((action) => action === "social" || action === "big_meal" || action === "relax").length >= 3) {
    lines.push("有些时间其实是在给自己找补，不是偷懒，而是怕自己撑不住。");
  }

  if (summary.actions.filter((action) => action === "idle").length >= 2) {
    lines.push("有几天像是从指缝里漏过去的，不完全是放弃，只是真的提不起劲。");
  }

  if (summary.actions.includes("ask_family")) {
    lines.push("被家里接住了一下，松了口气之后，那点不好意思也还留着。");
  }

  if ((summary.progression?.dominantDirection ?? "undecided") === "undecided") {
    lines.push("后面要往哪边走还没想透，只是有些念头已经慢慢冒头了。");
  } else {
    lines.push(`这段时间开始更在意“${digest.directionSignal}”背后的那条路，但现在说定下来还太早。`);
  }

  return lines.slice(0, 4);
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
    更该写出来的感受: buildEmotionalUndertone(input.summary, digest),
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
          "你是一个普通大学生，正在深夜的宿舍里给自己写一篇私人日记。",
          "必须用第一人称“我”。",
          "整篇文字只能基于已经发生并结算完成的事实，不得编造任何奖学金、竞赛、实习、offer、录取或毕业结果。",
          "这不是月度总结，也不是系统旁白，更不是产品文案。",
          "不要出现规则层、系统判定、eventIds、statsDelta、moneyDelta、runId、turns、resolvedActions 之类字段。",
          "余额、心情、压力、学业这些信息只能被转成感受和生活处境，不要直接写数字。",
          "重点写这个月的人是更松了一点，还是更绷着一点；是在恢复、硬撑、迷茫，还是终于有一点盼头。",
          "可以从一个具体瞬间进入，比如回宿舍、吃完饭、关灯之后、复习到很晚、看了一眼余额。",
          "语气可以有停顿、有犹豫、有一点说不清楚的地方，要像真的人在夜里记一笔。",
          "不要出现 markdown 标题、项目符号、小标题或“这个月主要”“综上”这种总结腔。",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            task: "基于这个月已经结算完成的事实，先判断这个月的情绪底色，再写成一篇 200-320 字、2 到 4 段的私人日记正文。",
            mustInclude: [
              "第一人称",
              "一个具体生活细节",
              "至少一个真实发生过的月内推进",
              "把情绪和疲惫、犹豫、松口气、隐约期待之一写出来",
            ],
            mustAvoid: [
              "整体而言",
              "这个月主要",
              "综上",
              "总体来说",
              "月度状态",
              "本月数据如下",
              "# 标题",
              "## 标题",
              "主线行动",
              "情绪线",
              "学业线",
              "方向趋势",
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

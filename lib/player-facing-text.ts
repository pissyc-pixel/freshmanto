const PLAYER_VISIBLE_TEXT_MAP: Record<string, string> = {
  partial: "阶段说明",
  debug: "调试信息",
  "Freshman Orientation": "新生适应活动",
  "Midterm Pressure": "期中压力",
  "Academic Scholarship": "学业奖学金",
  "Teacher Attention": "老师关注",
  "Social Mutual Aid": "同学互助",
  "Economic Pressure": "经济压力",
  "Stress Surge": "压力陡增",
  "Burnout Slump": "状态低谷",
  "Routine Reset": "节奏回拢",
  "Stress Spillover": "压力外溢",
  "Study Group Help": "同学帮忙",
  "Teacher Nudge": "老师提醒",
  "Cash Crunch": "手头吃紧",
  "Received faculty recognition": "得到老师认可",
  "Received an academic scholarship": "拿到一笔学业奖学金",
  "Resume Sprint": "简历打磨",
  "Postgraduate Prep": "深造准备",
  "Public Exam Prep": "公考准备",
  "Competition Project": "项目 / 比赛投入",
  "Campus Activity": "校园活动",
  "run created": "已创建新档",
  "action step resolved": "单次行动已结算",
  "week ended early": "本周已提前结束",
  "weekly attendance selected": "已确定本周课程态度",
  "weekly day planned": "已安排某一天行动",
  "weekly plan confirmed": "已确认本周安排",
  "monthly actions resolved": "本月行动已完成结算",
  "events triggered": "本月事件已触发",
  "monthly settlement saved": "本月结算已存档",
  "semester settlement saved": "学期结算已存档",
  "ending summary saved": "终局摘要已存档",
};

function replaceExactMappedFragments(text: string): string {
  let output = text;

  for (const [raw, translated] of Object.entries(PLAYER_VISIBLE_TEXT_MAP)) {
    output = output.replaceAll(raw, translated);
  }

  return output;
}

function replaceTechnicalFragments(text: string): string {
  return text
    .replace(/daily-living-cost:(\d+)/g, (_, amount: string) => `这一天照常扣掉了 ${amount} 元日常开销`)
    .replace(/eventIds?|runId|statsDelta|eventKey|debug/gi, "")
    .replace(/\bpartial\b/gi, "阶段说明")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function internalEventKeyToChineseLabel(key: string): string {
  return PLAYER_VISIBLE_TEXT_MAP[key] ?? key;
}

export function sanitizePlayerFacingText(text: string): string {
  return replaceTechnicalFragments(replaceExactMappedFragments(text));
}

export function sanitizePlayerFacingTextList(items: string[]): string[] {
  return items
    .map((item) => sanitizePlayerFacingText(item))
    .filter((item) => item.length > 0);
}

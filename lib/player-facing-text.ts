const EXACT_TEXT_MAP: Record<string, string> = {
  partial: "阶段存档",
  debug: "调试记录",
  project: "项目经历",
  internship: "实习经历",
  scholarship: "奖学金",
  competition: "竞赛经历",
  research: "科研经历",
  monthly: "月度记录",
  weekly: "周度记录",
  campus_activity: "校园活动",
  special_experience: "特别经历",
  job_progress: "求职进展",
  employment: "就业路线",
  recommendation: "推免路线",
  postgraduate: "考研路线",
  postgraduate_exam: "考研录取",
  public_exam: "考公路线",
  undecided: "方向未定",
  qingbei: "清北",
  nankai_tianda: "南开 / 天大",
  first_tier: "一本",
  second_tier: "二本",
  tier_1: "一线城市",
  tier_2: "二线城市",
  tier_3: "三线城市",
  excellent: "表现很好",
  good: "结果不错",
  ordinary: "稳稳落地",
  fallback: "",
  accepted: "已接受",
  rejected: "已拒绝",
  pending: "待确认",
  eligible: "已有资格",
  borderline: "还差一点",
  unlikely: "希望不大",
  none: "",
  high: "高等级",
  standard: "常规等级",
  school: "校级",
  provincial: "市级",
  national: "国家级",
  first: "一等奖",
  second: "二等奖",
  third: "三等奖",
  sourceId: "",
  artifactId: "",
  category: "",
  delta: "",
};

const RAW_PHRASE_MAP: Array<[RegExp, string]> = [
  [/market-ops(?:\.|:)?first-entry/gi, "第一次市场运营实习"],
  [/project:market-research:completed/gi, "市场调研项目顺利收尾"],
  [/project:engineering-training:joined/gi, "工程训练综合项目正式推进"],
  [/competition:([^:]+):school-first/gi, "$1校级一等奖"],
  [/competition:([^:]+):school-second/gi, "$1校级二等奖"],
  [/competition:([^:]+):school-third/gi, "$1校级三等奖"],
  [/competition:([^:]+):provincial-first/gi, "$1市级一等奖"],
  [/competition:([^:]+):provincial-second/gi, "$1市级二等奖"],
  [/competition:([^:]+):provincial-third/gi, "$1市级三等奖"],
  [/competition:([^:]+):unfinished/gi, "$1还在推进中"],
  [/scholarship:high:(\d+)/gi, "这一学年拿到了高等级奖学金"],
  [/scholarship:standard:(\d+)/gi, "这一学年拿到了奖学金"],
  [/milestone:postgraduate-open:28/gi, "第 28 月正式打开考研行动"],
  [/milestone:recommendation-apply:34/gi, "第 34 月正式递交推免申请"],
  [/milestone:postgraduate-result:36/gi, "第 36 月等来了考研结果"],
  [/milestone:employment-offer:(\d+)/gi, "大四阶段收到了就业 offer"],
  [/recommendation:accepted/gi, "推免结果已确认"],
  [/recommendation:eligible/gi, "推免资格已经够到线"],
  [/recommendation:borderline/gi, "推免资格还在边缘"],
  [/recommendation:unlikely/gi, "推免机会不太稳"],
];

const INTERNAL_MARKER_PATTERNS = [
  /\b(eventIds?|runId|statsDelta|moneyDelta|sourceId|artifactId|category|delta|fallback)\b/gi,
  /\b(project|internship|scholarship|monthly|weekly|competition|research|job_progress|campus_activity|special_experience)\b/gi,
];

function replaceMappedWords(text: string) {
  let output = text;
  for (const [raw, translated] of Object.entries(EXACT_TEXT_MAP)) {
    output = output.replace(new RegExp(`\\b${raw}\\b`, "gi"), translated);
  }
  return output;
}

function replaceRawPhrases(text: string) {
  return RAW_PHRASE_MAP.reduce((output, [pattern, replacement]) => output.replace(pattern, replacement), text);
}

function replaceNumericStatus(text: string) {
  return text
    .replace(/余额\s*\d+/gi, "手头有点紧")
    .replace(/手头余额\s*\d+\s*元?/gi, "手头有点紧")
    .replace(/心情\s*[+-]?\d+/gi, "心里有点乱")
    .replace(/压力\s*[+-]?\d+/gi, "压力一直绷着")
    .replace(/学业\s*[+-]?\d+/gi, "课业这边还有起伏")
    .replace(/钱\s*[+-]?\d+/gi, "钱这边得省着点")
    .replace(/社交\s*[+-]?\d+/gi, "和人来往这边也有变化")
    .replace(/成就感\s*[+-]?\d+/gi, "至少有一件事没白忙")
    .replace(/月底状态[:：]?/gi, "")
    .replace(/本月数据如下[:：]?/gi, "")
    .replace(/月度状态[:：]?/gi, "")
    .replace(/整体而言|这个月主要|综上|总体来说/gi, "");
}

function replaceMonthMarkers(text: string) {
  return text
    .replace(/\bM(\d{1,2})\b/g, (_, month: string) => `第 ${month} 月`)
    .replace(/\b(\d{4})-(\d{1,2})\b/g, (_, year: string, month: string) => `第 ${year} 年第 ${month} 月`);
}

function stripInternalMarkers(text: string) {
  return INTERNAL_MARKER_PATTERNS.reduce((output, pattern) => output.replace(pattern, ""), text);
}

function collapseWhitespace(text: string) {
  return text
    .replace(/[|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[：:]\s*[，。；、]/g, "：")
    .replace(/[，、]{2,}/g, "，")
    .replace(/[。]{2,}/g, "。")
    .trim();
}

export function formatPlayerFacingMonthIndex(monthIndex: number) {
  return `第 ${Math.max(1, monthIndex)} 月`;
}

export function formatTimelineKindLabel(kind: string) {
  const normalized = sanitizePlayerFacingText(kind);
  if (normalized && normalized !== kind) return normalized;

  switch (kind) {
    case "competition_entry":
      return "竞赛开启";
    case "competition_award":
      return "竞赛评奖";
    case "scholarship":
      return "奖学金";
    case "internship":
      return "实习经历";
    case "internship_choice":
      return "实习选择";
    case "postgraduate_open":
      return "考研开启";
    case "recommendation_apply":
      return "推免申请";
    case "postgraduate_result":
      return "考研结果";
    case "offer":
      return "Offer / 录取";
    case "final_choice":
      return "最终去向";
    case "ending":
      return "最终结局";
    case "warning":
      return "提醒";
    case "monthly":
      return "月度记录";
    default:
      return "";
  }
}

export function sanitizePlayerFacingText(text: string) {
  return collapseWhitespace(
    stripInternalMarkers(
      replaceMonthMarkers(
        replaceNumericStatus(
          replaceMappedWords(
            replaceRawPhrases(
              text.replace(/daily-living-cost:(\d+)/gi, (_, amount: string) => `这一天照常花掉了 ${amount} 元生活费`),
            ),
          ),
        ),
      ),
    ),
  );
}

export function sanitizePlayerFacingTextList(items: string[]) {
  return items
    .map((item) => sanitizePlayerFacingText(item))
    .filter((item) => item.length > 0);
}

export function internalEventKeyToChineseLabel(key: string) {
  const label = sanitizePlayerFacingText(key);
  return label || "阶段记录";
}

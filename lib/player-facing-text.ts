const EXACT_TEXT_MAP: Record<string, string> = {
  partial: "阶段存档",
  debug: "调试记录",
  project: "项目经历",
  internship: "实习经历",
  scholarship: "奖学金",
  competition: "竞赛经历",
  research: "科研经历",
  monthly: "月度记录",
  weekly: "周记录",
  campus_activity: "校园活动",
  special_experience: "特别经历",
  job_progress: "求职进展",
  employment: "就业方向",
  recommendation: "推免方向",
  postgraduate: "考研方向",
  postgraduate_exam: "考研方向",
  public_exam: "考公方向",
  offer: "录用通知 / 录取通知",
  undecided: "方向未定",
  qingbei: "清北层级",
  nankai_tianda: "南开 / 天大层级",
  first_tier: "一本层级",
  second_tier: "二本层级",
  tier_1: "一线城市",
  tier_2: "二线城市",
  tier_3: "三线城市",
  excellent: "很亮眼",
  good: "较好",
  ordinary: "比较稳",
  fallback: "",
  accepted: "已确认",
  rejected: "已放下",
  pending: "待确认",
  eligible: "资格成立",
  borderline: "还差一点",
  unlikely: "希望不大",
  none: "",
  high: "较高",
  medium: "中等",
  low: "偏低",
  standard: "常规",
  school: "校级",
  provincial: "省级",
  national: "国家级",
  first: "一等奖",
  second: "二等奖",
  third: "三等奖",
  sourceId: "",
  artifactId: "",
  category: "",
  delta: "",
  quality: "",
  salaryLevel: "",
};

const RAW_PHRASE_MAP: Array<[RegExp, string]> = [
  [/market-ops(?:\.|:)?first-entry/gi, "本地消费品公司市场运营助理"],
  [/project:market-research:completed/gi, "市场调研项目顺利收尾"],
  [/project:engineering-training:joined/gi, "工程训练综合项目正式推进"],
  [/competition:([^:]+):school-first/gi, "$1校级一等奖"],
  [/competition:([^:]+):school-second/gi, "$1校级二等奖"],
  [/competition:([^:]+):school-third/gi, "$1校级三等奖"],
  [/competition:([^:]+):provincial-first/gi, "$1省级一等奖"],
  [/competition:([^:]+):provincial-second/gi, "$1省级二等奖"],
  [/competition:([^:]+):provincial-third/gi, "$1省级三等奖"],
  [/competition:([^:]+):unfinished/gi, "$1还在推进中"],
  [/scholarship:high:(\d+)/gi, "这一学年拿到了高等级奖学金"],
  [/scholarship:standard:(\d+)/gi, "这一学年拿到了奖学金"],
  [/milestone:postgraduate-open:28/gi, "第 28 月正式打开考研准备"],
  [/milestone:recommendation-apply:34/gi, "第 34 月正式递交推免申请"],
  [/milestone:postgraduate-result:36/gi, "第 36 月等来了考研结果"],
  [/milestone:employment-offer:(\d+)/gi, "大四阶段收到了就业录用通知"],
  [/recommendation:accepted/gi, "推免结果已确认"],
  [/recommendation:eligible/gi, "推免资格已经够到线"],
  [/recommendation:borderline/gi, "推免资格还在边缘"],
  [/recommendation:unlikely/gi, "推免机会不太稳"],
];

const INTERNAL_MARKER_PATTERNS = [
  /\b(eventIds?|runId|statsDelta|moneyDelta|sourceId|artifactId|category|delta|fallback)\b/gi,
  /\b(project|internship|scholarship|monthly|weekly|competition|research|job_progress|campus_activity|special_experience)\b/gi,
  /\b(quality|salaryLevel|academic|stress|mood)\b/gi,
];

function clampPlayerFacingMonthIndex(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(Math.round(value), 48));
}

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

function replaceRankFragments(text: string) {
  return text.replace(/前\s*(\d+)\s*-\s*(\d+)%/g, (_, __rank: string, percentile: string) => {
    return `排名约前 ${percentile}%`;
  });
}

function replaceNumericStatus(text: string) {
  return text
    .replace(/余额\s*\d+/gi, "手头有点紧")
    .replace(/手头余额\s*\d+\s*元/gi, "手头有点紧")
    .replace(/心情\s*[+-]?\d+/gi, "心里有点乱")
    .replace(/压力\s*[+-]?\d+/gi, "压力一直绷着")
    .replace(/学业\s*[+-]?\d+/gi, "课业这边还有起伏")
    .replace(/金钱\s*[+-]?\d+/gi, "花钱得更省着点")
    .replace(/社交\s*[+-]?\d+/gi, "和人的距离也在慢慢变化")
    .replace(/成就感\s*[+-]?\d+/gi, "至少有一件事没有白忙")
    .replace(/月度状态[:：]?/gi, "")
    .replace(/本月数据如下[:：]?/gi, "")
    .replace(/整体而言|这个月主要|综上|总体来说/gi, "");
}

function replaceMonthMarkers(text: string) {
  return text
    .replace(/\bM(\d{1,5})\b/g, (_, month: string) => `第 ${clampPlayerFacingMonthIndex(Number(month))} 月`)
    .replace(/\b(\d{4})-(\d{1,2})\b/g, (_, year: string, month: string) => {
      const monthIndex = clampPlayerFacingMonthIndex((Number(year) - 1) * 12 + Number(month));
      return `第 ${monthIndex} 月`;
    });
}

function stripInternalMarkers(text: string) {
  return INTERNAL_MARKER_PATTERNS.reduce((output, pattern) => output.replace(pattern, ""), text);
}

function collapseWhitespace(text: string) {
  return text
    .replace(/[|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[：:]\s*[，。；、]/g, "：")
    .replace(/[，。]{2,}/g, "。")
    .trim();
}

export function formatPlayerFacingMonthIndex(monthIndex: number) {
  return `第 ${clampPlayerFacingMonthIndex(monthIndex)} 月`;
}

export function formatTimelineKindLabel(kind: string) {
  const normalized = sanitizePlayerFacingText(kind);
  if (normalized && normalized !== kind) {
    return normalized;
  }

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
      return "录用通知 / 录取通知";
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
          replaceRankFragments(
            replaceMappedWords(
              replaceRawPhrases(
                text.replace(/daily-living-cost:(\d+)/gi, (_, amount: string) => `那天照常花掉了 ${amount} 元生活费`),
              ),
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

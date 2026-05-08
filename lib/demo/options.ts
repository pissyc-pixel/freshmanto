import type {
  ActionTime,
  ActionTurnSummary,
  ActionType,
  CityTier,
  CollegeTrack,
  CourseAttendanceStrategy,
  DynamicStats,
  FamilyBackground,
  GraduationOutcome,
  SchoolTier,
  SemesterFeedback,
  StructuredMonthlySummary,
  Talent,
  TimeBlockKind,
  WeeklyDayType,
  Weekday,
} from "@/types/game";

export const attendanceStrategyOptions: Array<{
  value: CourseAttendanceStrategy;
  label: string;
  description: string;
}> = [
  { value: "serious", label: "认真上课", description: "课堂收益最稳，但留给自己的缓冲最少。" },
  { value: "mixed", label: "正常混课", description: "兼顾课程和生活，适合作为默认策略。" },
  { value: "phone", label: "上课刷手机", description: "算出勤，但会错过课堂信息，学业隐患会变多。" },
];

export const actionOptions: Array<{
  value: ActionType;
  label: string;
  description: string;
}> = [
  { value: "study", label: "复习 / 学习", description: "稳步推进学业，但收益不再无限叠高。" },
  { value: "job_prep", label: "实习 / 求职准备", description: "为履历铺路，会消耗一些金钱和精力。" },
  { value: "part_time", label: "兼职 / 赚钱", description: "补充现金流，但不能安排在夜间。" },
  { value: "social", label: "社交 / 关系", description: "花点钱换心情和人脉，后面可能派上用场。" },
  { value: "relax", label: "娱乐 / 放松", description: "快速降压，但通常也要花钱。" },
  { value: "idle", label: "\u6446\u70c2 / \u53d1\u5446", description: "\u6ca1\u6709\u7279\u610f\u5b89\u6392\u7684\u4e00\u5929\uff0c\u7167\u5e38\u628a\u65e5\u5b50\u6df7\u8fc7\u53bb\u3002" },
  { value: "big_meal", label: "吃大餐", description: "即时消费，不推进周历，花钱换心情和喘息感。" },
  { value: "student_activity", label: "学生活动 / 讲座 / 社团", description: "更有生活感，也有机会留下履历痕迹。" },
  { value: "remedy", label: "补救 / 应急处理", description: "优先止损，把已经堆起来的风险往回拉。" },
  { value: "ask_family", label: "向家里要钱", description: "来钱快，但会带来明显压力，而且有冷却。" },
  { value: "skip_class", label: "这周不去上课", description: "腾出这周被白天课程锁住的行动位，但后续点名和平时分风险会提高。" },
];

export const actionTimeOptions: Array<{
  value: ActionTime;
  label: string;
}> = [
  { value: "day", label: "白天" },
  { value: "night", label: "夜间" },
];

const talentLabels: Record<Talent, string> = {
  "self-disciplined": "自律",
  "quick-learner": "上手快",
  "social-butterfly": "社交达人",
  "stress-resistant": "抗压",
  resourceful: "会找资源",
};

const familyLabels: Record<FamilyBackground, string> = {
  struggling: "家里拮据",
  ordinary: "普通家庭",
  stable: "家庭稳定",
  "well-connected": "家里有人脉",
  affluent: "家境优渥",
};

const trackLabels: Record<CollegeTrack, string> = {
  arts: "文科",
  science: "理科",
  engineering: "工科",
  business: "商科",
  medicine: "医学",
};

const schoolTierLabels: Record<SchoolTier, string> = {
  qingbei: "清北",
  nankai_tianda: "南开 / 天大",
  "985": "985",
  "211": "211",
  first_tier: "一本",
  second_tier: "二本",
};

const cityTierLabels: Record<CityTier, string> = {
  tier_1: "一线城市",
  tier_2: "二线城市",
  tier_3: "三线城市",
};

const outcomeLabels: Record<GraduationOutcome, string> = {
  graduate: "正常毕业",
  delayed: "延毕",
  cannot_graduate: "无法正常毕业",
  drop_out: "肄业",
};

const feedbackLabels: Record<SemesterFeedback, string> = {
  excellent: "优异",
  stable: "稳定",
  strained: "吃力",
  warning: "预警",
  critical: "高危",
};

const timeBlockLabels: Record<TimeBlockKind, string> = {
  free: "全天都能自己安排",
  half_free: "只有半天空档",
  busy_day: "\u767d\u5929\u6ee1\u8bfe",
};

const weeklyDayTypeLabels: Record<WeeklyDayType, string> = {
  night_only: "\u767d\u5929\u6ee1\u8bfe\uff0c\u9ed8\u8ba4\u53ea\u6709\u591c\u91cc\u53ef\u4ee5\u5b89\u6392",
  half_day: "这天只有半天空档",
  full_day: "这天基本能自己支配",
};

const statLabels: Record<keyof DynamicStats, string> = {
  money: "金钱",
  mood: "心情",
  stress: "压力",
  fulfillment: "成就感",
  social: "社交",
  semesterAcademics: "当学期学业值",
};

const systemLogTypeLabels = {
  action: "行动留档",
  event: "事件留档",
  settlement: "结算留档",
} as const;

const weekdayClassDayLabels: Record<Weekday, string> = {
  mon: "周一白天",
  tue: "周二白天",
  wed: "周三白天",
  thu: "周四白天",
  fri: "周五白天",
  sat: "周六白天",
  sun: "周日白天",
} as const;

const rejectionReasonLabels: Record<string, string> = {
  "invalid-night-part-time": "夜里没法去做兼职，只能作罢",
  "ask-family-on-cooldown": "这个月还没过冷却，再开口会更别扭",
  "state-refused-study": "状态太差了，根本坐不下来学习",
  "state-refused-work": "状态扛不住，连工作和投递都提不起劲",
  "turn-resolution-missing": "这一步没有被完整结算出来",
  "insufficient-week-time": "这周剩下的可用时间不够，这一步只能先放下。",
};

const flagLabels: Record<string, string> = {
  "study-diminishing-returns": "这段时间连续学习太多，边际收益已经明显往下掉了。",
  "stress-efficiency-penalty": "压力和心情在拖后腿，这个月很多行动都没有平时顺手。",
  "study-efficiency-collapsed": "压力和状态已经把学习效率压得很低了，这一步几乎没真正学进去。",
  "ask-family-on-cooldown": "刚向家里开过口，这个月再伸手只会更有压力。",
  "invalid-night-part-time": "想靠夜里兼职补钱行不通，时间窗口不允许。",
  "midterm-pressure": "之前积下来的学业风险在这个月集中冒头了。",
  "economic-pressure": "手头太紧，经济压力已经开始明显影响状态。",
  "stress-surge": "这个月压力明显冲了上来，睡眠、耐心和执行力都被磨掉了一层。",
  "burnout-slump": "压力和低落堆在一起，整个人都有点摆烂下去的趋势。",
  "state-refused-study": "有时候不是不想努力，是状态已经差到学不进去。",
  "state-refused-work": "这阵子连找工作和赚钱的心气都被压住了。",
  "instant-event:cash-crunch": "手头太紧，刚做完这一步就更明显地感到钱带来的分心和压力。",
  "instant-event:stress-spillover": "压力已经溢出来了，连正常行动都会额外消耗一点心气。",
  "instant-event:study-group-help": "身边同学顺手拉了一把，资料和节奏都被接上了一点。",
  "instant-event:teacher-nudge": "前面攒下的学习势头被老师看见了，这次得到了一点及时提醒和肯定。",
  "insufficient-week-time": "这周剩下的可用时间不够，这一步只能先放下。",
};

const eventNarratives: Record<string, string> = {
  "monthly-living-expense": "房租、吃饭和日常花销照常扣掉，生活成本不会因为你忙就消失。",
  "freshman-orientation": "开学适应和破冰活动让你没那么像局外人了。",
  "midterm-pressure": "之前遗漏的课程信息和学业风险，在这个月一起压了上来。",
  "academic-scholarship": "连续几个月把状态稳住之后，终于换来了一点奖学金和认可。",
  "teacher-attention": "连续用功被老师看见了，一点提点和肯定让接下来的路更清楚了。",
  "social-mutual-aid": "社交值高的时候，身边的人真的会在签到和资料上拉你一把。",
  "economic-pressure": "钱一紧，焦虑感就会从生活边角慢慢渗进来。",
  "stress-surge": "这个月压力突然抬了上来，人变得更容易疲劳、烦躁和拖延。",
  "burnout-slump": "心情和压力一起失控的时候，人会先开始不想面对任何事。",
  "monthly-routine-reset": "这个月没有特别戏剧的转折，但日子还是推着你把节奏重新捋了一遍。",
  "stress-spillover": "压力已经溢出来了，做完这一步之后反而又多了一点疲惫和烦躁。",
  "study-group-help": "之前攒下的人际关系在这一步派上了用场，有人帮你把资料和节奏接了回来。",
  "teacher-nudge": "学习势头被老师注意到了，一句提醒或者肯定让你更知道接下来往哪儿用力。",
  "cash-crunch": "手头太紧让这一步变得更费劲，钱的压力又从旁边挤了进来。",
};

export type PlayerFacingMonthlyLog = {
  badge: string;
  periodLabel: string;
  title: string;
  message: string;
  details: string[];
};

function uniqueStrings(items: Array<string | undefined | null>): string[] {
  return [...new Set(items.filter((item): item is string => Boolean(item && item.trim())))];
}

function formatSignedValue(value: number, suffix = ""): string {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

function formatWeekLabel(week: number): string {
  return `第${week}周`;
}

function mapWeekdaysToClassDays(days: Weekday[]): string {
  return days.map((day) => weekdayClassDayLabels[day]).join("、");
}

function formatClassDayList(rawDays: string): string {
  const weekdays = rawDays
    .split(",")
    .map((day) => day.trim())
    .filter((day): day is Weekday => day in weekdayClassDayLabels);

  return mapWeekdaysToClassDays(weekdays);
}

function describeRejectionReason(reason?: string): string {
  if (!reason) {
    return "这一步没能顺利做成";
  }

  return rejectionReasonLabels[reason] ?? `这一步被规则判定为未生效（${reason}）`;
}

function describeTurnImpact(turn: ActionTurnSummary): string | undefined {
  const parts: string[] = [];

  if (turn.statsDelta.money !== 0) {
    parts.push(`钱 ${formatSignedValue(turn.statsDelta.money)} 元`);
  }
  if (turn.statsDelta.mood !== 0) {
    parts.push(`心情 ${formatSignedValue(turn.statsDelta.mood)}`);
  }
  if (turn.statsDelta.stress !== 0) {
    parts.push(`压力 ${formatSignedValue(turn.statsDelta.stress)}`);
  }
  if (turn.statsDelta.semesterAcademics !== 0) {
    parts.push(`学业值 ${formatSignedValue(turn.statsDelta.semesterAcademics)}`);
  }
  if (turn.statsDelta.social !== 0) {
    parts.push(`社交 ${formatSignedValue(turn.statsDelta.social)}`);
  }
  if (turn.statsDelta.fulfillment !== 0) {
    parts.push(`成就感 ${formatSignedValue(turn.statsDelta.fulfillment)}`);
  }

  return parts.length > 0 ? `这一轮下来${parts.join("，")}。` : undefined;
}

function describeTurn(turn: ActionTurnSummary): string {
  const weekLabel = formatWeekLabel(turn.week);
  const attendance = formatAttendanceStrategy(turn.attendanceStrategy);
  const chosenAction = formatActionType(turn.chosenAction.action);
  const resolvedAction = formatActionType(turn.resolvedAction.action);
  const actionSentence = turn.advancesCalendar
    ? turn.resolvedAction.accepted
      ? `${weekLabel}我把行动放在“${resolvedAction}”上，课程这边走的是“${attendance}”。`
      : `${weekLabel}我原本想做“${chosenAction}”，但最后没做成，${describeRejectionReason(turn.resolvedAction.reason)}。课程这边走的是“${attendance}”。`
    : turn.resolvedAction.accepted
      ? `${weekLabel}我临时去做了“${resolvedAction}”，想先把这一口气缓回来。`
      : `${weekLabel}我原本想临时做“${chosenAction}”，但最后没成，${describeRejectionReason(turn.resolvedAction.reason)}。`;
  const impact = describeTurnImpact(turn);
  const calendarNote = turn.advancesCalendar ? undefined : "这次属于即时消费，没有额外推进周历。";

  return uniqueStrings([actionSentence, impact, calendarNote]).join(" ");
}

function describeEvent(eventId: string): string | undefined {
  return eventNarratives[eventId];
}

function describeNotableFact(fact: string): string | undefined {
  if (fact.startsWith("allowance:")) {
    const amount = Number(fact.split(":")[1] ?? 0);
    return `这个月生活费到账 ${amount} 元，至少先把手头周转了一下。`;
  }

  if (fact.startsWith("roll-call-risk:")) {
    return "翘课和混课留下了点名风险，后面还得提防突然翻车。";
  }

  if (fact.startsWith("usual-score-risk:")) {
    return "平时分风险还在往上堆，拖久了会更难补。";
  }

  if (fact.startsWith("proxy-cost:")) {
    const amount = Number(fact.split(":")[1] ?? 0);
    return `为了代签到或代课，又额外花掉了 ${amount} 元。`;
  }

  if (fact.startsWith("remedy-pressure:")) {
    return "眼下虽然糊过去了，但后续补救还得继续花精力。";
  }

  if (fact.startsWith("event:monthly-living-expense:")) {
    const amount = Number(fact.split(":").at(-1) ?? 0);
    return `房租、吃饭和日常开销一共扣掉了 ${amount} 元固定生活成本。`;
  }

  if (fact === "auto-filled-idle") {
    return "\u8fd9\u4e00\u5929\u6ca1\u6709\u624b\u52a8\u5b89\u6392\uff0c\u7cfb\u7edf\u81ea\u52a8\u8865\u6210\u4e86\u201c\u6446\u70c2 / \u53d1\u5446\u201d\u3002";
  }

  if (fact.startsWith("skip_class released ")) {
    const rawDays = fact
      .replace("skip_class released ", "")
      .replace(" daytime blocks", "");
    const classDays = formatClassDayList(rawDays);

    return classDays.length > 0 ? `这周已经腾出来的白天：${classDays}。` : "这周临时腾出了一部分白天时间。";
  }

  if (fact.startsWith("event:")) {
    return describeEvent(fact.replace("event:", ""));
  }

  return fact;
}

function describeFlag(flag: string): string | undefined {
  return flagLabels[flag];
}

function describeEndingNotableFact(fact: string): string {
  if (fact.startsWith("failed-semesters:")) {
    const count = Number(fact.split(":")[1] ?? 0);
    return `累计未通过学期数：${count}。`;
  }

  if (fact.startsWith("risk-flags:")) {
    const count = Number(fact.split(":")[1] ?? 0);
    return `长期风险标签累计 ${count} 个。`;
  }

  return fact;
}

function buildMoodSentence(summary: StructuredMonthlySummary): string {
  if (summary.eventIds.includes("academic-scholarship")) {
    return "前段时间没白熬，终于从结果上感受到一点被肯定的回响。";
  }

  if (summary.statsDelta.stress >= 8) {
    return "这个月明显像在赶路，很多时候不是从容安排，而是硬着头皮往前顶。";
  }

  if (summary.statsDelta.mood >= 8 || summary.statsDelta.fulfillment >= 8) {
    return "虽然也忙，但月底回头看，还是会觉得自己没白折腾。";
  }

  if (summary.flags.includes("burnout-slump") || summary.flags.includes("state-refused-study")) {
    return "状态波动比想象中大，有些事情不是不想做，而是真的提不起劲。";
  }

  return "它不算戏剧化，但每一步都很像大学生活会留下来的那种细碎痕迹。";
}

function buildMonthlyTitle(summary: StructuredMonthlySummary): string {
  if (summary.eventIds.includes("academic-scholarship")) {
    return "这个月终于尝到一点被回报的感觉";
  }

  if (summary.flags.includes("economic-pressure")) {
    return "这个月最明显的感受，是钱真的会把日子压得很窄";
  }

  if (summary.statsDelta.stress >= 8) {
    return "这个月过得有点赶，也有点硬撑";
  }

  if (summary.resumeAdditions.length > 0) {
    return "这个月不只是忙，多少还留下了点能写进履历的东西";
  }

  return "这个月我还在学业、生活和情绪之间找平衡";
}

function buildDetailLines(summary: StructuredMonthlySummary): string[] {
  const turnLines = (summary.turns ?? []).map(describeTurn);
  const eventLines = (summary.eventIds ?? []).map(describeEvent);
  const factLines = (summary.notableFacts ?? []).map(describeNotableFact);
  const flagLines = (summary.flags ?? []).map(describeFlag);
  const resumeLines = (summary.resumeAdditions ?? []).map((item) => `履历新增了“${item.title}”。`);

  return uniqueStrings([
    ...turnLines,
    ...eventLines,
    ...factLines,
    ...flagLines,
    ...resumeLines,
  ]);
}

export function formatTalent(value: Talent): string {
  return talentLabels[value];
}

export function formatFamilyBackground(value: FamilyBackground): string {
  return familyLabels[value];
}

export function formatCollegeTrack(value: CollegeTrack): string {
  return trackLabels[value];
}

export function formatSchoolTier(value: SchoolTier): string {
  return schoolTierLabels[value];
}

export function formatCityTier(value: CityTier): string {
  return cityTierLabels[value];
}

export function formatActionType(value: ActionType): string {
  if (value === "postgraduate_prep") {
    return "考研 / 深造准备";
  }

  if (value === "public_exam_prep") {
    return "公考准备";
  }

  if (value === "competition_project") {
    return "比赛 / 长期项目投入";
  }

  return actionOptions.find((item) => item.value === value)?.label ?? value;
}

export function formatAttendanceStrategy(value: CourseAttendanceStrategy): string {
  return attendanceStrategyOptions.find((item) => item.value === value)?.label ?? value;
}

export function formatSemesterFeedback(value: SemesterFeedback): string {
  return feedbackLabels[value];
}

export function formatGraduationOutcome(value: GraduationOutcome): string {
  return outcomeLabels[value];
}

export function formatTimeBlockKind(value: TimeBlockKind): string {
  return timeBlockLabels[value];
}

export function formatWeeklyDayType(value: WeeklyDayType): string {
  return weeklyDayTypeLabels[value];
}

export function formatPlannerReason(reason?: string): string {
  if (!reason) {
    return "这一步最后没做成。";
  }

  if (reason === "action-daytype-mismatch") {
    return "这一步和当天能用的时间类型对不上，所以最后没真正排进去。";
  }

  return formatPlayerFacingFlag(reason);
}

export function formatWeeklyEventFact(fact: string): string {
  switch (fact) {
    case "weekly-event:guest-lecture":
      return "这周临时冒出来一场讲座，至少把日子从单纯赶课里拉开了一点。";
    case "weekly-event:recruitment-talk":
      return "这周去听了场宣讲，虽然还谈不上结果，但方向感比之前清楚了一点。";
    case "weekly-event:job-prep-boost":
      return "宣讲带来的信息马上接到了求职准备这条线上，做事时没那么发虚了。";
    case "weekly-event:class-meeting":
      return "这周有一天被班会和通知切了一刀，节奏不算舒服，但至少先把它处理掉了。";
    case "weekly-event:quiet-recovery":
      return "这周没什么额外插曲，反而让那点休息真的缓回来了一点。";
    default:
      return formatPlayerFacingFact(fact);
  }
}

export function formatReleasedClassDayList(days: Weekday[]): string {
  return mapWeekdaysToClassDays(days);
}

export function formatStatLabel(key: keyof DynamicStats): string {
  return statLabels[key];
}

export function formatMonthLabel(year: number, month: number): string {
  return `第${year}学年 · 第${month}月`;
}

export function formatSystemLogType(value: keyof typeof systemLogTypeLabels | string): string {
  return systemLogTypeLabels[value as keyof typeof systemLogTypeLabels] ?? value;
}

export function formatPlayerFacingTurn(turn: ActionTurnSummary): string {
  return describeTurn(turn);
}

export function formatPlayerFacingFact(fact: string): string {
  return describeNotableFact(fact) ?? fact;
}

export function formatPlayerFacingFlag(flag: string): string {
  return describeFlag(flag) ?? flag;
}

export function formatEndingNotableFact(fact: string): string {
  return describeEndingNotableFact(fact);
}

export function buildPlayerFacingMonthlyLog(
  summary: StructuredMonthlySummary,
  year: number,
  month: number,
): PlayerFacingMonthlyLog {
  const actionText = uniqueStrings((summary.actions ?? []).map(formatActionType)).join("、");
  const details = buildDetailLines(summary);

  return {
    badge: "本月回顾",
    periodLabel: formatMonthLabel(year, month),
    title: buildMonthlyTitle(summary),
    message: `这个月我主要把时间放在${actionText || "调整状态"}上，课程走的是“${formatAttendanceStrategy(summary.attendanceStrategy)}”。${buildMoodSentence(summary)} 月底手里还剩 ${summary.statsAfter.money} 元，心情 ${summary.statsAfter.mood}，压力 ${summary.statsAfter.stress}，学业反馈是“${formatSemesterFeedback(summary.academicFeedback)}”。`,
    details,
  };
}

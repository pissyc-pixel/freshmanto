import type {
  ActionTime,
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
  TimeBlockKind
} from "@/types/game";

export const attendanceStrategyOptions: Array<{
  value: CourseAttendanceStrategy;
  label: string;
  description: string;
}> = [
  { value: "serious", label: "认真上课", description: "学业收益最高，但留给自己的缓冲会更少。" },
  { value: "mixed", label: "正常混课", description: "兼顾课程和生活，适合作为默认策略。" },
  { value: "skip_sometimes", label: "偶尔翘课", description: "能短暂喘口气，但课程风险会慢慢积累。" },
  { value: "skip_often", label: "经常翘课", description: "会很快把学业风险推高，属于高风险玩法。" },
  { value: "proxy", label: "代课 / 代签到", description: "表面上还在出勤，长期来看更容易翻车。" },
  { value: "phone", label: "上课刷手机", description: "人到了教室，但注意力没到，后续隐患会变多。" }
];

export const actionOptions: Array<{
  value: ActionType;
  label: string;
  description: string;
}> = [
  { value: "study", label: "复习 / 学习", description: "提升当学期学业值，也会带来一点压力。" },
  { value: "job_prep", label: "实习 / 求职准备", description: "为履历铺路，会消耗一些金钱和精力。" },
  { value: "part_time", label: "兼职 / 赚钱", description: "补充现金流，但不能安排在夜间。" },
  { value: "social", label: "社交 / 关系", description: "帮助修复心情和社交状态。" },
  { value: "relax", label: "娱乐 / 放松", description: "降压很快，但通常要花钱。" },
  { value: "student_activity", label: "学生活动 / 讲座 / 社团", description: "有机会留下履历痕迹，也更有生活感。" },
  { value: "remedy", label: "补救 / 应急处理", description: "用来收拾局面，优先缓解风险。" },
  { value: "ask_family", label: "向家里要钱", description: "补钱快，但冷却更长，也更有心理负担。" }
];

export const actionTimeOptions: Array<{
  value: ActionTime;
  label: string;
}> = [
  { value: "day", label: "白天" },
  { value: "night", label: "夜间" }
];

const talentLabels: Record<Talent, string> = {
  "self-disciplined": "自律",
  "quick-learner": "上手快",
  "social-butterfly": "社交达人",
  "stress-resistant": "抗压",
  resourceful: "会找资源"
};

const familyLabels: Record<FamilyBackground, string> = {
  struggling: "家里拮据",
  ordinary: "普通家庭",
  stable: "家庭稳定",
  "well-connected": "家里有人脉",
  affluent: "家境优渥"
};

const trackLabels: Record<CollegeTrack, string> = {
  arts: "文科",
  science: "理科",
  engineering: "工科",
  business: "商科",
  medicine: "医学"
};

const schoolTierLabels: Record<SchoolTier, string> = {
  qingbei: "清北",
  nankai_tianda: "南开 / 天大",
  "985": "985",
  "211": "211",
  first_tier: "一本",
  second_tier: "二本"
};

const cityTierLabels: Record<CityTier, string> = {
  tier_1: "一线城市",
  tier_2: "二线城市",
  tier_3: "三线城市"
};

const outcomeLabels: Record<GraduationOutcome, string> = {
  graduate: "正常毕业",
  delayed: "延毕",
  cannot_graduate: "无法正常毕业",
  drop_out: "肄业"
};

const feedbackLabels: Record<SemesterFeedback, string> = {
  excellent: "表现很亮眼",
  stable: "整体稳住了",
  strained: "有点吃力",
  warning: "已经亮黄灯",
  critical: "快要撑不住了"
};

const timeBlockLabels: Record<TimeBlockKind, string> = {
  free: "整天都能自己安排",
  half_free: "白天较忙，仍有可调空间",
  busy_day: "白天被课程或义务占满"
};

const statLabels: Record<keyof DynamicStats, string> = {
  money: "金钱",
  mood: "心情",
  stress: "压力",
  fulfillment: "成就感",
  social: "社交",
  semesterAcademics: "当学期学业"
};

const systemLogTypeLabels = {
  action: "行动记录",
  event: "事件记录",
  settlement: "结算记录"
} as const;

export type PlayerFacingMonthlyLog = {
  badge: string;
  periodLabel: string;
  title: string;
  message: string;
  details: string[];
};

export function formatTalent(value: Talent) {
  return talentLabels[value];
}

export function formatFamilyBackground(value: FamilyBackground) {
  return familyLabels[value];
}

export function formatCollegeTrack(value: CollegeTrack) {
  return trackLabels[value];
}

export function formatSchoolTier(value: SchoolTier) {
  return schoolTierLabels[value];
}

export function formatCityTier(value: CityTier) {
  return cityTierLabels[value];
}

export function formatActionType(value: ActionType) {
  return actionOptions.find((item) => item.value === value)?.label ?? value;
}

export function formatAttendanceStrategy(value: CourseAttendanceStrategy) {
  return attendanceStrategyOptions.find((item) => item.value === value)?.label ?? value;
}

export function formatSemesterFeedback(value: SemesterFeedback) {
  return feedbackLabels[value];
}

export function formatGraduationOutcome(value: GraduationOutcome) {
  return outcomeLabels[value];
}

export function formatTimeBlockKind(value: TimeBlockKind) {
  return timeBlockLabels[value];
}

export function formatStatLabel(key: keyof DynamicStats) {
  return statLabels[key];
}

export function formatMonthLabel(year: number, month: number) {
  return `第${year}学年 · 第${month}月`;
}

export function formatSystemLogType(value: keyof typeof systemLogTypeLabels | string) {
  return systemLogTypeLabels[value as keyof typeof systemLogTypeLabels] ?? value;
}

function buildMoodSentence(summary: StructuredMonthlySummary) {
  const { semesterAcademics, stress, mood, fulfillment } = summary.statsDelta;

  if (semesterAcademics >= 10) {
    return "这段时间在学业上明显追了回来。";
  }

  if (stress >= 8) {
    return "整个月都像在赶路，压力感有点顶。";
  }

  if (mood >= 8 || fulfillment >= 8) {
    return "虽然忙，但心里还是有点发亮。";
  }

  return "节奏不算炸裂，但也没有真正闲下来。";
}

function buildMonthlyTitle(summary: StructuredMonthlySummary) {
  if (summary.statsDelta.semesterAcademics >= 10) {
    return "这个月像是终于把状态拽回来了";
  }

  if (summary.statsDelta.stress >= 8) {
    return "这个月过得有点赶，也有点硬撑";
  }

  if (summary.resumeAdditions.length > 0) {
    return "这个月不只是忙，还留下了点能写进履历的东西";
  }

  return "这个月的我在生活和学业之间继续找平衡";
}

export function buildPlayerFacingMonthlyLog(
  summary: StructuredMonthlySummary,
  year: number,
  month: number
): PlayerFacingMonthlyLog {
  const actionText = summary.actions.map(formatActionType).join("、");
  const details = [
    ...summary.notableFacts,
    ...summary.resumeAdditions.map((item) => `新增履历：${item.title}`)
  ];

  return {
    badge: "本月回顾",
    periodLabel: formatMonthLabel(year, month),
    title: buildMonthlyTitle(summary),
    message: `这月我主要把时间放在${actionText || "调整状态"}，课程上走的是“${formatAttendanceStrategy(summary.attendanceStrategy)}”路线。${buildMoodSentence(summary)}`,
    details
  };
}

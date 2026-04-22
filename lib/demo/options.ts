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
  Talent,
  TimeBlockKind
} from "@/types/game";

export const attendanceStrategyOptions: Array<{
  value: CourseAttendanceStrategy;
  label: string;
  description: string;
}> = [
  { value: "serious", label: "认真上课", description: "学业收益最高，但心情波动较小。" },
  { value: "mixed", label: "正常混课", description: "稳定推进，适合作为默认策略。" },
  { value: "skip_sometimes", label: "偶尔翘课", description: "短期轻松一些，但课堂信息更容易断档。" },
  { value: "skip_often", label: "经常翘课", description: "风险上升很快，只适合非常规玩法。" },
  { value: "proxy", label: "代课 / 代签到", description: "表面出勤，长期学业风险明显走高。" },
  { value: "phone", label: "上课刷手机", description: "算出勤、不直接扣心情，但会埋下后续风险。" }
];

export const actionOptions: Array<{
  value: ActionType;
  label: string;
  description: string;
}> = [
  { value: "study", label: "复习 / 学习", description: "提升当学期学业值，略微增加压力。" },
  { value: "job_prep", label: "实习 / 求职准备", description: "增加履历痕迹，消耗少量金钱与精力。" },
  { value: "part_time", label: "兼职 / 赚钱", description: "增加现金流，但不能安排在夜间。" },
  { value: "social", label: "社交 / 关系", description: "提高心情与社交值，适合拉回状态。" },
  { value: "relax", label: "娱乐 / 放松", description: "快速减压，但会消耗金钱。" },
  { value: "student_activity", label: "学生活动 / 讲座 / 社团", description: "可能补充履历和成就感。" },
  { value: "remedy", label: "补救 / 应急处理", description: "用于收拾局面，缓解压力和学业风险。" },
  { value: "ask_family", label: "向家里要钱", description: "冷却较长，但能快速补充现金流。" }
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
  struggling: "家庭拮据",
  ordinary: "普通家庭",
  stable: "家庭稳定",
  "well-connected": "家里有人脉",
  affluent: "家境优渥"
};

const trackLabels: Record<CollegeTrack, string> = {
  arts: "文",
  science: "理",
  engineering: "工",
  business: "商",
  medicine: "医"
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
  excellent: "优异",
  stable: "稳定",
  strained: "吃力",
  warning: "预警",
  critical: "高危"
};

const timeBlockLabels: Record<TimeBlockKind, string> = {
  free: "完全空闲",
  half_free: "半空闲",
  busy_day: "白天全忙"
};

const statLabels: Record<keyof DynamicStats, string> = {
  money: "金钱",
  mood: "心情",
  stress: "压力",
  fulfillment: "成就感",
  social: "社交",
  semesterAcademics: "当学期学业值"
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
  return `第 ${year} 学年 · 第 ${month} 月`;
}


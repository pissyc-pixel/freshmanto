import type { ActionType, WeeklyActionOption } from "@/types/game";

function createDefaultOption(option: WeeklyActionOption): WeeklyActionOption {
  return option;
}

export const weeklyActionCatalog: WeeklyActionOption[] = [
  createDefaultOption({
    optionId: "study",
    action: "study",
    label: "复习 / 学习",
    description: "稳一点推进学业，夜里也能做，但连续硬学会越来越累。",
    availability: ["night", "half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "writing_research",
    action: "writing_research",
    label: "写作 / 调研",
    description: "做写作、访谈、资料整理或小型调研，能慢慢补学业、表达和项目感。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "job_prep",
    action: "job_prep",
    label: "实习 / 求职准备",
    description: "打磨简历、找实习、投递和准备面试，假期里也能当成短期实践来推进。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "postgraduate_prep",
    action: "postgraduate_prep",
    label: "考研 / 深造准备",
    description: "把时间用在考研复习、资料整理或者研究积累上，大三后会越来越有分量。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "public_exam_prep",
    action: "public_exam_prep",
    label: "公考准备",
    description: "一点点把行测、申论和节奏稳定下来，是后半程才会慢慢变重的线。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "competition_project",
    action: "competition_project",
    label: "比赛 / 长期项目投入",
    description: "给手里的竞赛或项目再投入一天，是长线成长的积累。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "part_time",
    action: "part_time",
    label: "兼职 / 赚钱",
    description: "更适合完整白天去做，能补现金流，但会明显消耗状态。",
    availability: ["full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "social",
    action: "social",
    label: "社交 / 出行",
    description: "见人、吃饭、串门或短途出门，花点钱换心情和减压，也可能给后面留点人脉。",
    availability: ["night", "half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "relax",
    action: "relax",
    label: "回家休息 / 放松",
    description: "先让自己缓一口气，假期里更像高质量休息；压力越高，这段时间越有价值。",
    availability: ["night", "half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "big_meal",
    action: "big_meal",
    label: "吃顿好的",
    description: "花一笔钱换明显的心情和压力改善，节奏轻，夜里也能安排。",
    availability: ["night", "half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "student_activity",
    action: "student_activity",
    label: "学生活动 / 社团 / 讲座",
    description: "留一点校园参与感，也更容易留下能展示的经历。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "remedy",
    action: "remedy",
    label: "补救 / 应急处理",
    description: "先止损，把已经堆起来的学业或状态问题往回拉。",
    availability: ["half_day", "full_day"],
    source: "default",
  }),
  createDefaultOption({
    optionId: "ask_family",
    action: "ask_family",
    label: "向家里要钱",
    description: "来钱快，但压力很明显，也有冷却。",
    availability: ["night", "half_day", "full_day"],
    source: "default",
  }),
];

export function findWeeklyActionOption(optionId: string): WeeklyActionOption | undefined {
  return weeklyActionCatalog.find((option) => option.optionId === optionId);
}

export function findDefaultActionOption(action: ActionType): WeeklyActionOption | undefined {
  return weeklyActionCatalog.find((option) => option.action === action);
}

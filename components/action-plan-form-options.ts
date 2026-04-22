import { getActionTimeCost } from "@/core/resolvers/schedule";
import type { ActionType, Weekday } from "@/types/game";

function formatActionCost(action: ActionType) {
  const cost = getActionTimeCost(action);

  if (cost === 0) {
    return "不占用正式行动时段";
  }

  return `耗时：${cost} 个半天`;
}

export const actionOptions: Array<{
  value: ActionType;
  label: string;
  description: string;
}> = [
  {
    value: "study",
    label: "复习 / 学习",
    description: `稳步推进学业，但连续硬学会越来越累。${formatActionCost("study")}`,
  },
  {
    value: "job_prep",
    label: "实习 / 求职准备",
    description: `打磨简历、投递和准备面试，也会消耗一些钱和精力。${formatActionCost("job_prep")}`,
  },
  {
    value: "part_time",
    label: "兼职 / 赚钱",
    description: `补一点现金流，但夜间不能安排。${formatActionCost("part_time")}`,
  },
  {
    value: "social",
    label: "社交 / 关系",
    description: `花钱换心情和人脉，后面可能派上用场。${formatActionCost("social")}`,
  },
  {
    value: "relax",
    label: "娱乐 / 放松",
    description: `优先把压力降下来，通常也要花一点钱。${formatActionCost("relax")}`,
  },
  {
    value: "big_meal",
    label: "吃大餐",
    description: `即时回血，不推进周历，适合先把状态稳住。${formatActionCost("big_meal")}`,
  },
  {
    value: "student_activity",
    label: "学生活动 / 讲座 / 社团",
    description: `更有生活感，也更容易留下能写进履历的痕迹。${formatActionCost("student_activity")}`,
  },
  {
    value: "remedy",
    label: "补救 / 应急处理",
    description: `先止损，把已经堆起来的风险往回拉。${formatActionCost("remedy")}`,
  },
  {
    value: "ask_family",
    label: "向家里要钱",
    description: `来钱快，但压力明显，而且有冷却。${formatActionCost("ask_family")}`,
  },
  {
    value: "skip_class",
    label: "这周不去上课",
    description: `腾出这周被白天课程锁住的行动位，但后续风险会提高。${formatActionCost("skip_class")}`,
  },
];

export const skipClassDayOptions: Array<{
  value: Weekday;
  label: string;
}> = [
  { value: "mon", label: "周一白天" },
  { value: "wed", label: "周三白天" },
  { value: "fri", label: "周五白天" },
];

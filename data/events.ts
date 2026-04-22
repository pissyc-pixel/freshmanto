import type { EventTemplate } from "@/types/game";

export const starterEventTemplates: EventTemplate[] = [
  {
    id: "freshman-orientation",
    title: "新生导览周",
    severity: "routine",
    triggerMonths: [1],
    condition: "always",
    summary: "开学初的导览和班级破冰，能稍微提升校园融入感。",
    supportsRemedy: false,
    effect: {
      stats: {
        mood: 3,
        social: 4,
      },
      notableFact: "event: freshman-orientation",
    },
  },
  {
    id: "midterm-pressure",
    title: "期中压力堆积",
    severity: "important",
    triggerMonths: [4, 10],
    condition: "academic_risk_high",
    summary: "课堂信息缺失和拖延会在期中阶段集中爆发。",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: 5,
      },
      academicRisk: 4,
      flags: ["midterm-pressure"],
      notableFact: "event: midterm-pressure",
    },
  },
  {
    id: "rent-pressure",
    title: "月底资金吃紧",
    severity: "important",
    triggerMonths: [2, 5, 8, 11],
    condition: "money_low",
    summary: "生活费偏紧时，月底支出会把压力再往上推一层。",
    supportsRemedy: true,
    effect: {
      stats: {
        stress: 4,
        mood: -2,
      },
      flags: ["money-tight"],
      notableFact: "event: rent-pressure",
    },
  },
];

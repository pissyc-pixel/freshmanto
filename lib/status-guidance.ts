import type { ActionType } from "@/types/game";

type StatusBand = {
  label: string;
  explanation: string;
};

export type StatusGuidance = {
  mood: StatusBand;
  stress: StatusBand;
  summary: string;
  strategy: string;
  recommendedActions: ActionType[];
};

function resolveMoodBand(mood: number): StatusBand {
  if (mood >= 75) {
    return {
      label: "状态不错",
      explanation: "心情比较稳，可以承接更有推进性的任务。",
    };
  }

  if (mood >= 45) {
    return {
      label: "正常波动",
      explanation: "心情有起伏，但整体还在可控范围内。",
    };
  }

  if (mood >= 25) {
    return {
      label: "心情偏低",
      explanation: "现在更适合安排一次低成本恢复，而不是继续硬顶。",
    };
  }

  return {
    label: "心情很低",
    explanation: "先把自己从下坠状态里拽回来，再谈高压推进会更稳。",
  };
}

function resolveStressBand(stress: number): StatusBand {
  if (stress < 30) {
    return {
      label: "压力较低",
      explanation: "还能适度推进学业或履历积累。",
    };
  }

  if (stress < 60) {
    return {
      label: "压力中等",
      explanation: "继续推进没问题，但最好注意平衡。",
    };
  }

  if (stress < 80) {
    return {
      label: "压力偏高",
      explanation: "继续堆学习或兼职，比较容易把状态再往下压。",
    };
  }

  return {
    label: "压力很高",
    explanation: "优先恢复、睡一觉、吃顿好的或找人说说，比继续硬扛更重要。",
  };
}

export function buildStatusGuidance(input: { mood: number; stress: number }): StatusGuidance {
  const mood = resolveMoodBand(input.mood);
  const stress = resolveStressBand(input.stress);

  if (input.stress >= 80) {
    return {
      mood,
      stress,
      summary: "压力偏高，建议先安排一次低负担恢复行动。",
      strategy: "先把压力往下拉，再决定要不要继续堆学习、兼职或高压推进。",
      recommendedActions: ["relax", "big_meal", "social"],
    };
  }

  if (input.mood < 25) {
    return {
      mood,
      stress,
      summary: "心情偏低，建议先做一次恢复节奏的行动。",
      strategy: "先恢复一点体感和情绪，不然高压力任务的收益很容易打折。",
      recommendedActions: ["relax", "big_meal", "social"],
    };
  }

  if (input.stress >= 60 || input.mood < 45) {
    return {
      mood,
      stress,
      summary: "状态有点紧，最好把推进和恢复混着排。",
      strategy: "可以推进学业或履历，但最好给自己留一个缓冲动作。",
      recommendedActions: ["relax", "study", "student_activity"],
    };
  }

  return {
    mood,
    stress,
    summary: "当前状态还稳，可以正常推进本周安排。",
    strategy: "如果这周有关键学业或履历动作，现在是比较能接得住的时候。",
    recommendedActions: ["study", "job_prep", "student_activity"],
  };
}

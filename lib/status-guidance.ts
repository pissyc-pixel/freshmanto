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
      summary: "这周别排太满。",
      strategy: "先缓一缓，再去碰更费劲的事，会稳很多。",
      recommendedActions: ["relax", "big_meal", "social"],
    };
  }

  if (input.mood < 25) {
    return {
      mood,
      stress,
      summary: "先让自己缓过来一点。",
      strategy: "把节奏放轻一点，今天不适合硬顶。",
      recommendedActions: ["relax", "big_meal", "social"],
    };
  }

  if (input.stress >= 60 || input.mood < 45) {
    return {
      mood,
      stress,
      summary: "这周节奏有点紧。",
      strategy: "推进和休息穿着来，会更接得住。",
      recommendedActions: ["relax", "study", "student_activity"],
    };
  }

  return {
    mood,
    stress,
    summary: "这周节奏还算平稳。",
    strategy: "有空的话，可以给重要的事留点时间。",
    recommendedActions: ["study", "job_prep", "student_activity"],
  };
}

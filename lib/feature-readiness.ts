export type FeatureReadinessStatus = "real" | "partial" | "prototype" | "not_ready";

export type FeatureKey =
  | "start"
  | "admission"
  | "weeklyPlanner"
  | "actionModal"
  | "journal"
  | "resume"
  | "monthlyJournal"
  | "endingPreview"
  | "campusMap"
  | "socialCircle"
  | "jobInterview"
  | "offerSelection"
  | "gradSchoolChoice"
  | "civilServicePostChoice"
  | "recommendationChoice";

type FeatureReadinessEntry = {
  label: string;
  status: FeatureReadinessStatus;
  route?: string;
  note: string;
};

export const featureReadiness: Record<FeatureKey, FeatureReadinessEntry> = {
  start: {
    label: "开始页",
    status: "real",
    route: "/",
    note: "真实开档入口已接到 createServerDemoRun。",
  },
  admission: {
    label: "录取通知书",
    status: "partial",
    route: "/admission",
    note: "开局确认页可接真实画像，但当前缺少真实姓名、院校、专业与校区字段。",
  },
  weeklyPlanner: {
    label: "周历主玩法",
    status: "real",
    route: "/game",
    note: "逐天规划、确认本周、周结算与月结算链路已存在。",
  },
  actionModal: {
    label: "行动选择弹窗",
    status: "real",
    note: "真实 option 列表和提交 payload 已接在 ActionPlanForm。",
  },
  journal: {
    label: "成长日志",
    status: "real",
    route: "/journal",
    note: "可由 monthly_states 快照真实推导成长日志内容。",
  },
  resume: {
    label: "履历",
    status: "real",
    route: "/resume",
    note: "真实读取 GPA、排名、履历条目与方向解释。",
  },
  monthlyJournal: {
    label: "月记",
    status: "real",
    route: "/journal",
    note: "真实读取 monthly_journal AI report，且输入摘要来自规则层月快照。",
  },
  endingPreview: {
    label: "结局预览",
    status: "partial",
    route: "/ending",
    note: "结构化预览真实存在，但正式结局报告只在毕业结算后落地。",
  },
  campusMap: {
    label: "校园地图",
    status: "not_ready",
    note: "没有真实地图、建筑状态或建筑交互系统。",
  },
  socialCircle: {
    label: "社交圈",
    status: "not_ready",
    note: "没有真实好友、关系网或社团图谱数据。",
  },
  jobInterview: {
    label: "面试流程",
    status: "not_ready",
    note: "只有求职准备行为，没有真实面试流程与结果链。",
  },
  offerSelection: {
    label: "Offer 选择",
    status: "not_ready",
    note: "没有真实 offer 列表或 offer 决策规则。",
  },
  gradSchoolChoice: {
    label: "考研院校选择",
    status: "not_ready",
    note: "只有深造方向进度，没有真实院校志愿系统。",
  },
  civilServicePostChoice: {
    label: "公考岗位选择",
    status: "not_ready",
    note: "只有公考进度解释，没有真实岗位池或报考流程。",
  },
  recommendationChoice: {
    label: "推免去向选择",
    status: "not_ready",
    note: "只有推免资格判断，没有接受 / 转向的真实交互闭环。",
  },
};

export function getFeatureReadiness(feature: FeatureKey) {
  return featureReadiness[feature];
}

export function isFeatureRoutedForPlayers(feature: FeatureKey) {
  const status = getFeatureReadiness(feature).status;
  return status === "real" || status === "partial";
}

export function isFeatureReady(feature: FeatureKey) {
  return getFeatureReadiness(feature).status === "real";
}

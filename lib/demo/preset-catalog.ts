export const demoSavePresetIds = [
  "nankai-business-employment-junior-fall",
  "nankai-business-employment-final",
  "tianda-engineering-recommendation-junior-fall",
  "tianda-engineering-recommendation-final",
] as const;

export type DemoSavePresetId = (typeof demoSavePresetIds)[number];

export type DemoSavePreset = {
  id: DemoSavePresetId;
  label: string;
  routeLabel: string;
  schoolLabel: string;
  summary: string;
  endingTarget: string;
};

export const demoSavePresets: DemoSavePreset[] = [
  {
    id: "nankai-business-employment-junior-fall",
    label: "南开商科｜就业路线｜大三上",
    routeLabel: "就业路线",
    schoolLabel: "南开大学 · 商科 / 管理类",
    summary: "大三上开局，前面已经有奖学金、商赛、调研项目和第一段实习，后面重点看更高质量实习与就业结果。",
    endingTarget: "较好就业 offer",
  },
  {
    id: "nankai-business-employment-final",
    label: "南开商科｜就业路线｜最后一月",
    routeLabel: "终局前快速查看",
    schoolLabel: "南开大学 · 商科 / 管理类",
    summary: "直接来到第 48 月，已拥有完整履历与就业 offer，可以快速查看正式就业结局和最终报告。",
    endingTarget: "正常毕业 + 较好就业 offer",
  },
  {
    id: "tianda-engineering-recommendation-junior-fall",
    label: "天大工科｜推免路线｜大三上",
    routeLabel: "推免路线",
    schoolLabel: "天津大学 · 工科",
    summary: "大三上开局，前两年已经积累出 GPA、奖学金和竞赛优势，后面重点看推免申请与接受。",
    endingTarget: "推免结局",
  },
  {
    id: "tianda-engineering-recommendation-final",
    label: "天大工科｜推免路线｜最后一月",
    routeLabel: "终局前快速查看",
    schoolLabel: "天津大学 · 工科",
    summary: "直接来到第 48 月，已拥有推免 offer 与完整证据链，可以快速查看推免结局和最终报告。",
    endingTarget: "正常毕业 + 推免结局",
  },
];

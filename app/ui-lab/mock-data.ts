export const profile = {
  name: "林舒恒",
  subtitle: "未定人生方向",
  intro:
    "来自书香门第，自幼沉浸于图书馆。这种学术熏陶赋予了林舒恒极高的起点。其家庭背景为大学生活提供了稳定的初始资金支持。",
};

export const sidebarLinks = [
  { href: "/app/ui-lab/planner", label: "日常安排", key: "planner", icon: "calendar" },
  { href: "/app/ui-lab/resume", label: "个人履历", key: "resume", icon: "file" },
  { href: "/app/ui-lab/journal", label: "成长日志", key: "journal", icon: "book" },
] as const;

export const plannerMetrics = [
  { label: "生活费", value: "¥2,450", color: "teal", icon: "wallet", progress: 0.58 },
  { label: "心情指数", value: "82%", color: "green", icon: "smile", progress: 0.74 },
  { label: "压力负荷", value: "45%", color: "red", icon: "alert", progress: 0.48 },
  { label: "学业值", value: "76%", color: "amber", icon: "book-open", progress: 0.71 },
  { label: "专业等级", value: "Lv.3", color: "cyan", icon: "sheet", progress: 0.55 },
] as const;

export const plannerWeeks = [
  {
    week: "第 1 周",
    caption: "本周还有 11 / 11 个半天可用。这周还没有额外的可预约的上课白天",
    current: true,
  },
  { week: "第 2 周", caption: "还没轮到这一周。", current: false },
  { week: "第 3 周", caption: "还没轮到这一周。", current: false },
  { week: "第 4 周", caption: "还没轮到这一周。", current: false },
] as const;

export const plannerDays = [
  { day: "周一", tag: "白天被课占住", tagTone: "blue", text: "白天基本被课程或义务占满" },
  { day: "周二", tag: "半天空档", tagTone: "sand", text: "只有半天空档" },
  { day: "周三", tag: "全天可支配", tagTone: "mint", text: "全天都能自己安排" },
  { day: "周四", tag: "白天被课占住", tagTone: "blue", text: "白天基本被课程或义务占满" },
  { day: "周五", tag: "半天空档", tagTone: "sand", text: "只有半天空档" },
  { day: "周六", tag: "全天可支配", tagTone: "mint", text: "全天都能自己安排" },
  { day: "周日", tag: "全天可支配", tagTone: "mint", text: "全天都能自己安排" },
] as const;

export type UiLabActionOption = {
  title: string;
  body: string;
  icon: "map-pin" | "briefcase" | "moon" | "users" | "wallet" | "run";
  tone: "teal" | "orange";
  selected?: boolean;
};

export const actionOptions: UiLabActionOption[] = [
  {
    title: "[学术] 前往图书馆钻研",
    body: "为了积累，这是必修的，在静谧的自习室里沉浸于学术之海。",
    icon: "map-pin",
    tone: "teal",
  },
  {
    title: "[社交] 参加模拟面试大赛",
    body: "开始为大四校招做准备，在众人面前展示你的沟通才能。",
    icon: "briefcase",
    tone: "orange",
    selected: true,
  },
  {
    title: "[日常] 宿舍深度睡眠",
    body: "适当的休息是为了走更远的路，让积累和神经都得到放松。",
    icon: "moon",
    tone: "teal",
  },
  {
    title: "[社交] 组织社团例会",
    body: "作为部长，你需要策划下面的招新活动，提升领导力。",
    icon: "users",
    tone: "orange",
  },
  {
    title: "[日常] 校外兼职助教",
    body: "去校外的培训机构赚一些生活费，体会社会的节奏。",
    icon: "wallet",
    tone: "teal",
  },
  {
    title: "[日常] 操场夜跑 5KM",
    body: "强健的身体是最好的支持，释放多巴胺，缓解焦虑。",
    icon: "run",
    tone: "teal",
  },
] as const;

export const journalEntries = [
  {
    month: "十一月",
    title: "期中考与新友谊",
    body:
      "最近的生活像是被按下了快进键。期中周的图书馆总是灯火通明，空气中弥漫着浓缩咖啡和翻动书页的味道。原本以为会是一个人孤独地战斗，没想到和小组作业的几个伙伴成了无话不谈的朋友。我们在熬夜准备演示文稿后，一起去后街吃了热气腾腾的夜宵。那种疲惫中的欢笑，大概就是大学最真实的底色吧。",
    right: "压力: 中等    学业: 优良",
    tone: "warm",
    icon: "spark",
  },
  {
    month: "十月",
    title: "图书馆的午后",
    body:
      "阳光穿过图书馆高大的落地窗，正好洒在我的笔记本上。十月的空气开始有了凉意，但室内却暖洋洋的。我在这里发现了一个极好的角落，书架和书架之间，像是独立于世界的小岛。偶尔抬起头，能看到窗外金黄色的银杏叶缓缓落下。在这种静谧中，那些复杂的经济学曲线似乎也变得温柔了起来。",
    right: "心情: 平静    探索: 25%",
    tone: "cool",
    icon: "book",
  },
  {
    month: "九月",
    title: "初入校园",
    body:
      "拖着沉重的行李箱踏进校门的那一刻，我意识到一个全新的篇章开始了。学长学姐们热情地指路，广播里放着欢快的轻音乐，到处都是新鲜的面孔。我的宿舍在三楼，窗外能看到大操场。虽然对未来的课程和生活还有些许迷茫，但更多的是跃跃欲试的期待。你好，Freshmanto。",
    right: "心情: 兴奋",
    tone: "peach",
    icon: "bookmark",
  },
] as const;

export const resumeSkills = [
  { label: "心理诊断与咨询", icon: "spark", tone: "teal" },
  { label: "数据统计分析 (SPSS)", icon: "chart", tone: "rose" },
  { label: "中英文公众演讲", icon: "users", tone: "amber" },
  { label: "跨部门团队协作", icon: "team", tone: "cyan" },
] as const;

export const resumeItems = [
  {
    title: "新生入学教育 - 优秀学员",
    body: "在为期三周的军事化管理及入学导论中表现优异，获得院级表彰，展现出极强的自律性与集体荣誉感。",
    date: "2024.09",
    icon: "trophy",
    tone: "teal",
  },
  {
    title: "学院辩论队 - 队长",
    body: "由辅导员推荐担任，负责日常辩论培训与选材。在“新生杯”辩论赛中带领队伍进入四强，并获得“最佳辩手”称号。",
    date: "2024.10",
    icon: "team",
    tone: "cyan",
  },
  {
    title: "荣获国家奖学金",
    body: "综合排名第一，因学术表现卓越及社会实践贡献获此殊荣。这不仅是荣誉，更是对未来学术探索的激励。",
    date: "2024.11",
    icon: "medal",
    tone: "amber",
  },
  {
    title: "“希望工程”支教志愿者",
    body: "利用课余时间参与线上支教项目，为偏远地区学生提供心理辅导与基础学科辅导，累计志愿时长超过 50 小时。",
    date: "2024.12",
    icon: "heart-hand",
    tone: "teal",
  },
] as const;

export const monthlyStats = [
  { label: "心情", value: "84%", tone: "rose", icon: "smile" },
  { label: "学业", value: "62%", tone: "teal", icon: "cap" },
] as const;

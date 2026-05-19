import { sanitizePlayerFacingText } from "@/lib/player-facing-text";
import { formatActionType, formatPlannerReason } from "@/lib/demo/options";
import type { ActionTurnSummary, ActionType, CollegeTrack, WeeklyDayType, Weekday } from "@/types/game";

export type PlannerActionNarrativeContext = {
  saveId: string;
  year: number;
  month: number;
  week: number;
  weekday: Weekday;
  action: ActionType;
  actionId: string;
  dayType: WeeklyDayType;
  hasEvent: boolean;
  eventTitle?: string | null;
  mood: number;
  stress: number;
  money: number;
  collegeTrack: CollegeTrack;
  repeatedCount: number;
};

function stableHash(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickStable<T>(items: readonly T[], key: string): T {
  return items[stableHash(key) % items.length]!;
}

function buildSeed(context: PlannerActionNarrativeContext) {
  return [
    context.saveId,
    context.year,
    context.month,
    context.week,
    context.weekday,
    context.actionId,
    context.dayType,
    context.hasEvent ? context.eventTitle ?? "event" : "plain",
    context.repeatedCount,
  ].join(":");
}

function studyNarratives(context: PlannerActionNarrativeContext) {
  const heavyMood = context.stress >= 60 || context.mood <= 40;

  return [
    "晚上找了个空教室，把这周没听明白的内容重新捋了一遍。",
    "你把作业和笔记摊在桌上，慢慢补进度，虽然累，但心里踏实了一点。",
    "宿舍有点吵，你戴上耳机硬是把复习计划往前推了一截。",
    "这天没有做太多别的事，主要是在和课本、笔记、ddl 较劲。",
    heavyMood
      ? "你状态不算好，还是把一直拖着的内容补了一点，至少没继续欠着。"
      : "临近晚上才进入状态，效率不算高，但该看的东西总算翻了一遍。",
  ];
}

function writingNarratives(context: PlannerActionNarrativeContext) {
  const trackHint =
    context.collegeTrack === "business"
      ? "你把材料和想法重新理了一遍，像是在给后面的汇报和方案打底。"
      : context.collegeTrack === "engineering"
        ? "你查了一下午资料，把项目和材料先搭了个能继续往下写的框架。"
        : "你把手头那份材料重新整理了一遍，删删改改，终于像个能交出去的版本。";

  return [
    trackHint,
    "为了后面的事，你查了一下午资料，虽然枯燥，但总算有了点头绪。",
    "你打开文档坐了很久，先把框架搭起来，后面至少不至于从零开始。",
    "调研资料越看越乱，你只能先把有用的信息一点点摘出来。",
    "这件事现在还看不出结果，但你确实往以后埋了一点东西。",
    "你试着把想法写清楚，写到后面才发现自己其实还没完全想明白。",
  ];
}

function socialNarratives() {
  return [
    "舍友喊你晚上一起出去吃饭，路上聊了聊最近的课和烦心事。",
    "同学约你去校外逛了一圈，花了点钱，但人总算没一直闷在宿舍里。",
    "学院活动结束后，几个人顺路去吃了夜宵，气氛比想象中轻松。",
    "社团那边有个小活动，你过去露了个脸，也算认识了几个人。",
    "朋友拉你去操场散步，没聊什么大事，但心里松了一点。",
    "舍友临时组了个饭局，你本来不太想动，最后还是跟着去了。",
  ];
}

function mealNarratives() {
  return [
    "你给自己买了顿热乎的饭，花钱的时候有点心疼，但吃完确实舒服些。",
    "晚上没再凑合，去吃了顿像样的，算是给这几天的疲惫找个出口。",
    "和同学去校外吃饭，没聊什么正事，但那一会儿人轻松了不少。",
    "这顿饭不便宜，可你确实需要一点具体的安慰。",
    "你坐下来慢慢吃完一顿饭，才意识到自己这几天一直绷着。",
    "没做什么大事，只是认真吃了顿饭，状态却好像被拉回来一点。",
  ];
}

function askFamilyNarratives() {
  return [
    "你犹豫了一会儿，还是给家里发了消息，说最近手头有点紧。",
    "和家里通了个电话，钱的事开了口，心里多少有点别扭。",
    "生活费快见底了，你只能再找家里撑一把。",
    "你把聊天框打开又关上，最后还是把那句“最近钱不太够”发了出去。",
    "钱的问题暂时缓了一点，但那种不好意思开口的感觉还在。",
    "家里回得很快，你松了口气，也有一点说不出来的愧疚。",
  ];
}

function partTimeNarratives() {
  return [
    "你把空出来的时间拿去做兼职，身体有点累，但至少钱能补回来一些。",
    "这天过得不轻松，课外的时间基本都换成了收入。",
    "你一边想着作业，一边把兼职做完，回去时已经有点晚了。",
    "这不是最舒服的选择，但钱包确实需要它。",
    "忙完之后没什么力气再做别的，可钱的问题至少缓了一点。",
  ];
}

function idleNarratives() {
  return [
    "这天没特意安排什么，时间就松松地滑过去了。",
    "你在宿舍待了很久，没推进什么正事，只是让自己缓了一下。",
    "这一天像是从指缝里漏过去的，没什么成果，但人也没再继续绷着。",
    "你本来想做点什么，最后还是拖到了晚上。",
    "这天主要是在放空和应付日常，没往前走太多。",
    "没什么特别的安排，日子就这样轻轻过去了。",
  ];
}

function competitionNarratives(context: PlannerActionNarrativeContext) {
  const eventLead = context.eventTitle?.includes("说明会")
    ? `你去听了${context.eventTitle}，信息很多，暂时还没决定要不要真的接下来。`
    : null;

  return [
    ...(eventLead ? [eventLead] : []),
    "你把比赛材料看了一遍，发现这件事比想象中更费时间。",
    "你试着推进项目准备，虽然离成果还远，但至少开始动了。",
    "队友那边有些想法，你们简单碰了一下，事情慢慢有了形状。",
    "这次投入还看不出结果，但它可能会成为后面经历里的一块拼图。",
  ];
}

function eventHandlingNarratives(context: PlannerActionNarrativeContext) {
  const title = context.eventTitle?.replace(/^有/, "") ?? "临时通知";

  return [
    `导员临时通知要处理点事，你去了一趟，把“${title}”先弄清楚了。`,
    "班会占掉了一段时间，内容不算有趣，但至少没有漏掉重要通知。",
    "你把材料补齐交上去，事情不大，却很容易拖成麻烦。",
    "这一趟有点琐碎，但处理完之后心里少了一件悬着的事。",
    "你去听了场说明会，内容不一定马上用得上，但心里对以后多了点概念。",
  ];
}

function prepNarratives(action: ActionType) {
  if (action === "job_prep") {
    return [
      "你把简历和投递清单翻出来改了又改，总算不像之前那么空。",
      "晚上花在岗位、简历和想法上，事情还没落地，但人没那么虚了。",
      "你坐在电脑前把能准备的先准备起来，至少后面不会完全从头来过。",
    ];
  }

  if (action === "postgraduate_prep") {
    return [
      "你把时间稳稳地切给了深造这条线，虽然远，但总得先慢慢靠过去。",
      "晚上还是把书翻开了，很多东西没法一下想明白，只能先继续往前读。",
      "你开始认真碰那些以前只敢想一想的准备，心里还是紧，但没再完全躲开。",
    ];
  }

  return [
    "你把这段时间留给了公考准备，先把那些零散的东西一点点捡起来。",
    "这条路还远得很，但你至少没有继续把它只放在脑子里想。",
    "你坐下来做了会儿题，也记了点东西，方向还没定死，可已经开始有影子了。",
  ];
}

function remedyNarratives() {
  return [
    "你先去收拾眼前那点麻烦，过程不算轻松，但至少没让它继续堆着。",
    "这天更多像是在补洞，没什么成就感，可不处理又不行。",
    "你把该补的通知、材料和遗漏先理了一遍，心里总算没那么悬着。",
  ];
}

function skipClassNarratives(context: PlannerActionNarrativeContext) {
  return context.dayType === "half_day"
    ? [
        "你把半天课翘掉，终于给自己腾出了一段更完整的白天。",
        "原本被课卡住的那半天空了出来，人一下子像能喘口气。",
      ]
    : [
        "你把白天课翘掉，硬是从课表里挤出了一整天。",
        "这一步有点冒险，但你确实先把时间从课里抢了出来。",
      ];
}

export function buildPlannerActionNarrative(context: PlannerActionNarrativeContext) {
  const seed = buildSeed(context);
  const pools: Record<ActionType, string[]> = {
    study: studyNarratives(context),
    writing_research: writingNarratives(context),
    job_prep: prepNarratives("job_prep"),
    postgraduate_prep: prepNarratives("postgraduate_prep"),
    public_exam_prep: prepNarratives("public_exam_prep"),
    competition_project: competitionNarratives(context),
    part_time: partTimeNarratives(),
    social: socialNarratives(),
    relax: idleNarratives(),
    idle: idleNarratives(),
    big_meal: mealNarratives(),
    student_activity: eventHandlingNarratives(context),
    remedy: remedyNarratives(),
    ask_family: askFamilyNarratives(),
    skip_class: skipClassNarratives(context),
  };

  return pickStable(pools[context.action], seed);
}

function settlementSeed(turn: ActionTurnSummary) {
  return [turn.week, turn.turn, turn.weekday ?? "day", turn.resolvedAction.action].join(":");
}

function pickSettlementLine(turn: ActionTurnSummary, lines: readonly string[]) {
  return pickStable(lines, settlementSeed(turn));
}

export function buildWeeklySettlementNarrative(turn: ActionTurnSummary) {
  if (!turn.resolvedAction.accepted) {
    return sanitizePlayerFacingText(
      `这天本来想做“${formatActionType(turn.chosenAction.action)}”，最后还是没排进去。${formatPlannerReason(turn.resolvedAction.reason)}`,
    );
  }

  const action = turn.resolvedAction.action;

  if (action === "idle" || turn.notableFacts.includes("auto-filled-idle") || turn.resolvedAction.autoFilled) {
    return pickSettlementLine(turn, idleNarratives());
  }

  if (action === "study") {
    return pickSettlementLine(turn, [
      "这天大部分精力都放在补进度上，虽然累，但学业总算往前拱了一点。",
      "你把该补的东西重新捡起来了，心里还是会紧，但至少没继续拖。",
      "晚上学到有点烦，但关上书的时候，心里还是踏实了一些。",
    ]);
  }

  if (action === "social") {
    return pickSettlementLine(turn, [
      "晚上跟人出去吃了顿饭，花销多了一点，但心情明显松了下来。",
      "这天更多花在和人来往上，钱包薄了一些，但人没那么闷了。",
      "你跟同学在外面待了一会儿，回来的时候有点累，但心里不那么堵。",
    ]);
  }

  if (action === "big_meal") {
    return pickSettlementLine(turn, [
      "你给自己留了一顿像样的饭，花了点钱，但状态确实缓过来一点。",
      "这顿饭像是给这一周按了个暂停键，虽然钱包更紧了，人却舒服了些。",
      "你没有做太多别的事，只是认真吃了顿饭，整个人反而松了一口气。",
    ]);
  }

  if (action === "ask_family") {
    return pickSettlementLine(turn, [
      "你还是开口跟家里说了钱的事，余额缓过来了，但心里有点说不清的别扭。",
      "这件事解决了眼前的问题，也让你意识到这个月确实花得紧。",
      "家里把你接住了一下，松了口气之后，那点不好意思还是没完全散掉。",
    ]);
  }

  if (action === "part_time") {
    return pickSettlementLine(turn, [
      "你把这段空出来的时间拿去赚钱，身体有点累，但手头总算松了一点。",
      "这天过得不轻松，时间几乎都换成了收入，回去的时候已经有点乏了。",
      "钱的问题缓了一口气，只是忙完之后也没剩多少力气再做别的。",
    ]);
  }

  if (action === "writing_research") {
    return pickSettlementLine(turn, [
      "你把材料和想法重新理了一遍，虽然枯燥，但事情总算有了点轮廓。",
      "这天更像是在埋一条慢慢才会见效的线，眼下看不出结果，心里却没那么空了。",
      "你坐下来写写改改，虽然还不成熟，至少不再是完全停着。",
    ]);
  }

  if (action === "competition_project") {
    return pickSettlementLine(turn, [
      "你把时间正式投进了比赛或项目里，离结果还远，但事情已经开始动了。",
      "这一天更像是在替后面的成果先垫几步，累是累的，心里也知道不能不做。",
      "你和项目线重新接上了，暂时还没看见回报，但它至少没断在这里。",
    ]);
  }

  if (action === "student_activity") {
    return pickSettlementLine(turn, [
      "你去把班会和材料的事处理掉了，虽然琐碎，但至少没让它继续悬着。",
      "这天被通知和材料占掉了一块时间，没什么成就感，但事情总算落地了。",
      "你去听了点说明和通知，内容不一定精彩，可至少没错过该知道的事。",
    ]);
  }

  if (action === "relax") {
    return pickSettlementLine(turn, [
      "这天没有逼自己往前冲，更多是在放空和把状态往回拽一点。",
      "你把时间留给了休息，事情没有立刻变少，但人至少没再继续绷着。",
      "这一天过得松一点，没有什么成果感，不过心里那口气总算顺了一些。",
    ]);
  }

  if (action === "remedy") {
    return pickSettlementLine(turn, [
      "你去把眼前那点麻烦补上了，事不算大，却很容易拖成更大的烦心。",
      "这天像是在收拾残局，谈不上轻松，但至少没让问题继续往后滚。",
      "你把漏掉的东西一点点补齐，处理完之后，心里总算少悬着一件事。",
    ]);
  }

  if (action === "skip_class") {
    return pickSettlementLine(turn, [
      "你还是把课翘掉了，白天一下空出来，可后面的压力也一起跟了上来。",
      "这天从课表里硬挤出了一段时间，短暂是轻松了，但代价也留在了后面。",
    ]);
  }

  return sanitizePlayerFacingText(`这天把“${formatActionType(action)}”真正过了一遍，日子也就这样往前走了一点。`);
}

export function normalizeMonthlyDiaryBody(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !/^第\s*\d+\s*学年.*月记$/.test(line))
    .filter((line) => !/^本月来信$/.test(line));

  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.length === 0) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs
    .map((paragraph) => sanitizePlayerFacingText(paragraph))
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

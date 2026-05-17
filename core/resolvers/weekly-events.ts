import {
  getOpenCompetitionProjects,
} from "@/core/resolvers/progression";
import {
  buildWeeklyEventSpecialOption,
  emptyWeeklyEffect,
  pickWeeklyEventTemplate,
} from "@/data/weekly-events";
import type { GameRun, WeeklyActionEffect, WeeklyActionOption, WeeklyEventInstance, Weekday } from "@/types/game";

const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "周一",
  tue: "周二",
  wed: "周三",
  thu: "周四",
  fri: "周五",
  sat: "周六",
  sun: "周日",
};

function deterministicHash(seed: string): number {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003;
  }

  return hash;
}

function pickEventWeekday(run: GameRun, week: number, allowedWeekdays: Weekday[]): Weekday {
  if (allowedWeekdays.length === 1) {
    return allowedWeekdays[0]!;
  }

  const hash = deterministicHash(`${run.id}:${run.currentYear}:${run.currentMonth}:${week}:weekly-event-day`);
  return allowedWeekdays[hash % allowedWeekdays.length]!;
}

function buildCompetitionInviteInstance(run: GameRun, week: number): WeeklyEventInstance | null {
  const openProjects = getOpenCompetitionProjects(run);

  if (openProjects.length === 0) {
    return null;
  }

  const project = openProjects[deterministicHash(`${run.id}:${run.currentYear}:${run.currentMonth}:${week}:competition-open`) % openProjects.length]!;
  const weekday = pickEventWeekday(run, week, ["wed", "sat"]);
  const title = `《${project.title}》说明会 / 招募会`;

  return {
    id: "weekly-competition-invite",
    category: "D",
    title,
    summary: `这周会接触到“${project.title}”这条长期比赛 / 项目线，决定的是这学期要不要把它接起来。`,
    weekday,
    effectDescription: `${WEEKDAY_LABELS[weekday]}会撞上一场和“${project.title}”相关的说明会或招募会。`,
    specialAction: buildWeeklyEventSpecialOption("weekly-competition-invite", {
      optionId: `weekly-competition-invite-attend:${project.id}`,
      label: `参加《${project.title}》说明会`,
      description: `先去听一场《${project.title}》的说明会 / 招募会，把这条项目线真正接上，后面再决定怎么持续投入。`,
      baseAction: "student_activity",
      effect: {
        stats: { fulfillment: 2, social: 1 },
        notableFact: "weekly-event:competition-invite",
      },
    }),
    linkedProjectId: project.id,
    linkedProjectTitle: project.title,
    skipClosesProjectLine: true,
  };
}

export function resolveWeeklyEvent(run: GameRun, week: number): WeeklyEventInstance {
  const template = pickWeeklyEventTemplate(run, week);

  if (template.id === "weekly-competition-invite") {
    return buildCompetitionInviteInstance(run, week) ?? {
      id: template.id,
      category: template.category,
      title: template.title,
      summary: template.summary,
      weekday: pickEventWeekday(run, week, template.allowedWeekdays),
      effectDescription: template.detail,
      attendSummary: template.attendSummary,
      skipSummary: template.skipSummary,
      dayTypeOverride: template.dayTypeOverride,
      limitedActions: template.limitedActions,
      specialAction: template.specialAction
        ? buildWeeklyEventSpecialOption(template.id, template.specialAction)
        : undefined,
      actionBoosts: template.actionBoosts,
      missEffect: template.missEffect,
    };
  }

  const weekday = pickEventWeekday(run, week, template.allowedWeekdays);

  return {
    id: template.id,
    category: template.category,
    title: template.title,
    summary: template.summary,
    weekday,
    effectDescription: `${WEEKDAY_LABELS[weekday]}：${template.detail}`,
    attendSummary: template.attendSummary,
    skipSummary: template.skipSummary,
    dayTypeOverride: template.dayTypeOverride,
    limitedActions: template.limitedActions,
    specialAction: template.specialAction
      ? buildWeeklyEventSpecialOption(template.id, template.specialAction)
      : undefined,
    actionBoosts: template.actionBoosts,
    missEffect: template.missEffect,
  };
}

export function findWeeklyEventBoost(
  event: WeeklyEventInstance | null | undefined,
  option: WeeklyActionOption,
): WeeklyActionEffect {
  if (!event) {
    return emptyWeeklyEffect();
  }

  if (option.source === "weekly_event" && option.effect) {
    return option.effect;
  }

  return (
    event.actionBoosts?.find((boost) => boost.action === option.action)?.effect ??
    emptyWeeklyEffect()
  );
}

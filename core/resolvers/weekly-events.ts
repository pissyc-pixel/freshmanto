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

function pickEventWeekday(run: GameRun, week: number, allowedWeekdays: Weekday[]): Weekday {
  if (allowedWeekdays.length === 1) {
    return allowedWeekdays[0]!;
  }

  let hash = 0;
  const seed = `${run.id}:${run.currentYear}:${run.currentMonth}:${week}:weekly-event-day`;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1_000_003;
  }

  return allowedWeekdays[hash % allowedWeekdays.length]!;
}

export function resolveWeeklyEvent(run: GameRun, week: number): WeeklyEventInstance {
  const template = pickWeeklyEventTemplate(run, week);
  const weekday = pickEventWeekday(run, week, template.allowedWeekdays);

  return {
    id: template.id,
    category: template.category,
    title: template.title,
    summary: template.summary,
    weekday,
    effectDescription: `${WEEKDAY_LABELS[weekday]}：${template.detail}`,
    dayTypeOverride: template.dayTypeOverride,
    limitedActions: template.limitedActions,
    specialAction: template.specialAction
      ? buildWeeklyEventSpecialOption(template.id, template.specialAction)
      : undefined,
    actionBoosts: template.actionBoosts,
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

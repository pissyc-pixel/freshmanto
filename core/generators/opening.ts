import { ensureProgressionState } from "@/core/resolvers/progression";
import type {
  CityTier,
  CollegeTrack,
  DynamicStats,
  FamilyBackground,
  GameRun,
  InitialGameRunOptions,
  SchoolTier,
  StarterProfile,
  Talent,
} from "@/types/game";

const TALENTS: Talent[] = [
  "self-disciplined",
  "quick-learner",
  "social-butterfly",
  "stress-resistant",
  "resourceful",
];

const FAMILY_BACKGROUNDS: FamilyBackground[] = [
  "struggling",
  "ordinary",
  "stable",
  "well-connected",
  "affluent",
];

const COLLEGE_TRACKS: CollegeTrack[] = ["arts", "science", "engineering", "business", "medicine"];

type RandomSource = () => number;

function createRandomSource(randomValues?: number[]): RandomSource {
  if (!randomValues || randomValues.length === 0) {
    return Math.random;
  }

  let index = 0;
  return () => {
    const value = randomValues[index] ?? randomValues[randomValues.length - 1];
    index += 1;
    return value;
  };
}

function pickFromTable<T>(items: readonly T[], roll: number): T {
  const index = Math.min(items.length - 1, Math.floor(roll * items.length));
  return items[index];
}

function pickTalents(random: RandomSource): Talent[] {
  const first = pickFromTable(TALENTS, random());
  const second = pickFromTable(TALENTS, random());

  if (first === second) {
    const fallback = TALENTS[(TALENTS.indexOf(first) + 1) % TALENTS.length];
    return [first, fallback];
  }

  return [first, second];
}

function rollSchoolTier(roll: number): SchoolTier {
  if (roll < 0.12) {
    return "qingbei";
  }
  if (roll < 0.24) {
    return "nankai_tianda";
  }
  if (roll < 0.44) {
    return "985";
  }
  if (roll < 0.64) {
    return "211";
  }
  if (roll < 0.82) {
    return "first_tier";
  }
  return "second_tier";
}

function rollCityTier(schoolTier: SchoolTier, roll: number): CityTier {
  if (schoolTier === "qingbei") {
    return "tier_1";
  }
  if (schoolTier === "nankai_tianda") {
    return "tier_2";
  }

  if (schoolTier === "985") {
    if (roll < 0.55) {
      return "tier_1";
    }
    return roll < 0.9 ? "tier_2" : "tier_3";
  }

  if (schoolTier === "211") {
    if (roll < 0.3) {
      return "tier_1";
    }
    return roll < 0.75 ? "tier_2" : "tier_3";
  }

  if (schoolTier === "first_tier") {
    if (roll < 0.15) {
      return "tier_1";
    }
    return roll < 0.55 ? "tier_2" : "tier_3";
  }

  if (roll < 0.05) {
    return "tier_1";
  }
  return roll < 0.4 ? "tier_2" : "tier_3";
}

function calculateAllowance(background: FamilyBackground, luck: number, roll: number): number {
  const baseByBackground: Record<FamilyBackground, number> = {
    struggling: 900,
    ordinary: 1350,
    stable: 1650,
    "well-connected": 2000,
    affluent: 2800,
  };

  const variance = Math.round((roll * 180 + luck * 0.6) / 10) * 10;
  return baseByBackground[background] + variance;
}

function createInitialStats(profile: StarterProfile): DynamicStats {
  return {
    money: profile.monthlyAllowance,
    mood: 62,
    stress: 28,
    fulfillment: 40,
    social: 36,
    semesterAcademics: 0,
  };
}

export function createStarterProfile(options: InitialGameRunOptions = {}): StarterProfile {
  const random = createRandomSource(options.randomValues);

  const talents = pickTalents(random);
  const familyBackground = pickFromTable(FAMILY_BACKGROUNDS, random());
  const luck = Math.round(20 + random() * 75);
  const collegeTrack = pickFromTable(COLLEGE_TRACKS, random());
  const schoolTier = rollSchoolTier(random());
  const cityTier = rollCityTier(schoolTier, random());
  const monthlyAllowance = calculateAllowance(familyBackground, luck, random());

  return {
    talents,
    familyBackground,
    monthlyAllowance,
    luck,
    collegeTrack,
    schoolTier,
    cityTier,
  };
}

export function createInitialGameRun(options: InitialGameRunOptions = {}): GameRun {
  const profile = createStarterProfile(options);

  return ensureProgressionState({
    id: options.id ?? `run-${Date.now()}`,
    status: "active",
    currentYear: 1,
    currentMonth: 1,
    currentSemester: 1,
    profile,
    stats: createInitialStats(profile),
    semesterAverage: 0,
    resume: [],
    logLineIds: [],
    monthlySummaries: [],
    semesters: [],
    cooldowns: {
      askFamilyMonths: 0,
    },
    risk: {
      academicRisk: 0,
      burnout: 0,
    },
    riskFlags: [],
  });
}

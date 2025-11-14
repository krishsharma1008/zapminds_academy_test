export type ModuleDifficulty = "warmup" | "core" | "challenge" | "capstone";

const XP_BY_DIFFICULTY: Record<ModuleDifficulty, number> = {
  warmup: 50,
  core: 100,
  challenge: 200,
  capstone: 500,
};

export const MODULE_XP_VALUES = XP_BY_DIFFICULTY;

export const getModuleXp = (difficulty: string | null | undefined): number => {
  if (difficulty && difficulty in XP_BY_DIFFICULTY) {
    return XP_BY_DIFFICULTY[difficulty as ModuleDifficulty];
  }

  return XP_BY_DIFFICULTY.core;
};

export const getModuleDifficultyFromXp = (xp: number): ModuleDifficulty => {
  const sorted = Object.entries(XP_BY_DIFFICULTY)
    .sort(([, xpA], [, xpB]) => xpA - xpB) as [ModuleDifficulty, number][];

  for (const [difficulty, threshold] of sorted) {
    if (xp <= threshold) {
      return difficulty;
    }
  }

  return "capstone";
};

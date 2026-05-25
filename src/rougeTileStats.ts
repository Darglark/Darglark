export type RougeTileStatKey = "tiles_defended" | "waves_cleared" | "corruption_purged" | "bounty_level";

export type RougeTileStats = Record<RougeTileStatKey, number>;

export type RougeTileStatRow = {
  id: RougeTileStatKey;
  label: string;
  value: string;
};

export type RougeTileAchievementId = "ACH_THE_7654_WALL" | "ACH_ANSWER_TO_EVERYTHING";

export const DEFAULT_ROUGE_TILE_STATS: RougeTileStats = {
  tiles_defended: 0,
  waves_cleared: 0,
  corruption_purged: 0,
  bounty_level: 1,
};

const statOrder: RougeTileStatKey[] = ["tiles_defended", "waves_cleared", "corruption_purged", "bounty_level"];

export function formatRougeTileStatRows(stats: RougeTileStats): RougeTileStatRow[] {
  return statOrder.map((id) => ({
    id,
    label: toTitleCase(id),
    value: String(stats[id]),
  }));
}

export function getRougeTileAchievements(stats: RougeTileStats): RougeTileAchievementId[] {
  const achievements: RougeTileAchievementId[] = [];

  if (stats.tiles_defended >= 7_654) {
    achievements.push("ACH_THE_7654_WALL");
  }

  if (stats.waves_cleared >= 42) {
    achievements.push("ACH_ANSWER_TO_EVERYTHING");
  }

  return achievements;
}

export function updateRougeTileStat(
  stats: RougeTileStats,
  statName: RougeTileStatKey,
  value: number,
): RougeTileStats {
  return {
    ...stats,
    [statName]: value,
  };
}

function toTitleCase(statName: string) {
  return statName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

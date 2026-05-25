import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROUGE_TILE_STATS,
  formatRougeTileStatRows,
  getRougeTileAchievements,
  updateRougeTileStat,
} from "./rougeTileStats";

describe("Rouge Tile Defense stat display engine", () => {
  it("formats dictionary stats into scannable display rows", () => {
    expect(formatRougeTileStatRows(DEFAULT_ROUGE_TILE_STATS)).toEqual([
      { id: "tiles_defended", label: "Tiles Defended", value: "0" },
      { id: "waves_cleared", label: "Waves Cleared", value: "0" },
      { id: "corruption_purged", label: "Corruption Purged", value: "0" },
      { id: "bounty_level", label: "Bounty Level", value: "1" },
    ]);
  });

  it("reports Steam achievement unlock commands at stat thresholds", () => {
    expect(
      getRougeTileAchievements({
        tiles_defended: 7_654,
        waves_cleared: 42,
        corruption_purged: 120,
        bounty_level: 5,
      }),
    ).toEqual(["ACH_THE_7654_WALL", "ACH_ANSWER_TO_EVERYTHING"]);
  });

  it("updates a single stat without mutating the existing runtime dictionary", () => {
    const updated = updateRougeTileStat(DEFAULT_ROUGE_TILE_STATS, "tiles_defended", 25);

    expect(updated.tiles_defended).toBe(25);
    expect(DEFAULT_ROUGE_TILE_STATS.tiles_defended).toBe(0);
  });
});

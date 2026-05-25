import { useMemo, useState } from "react";
import {
  DEFAULT_ROUGE_TILE_STATS,
  formatRougeTileStatRows,
  getRougeTileAchievements,
  updateRougeTileStat,
  type RougeTileStatKey,
} from "./rougeTileStats";

const statIncrements: Array<{ stat: RougeTileStatKey; label: string; amount: number }> = [
  { stat: "tiles_defended", label: "Defend 1,000 tiles", amount: 1_000 },
  { stat: "waves_cleared", label: "Clear 7 waves", amount: 7 },
  { stat: "corruption_purged", label: "Purge 50 corruption", amount: 50 },
  { stat: "bounty_level", label: "Raise bounty", amount: 1 },
];

export function RougeTileStatsPanel() {
  const [stats, setStats] = useState(DEFAULT_ROUGE_TILE_STATS);
  const rows = useMemo(() => formatRougeTileStatRows(stats), [stats]);
  const achievements = useMemo(() => getRougeTileAchievements(stats), [stats]);

  const incrementStat = (stat: RougeTileStatKey, amount: number) => {
    setStats((currentStats) => updateRougeTileStat(currentStats, stat, currentStats[stat] + amount));
  };

  return (
    <section className="panel rouge-stats-panel">
      <div className="panel-heading">
        <p className="eyebrow">Rouge Tile Defense</p>
        <h2>Run stat display engine</h2>
      </div>
      <div className="rouge-stats-layout">
        <div className="rouge-stat-list" aria-label="Current run stats">
          {rows.map((row) => (
            <div className="rouge-stat-row" key={row.id}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
        <div className="rouge-stat-controls">
          <p>
            Dictionary-driven rows keep run telemetry scannable and ready for a SteamWorks wrapper to consume when
            thresholds unlock.
          </p>
          <div className="rouge-action-grid">
            {statIncrements.map((action) => (
              <button
                className="secondary-button"
                key={action.stat}
                type="button"
                onClick={() => incrementStat(action.stat, action.amount)}
              >
                {action.label}
              </button>
            ))}
            <button className="ghost-button" type="button" onClick={() => setStats(DEFAULT_ROUGE_TILE_STATS)}>
              Reset run
            </button>
          </div>
          <div className="achievement-hook" aria-live="polite">
            <span>Steam achievement hook</span>
            {achievements.length > 0 ? (
              achievements.map((achievement) => <code key={achievement}>Unlock -&gt; {achievement}</code>)
            ) : (
              <code>Awaiting threshold telemetry</code>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

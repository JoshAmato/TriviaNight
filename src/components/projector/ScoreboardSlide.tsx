"use client";

import { useGameStore } from "@/stores/gameStore";

export function ScoreboardSlide() {
  const { getTeamScores, hideScoreboard, scoreboardOverride } = useGameStore();
  const scores = getTeamScores();

  if (hideScoreboard && !scoreboardOverride) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-6xl">&#x1F92B;</p>
        <h1 className="font-display text-5xl text-text-mid">Scores Hidden</h1>
        <p className="text-xl text-text-dim">
          The host is keeping scores secret for now...
        </p>
      </div>
    );
  }

  const topColors = ["#e8b931", "#a0a0b8", "#fb923c"]; // gold, silver, bronze

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-16">
      <h1 className="font-display text-5xl text-accent">Scoreboard</h1>

      <div className="w-full max-w-2xl">
        {scores.map((team, i) => {
          const barWidth = scores[0]?.score > 0
            ? Math.max(10, (team.score / scores[0].score) * 100)
            : 10;

          return (
            <div key={team.teamId} className="mb-3 flex items-center gap-4">
              <span className="w-8 text-right font-mono text-xl font-bold text-text-mid">
                {team.rank}
              </span>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className="text-lg font-bold"
                    style={{ color: team.color }}
                  >
                    {team.name}
                  </span>
                  <span className="font-mono text-2xl font-bold text-text">
                    {team.score}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-hi">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: i < 3 ? topColors[i] : team.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

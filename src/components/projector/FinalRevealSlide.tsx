"use client";

import { useGameStore } from "@/stores/gameStore";

export function FinalRevealSlide() {
  const { getTeamScores, gameTitle } = useGameStore();
  const scores = getTeamScores();

  const podium = scores.slice(0, 3);
  const rest = scores.slice(3);

  const podiumEmojis = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-16">
      <h1 className="font-display text-6xl text-accent">Game Over!</h1>
      <p className="text-xl text-text-mid">{gameTitle}</p>

      {/* Podium */}
      <div className="flex items-end justify-center gap-6">
        {podium.map((team, i) => (
          <div
            key={team.teamId}
            className={`flex flex-col items-center gap-2 ${i === 0 ? "order-2" : i === 1 ? "order-1" : "order-3"}`}
          >
            <p className="text-4xl">{podiumEmojis[i]}</p>
            <div
              className="rounded-xl px-8 py-4 text-center"
              style={{
                backgroundColor: `${team.color}20`,
                border: `2px solid ${team.color}`,
                minHeight: i === 0 ? 160 : i === 1 ? 120 : 80,
              }}
            >
              <p className="font-display text-2xl" style={{ color: team.color }}>
                {team.name}
              </p>
              <p className="mt-2 font-mono text-4xl font-bold text-text">
                {team.score}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining teams */}
      {rest.length > 0 && (
        <div className="mt-4 w-full max-w-xl">
          {rest.map((team) => (
            <div
              key={team.teamId}
              className="flex items-center justify-between border-b border-surface-border py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-text-dim">{team.rank}.</span>
                <span className="font-semibold" style={{ color: team.color }}>
                  {team.name}
                </span>
              </div>
              <span className="font-mono font-bold text-text">
                {team.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

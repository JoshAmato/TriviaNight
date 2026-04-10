"use client";

import { useGameStore } from "@/stores/gameStore";

export function LobbySlide() {
  const { roomCode, teams, gameTitle } = useGameStore();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <h1 className="font-display text-6xl text-accent">{gameTitle}</h1>

      <div className="text-center">
        <p className="mb-2 text-lg text-text-mid">Join at</p>
        <p className="font-mono text-2xl text-text">
          {typeof window !== "undefined" ? window.location.host : ""}/play/
          <span className="font-bold text-accent">{roomCode}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface p-8 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-text-mid">
          Room Code
        </p>
        <p className="font-display text-[120px] leading-none text-accent">
          {roomCode}
        </p>
      </div>

      {teams.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-center text-sm font-bold uppercase tracking-wider text-text-mid">
            Teams Joined ({teams.length})
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-lg px-4 py-2 text-sm font-bold"
                style={{
                  backgroundColor: `${team.color}20`,
                  color: team.color,
                  border: `1px solid ${team.color}40`,
                }}
              >
                {team.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useGameStore } from "@/stores/gameStore";

export function GameProgress() {
  const { roomCode, teams, phase, currentRound, currentQuestion, rounds } =
    useGameStore();

  const roundIndex = currentRound
    ? rounds.findIndex((r) => r.id === currentRound.id) + 1
    : 0;
  const questionIndex = currentRound && currentQuestion
    ? currentRound.questions.findIndex((rq) => rq.id === currentQuestion.id) + 1
    : 0;

  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-hi px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-bold text-accent">
          {roomCode}
        </span>
        <span className="text-xs text-text-dim">
          {teams.length} team{teams.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-mid">
        {currentRound && (
          <>
            <span>R{roundIndex}</span>
            {questionIndex > 0 && (
              <>
                <span className="text-text-dim">/</span>
                <span>Q{questionIndex}</span>
              </>
            )}
          </>
        )}
        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
          {phase}
        </span>
      </div>
    </div>
  );
}

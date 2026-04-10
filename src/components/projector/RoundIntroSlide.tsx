"use client";

import { useGameStore } from "@/stores/gameStore";
import { Badge } from "@/components/ui/Badge";
import { ROUND_TYPE_INFO } from "@/lib/constants";

export function RoundIntroSlide() {
  const { currentRound, rounds } = useGameStore();

  if (!currentRound) return null;

  const roundIndex = rounds.findIndex((r) => r.id === currentRound.id);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <Badge color="#e8b931" bg="#e8b93120">
        {ROUND_TYPE_INFO[currentRound.round_type]?.label ?? currentRound.round_type}
      </Badge>
      <p className="text-2xl text-text-mid">
        Round {roundIndex + 1} of {rounds.filter((r) => r.round_type !== "break").length}
      </p>
      <h1 className="font-display text-7xl text-text">{currentRound.name}</h1>
      {currentRound.round_type !== "break" && (
        <p className="text-xl text-text-dim">
          {currentRound.questions.length} question
          {currentRound.questions.length !== 1 ? "s" : ""} &middot;{" "}
          {currentRound.timer_seconds}s per question
        </p>
      )}
    </div>
  );
}

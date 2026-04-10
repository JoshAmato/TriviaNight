"use client";

import { useGameStore } from "@/stores/gameStore";
import { Timer } from "@/components/ui/Timer";
import { SponsorBar } from "@/components/ui/SponsorBar";

export function BreakSlide() {
  const { timerRemaining, currentRound, sponsors } = useGameStore();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <p className="text-6xl">&#x2615;</p>
      <h1 className="font-display text-6xl text-text">
        {currentRound?.name ?? "Halftime Break"}
      </h1>

      {timerRemaining !== null && timerRemaining > 0 && (
        <Timer
          remaining={timerRemaining}
          total={currentRound?.timer_seconds ?? 600}
          size="lg"
        />
      )}

      <p className="text-xl text-text-mid">
        Grab a drink, stretch your legs
      </p>

      {sponsors.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <SponsorBar sponsors={sponsors} />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { useGameState } from "@/hooks/useGameState";
import { SponsorBar } from "@/components/ui/SponsorBar";
import { LobbySlide } from "@/components/projector/LobbySlide";
import { RoundIntroSlide } from "@/components/projector/RoundIntroSlide";
import { QuestionSlide } from "@/components/projector/QuestionSlide";
import { AnswerRevealSlide } from "@/components/projector/AnswerRevealSlide";
import { ScoreboardSlide } from "@/components/projector/ScoreboardSlide";
import { BreakSlide } from "@/components/projector/BreakSlide";
import { SponsorSplashSlide } from "@/components/projector/SponsorSplashSlide";
import { FinalRevealSlide } from "@/components/projector/FinalRevealSlide";

export default function ProjectorPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const { phase, roomCode, sponsors } = useGameStore();
  const [ready, setReady] = useState(false);

  // Sponsor splash state (overlay triggered by host)
  const [sponsorSplash, setSponsorSplash] = useState<{
    name: string;
    logoUrl?: string;
    color?: string;
  } | null>(null);

  // We need roomCode before we can subscribe to Realtime
  // First fetch game data to get roomCode
  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/games/${gameId}`);
      if (res.ok) {
        const data = await res.json();
        useGameStore.getState().setGameData({
          gameId: data.id,
          roomCode: data.room_code,
          gameTitle: data.game_title || data.name,
          hideScoreboard: data.hide_scoreboard,
          teams: [],
          rounds: data.rounds ?? [],
          sponsors: data.sponsors ?? [],
        });
        setReady(true);
      }
    }
    init();
  }, [gameId]);

  // Subscribe to Realtime once we have the roomCode
  useGameState({
    gameId,
    roomCode: roomCode ?? "",
    enabled: ready && !!roomCode,
  });

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="text-text-mid">Loading projector...</p>
      </div>
    );
  }

  const renderSlide = () => {
    // Sponsor splash overlay takes priority
    if (sponsorSplash) {
      return (
        <SponsorSplashSlide
          name={sponsorSplash.name}
          logoUrl={sponsorSplash.logoUrl}
          color={sponsorSplash.color}
        />
      );
    }

    switch (phase) {
      case "lobby":
        return <LobbySlide />;
      case "roundIntro":
        return <RoundIntroSlide />;
      case "question":
        return <QuestionSlide />;
      case "answerReveal":
        return <AnswerRevealSlide />;
      case "scoreboard":
        return <ScoreboardSlide />;
      case "break":
        return <BreakSlide />;
      case "sponsorSplash":
        return <SponsorSplashSlide name="" />;
      case "wagerWait":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-6xl">&#x1F3B0;</p>
            <h1 className="font-display text-5xl text-accent">
              Place Your Wagers!
            </h1>
            <p className="text-xl text-text-mid">
              Teams are locking in their wagers...
            </p>
          </div>
        );
      case "gameOver":
        return <FinalRevealSlide />;
      default:
        return <LobbySlide />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Main slide area */}
      <div className="flex-1 overflow-hidden">{renderSlide()}</div>

      {/* Sponsor bar at bottom */}
      {sponsors.length > 0 && <SponsorBar sponsors={sponsors} />}
    </div>
  );
}

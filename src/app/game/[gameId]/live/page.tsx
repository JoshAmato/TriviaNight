"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { useGameState } from "@/hooks/useGameState";
import { TabBar } from "@/components/ui/TabBar";
import { GameProgress } from "@/components/host/GameProgress";
import { ControlsPanel } from "@/components/host/ControlsPanel";
import { ScoresPanel } from "@/components/host/ScoresPanel";
import { AnswersPanel } from "@/components/host/AnswersPanel";

const TABS = [
  { id: "controls", label: "Controls", icon: "\uD83C\uDFAE" },
  { id: "scores", label: "Scores", icon: "\uD83C\uDFC6" },
  { id: "answers", label: "Answers", icon: "\uD83D\uDCDD" },
];

export default function HostRemotePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const store = useGameStore();
  const { roomCode, phase } = store;

  const [activeTab, setActiveTab] = useState("controls");
  const [ready, setReady] = useState(false);

  // Initialize game data
  useEffect(() => {
    async function init() {
      // First check if game is live, if not go live
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();

      if (data.status === "draft") {
        // Go live
        const liveRes = await fetch(`/api/games/${gameId}/go-live`, {
          method: "POST",
        });
        if (!liveRes.ok) {
          router.push("/dashboard");
          return;
        }
        const liveData = await liveRes.json();
        data.room_code = liveData.roomCode;
        data.status = "live";
      }

      store.setGameData({
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
    init();
  }, [gameId, router, store]);

  // Subscribe to Realtime
  const { send } = useGameState({
    gameId,
    roomCode: roomCode ?? "",
    enabled: ready && !!roomCode,
  });

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="text-text-mid">Loading host controls...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <div className="border-b border-surface-border px-4 pb-3 pt-4">
        <GameProgress />
      </div>

      {/* Tabs */}
      <div className="px-4 py-3">
        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === "controls" && (
          <ControlsPanel gameId={gameId} send={send} />
        )}
        {activeTab === "scores" && <ScoresPanel gameId={gameId} />}
        {activeTab === "answers" && <AnswersPanel />}
      </div>

      {/* Projector link */}
      <div className="border-t border-surface-border px-4 py-3 text-center">
        <a
          href={`/game/${gameId}/projector`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-dim hover:text-accent"
        >
          Open Projector View &rarr;
        </a>
      </div>
    </div>
  );
}

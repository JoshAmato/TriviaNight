"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JoinScreen } from "@/components/phone/JoinScreen";
import { PhoneGameView } from "@/components/phone/PhoneGameView";
import type { Team } from "@/types/game";

export default function PlayPage() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const supabase = createClient();

  const [gameId, setGameId] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveGame() {
      // Find game by room code
      const { data, error: queryError } = await supabase
        .from("games")
        .select("id")
        .eq("room_code", roomCode.toUpperCase())
        .eq("status", "live")
        .single();

      if (queryError || !data) {
        setError("Game not found. Check your room code.");
        setLoading(false);
        return;
      }

      setGameId(data.id);

      // Check if this device already has a team
      const deviceId = localStorage.getItem("triviaDeviceId");
      if (deviceId) {
        const { data: memberData } = await supabase
          .from("team_members")
          .select("*, team:teams(*)")
          .eq("device_id", deviceId);

        if (memberData && memberData.length > 0) {
          // Find a team in this game
          const match = memberData.find(
            (m) => (m.team as Team)?.game_id === data.id
          );
          if (match) {
            setTeam(match.team as Team);
            setIsCaptain(match.is_captain);
          }
        }
      }

      setLoading(false);
    }

    resolveGame();
  }, [roomCode, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="text-text-mid">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg px-6">
        <p className="text-lg text-danger">{error}</p>
        <a href="/" className="text-sm text-accent hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  if (!gameId) return null;

  if (!team) {
    return (
      <div className="flex h-screen flex-col bg-bg">
        <JoinScreen
          gameId={gameId}
          onJoined={(joinedTeam, captain) => {
            setTeam(joinedTeam);
            setIsCaptain(captain);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-bg">
      <PhoneGameView
        gameId={gameId}
        roomCode={roomCode.toUpperCase()}
        team={team}
        isCaptain={isCaptain}
      />
    </div>
  );
}

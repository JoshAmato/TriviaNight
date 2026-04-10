"use client";

import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useRealtimeChannel } from "./useRealtimeChannel";
import type { GameEvent } from "@/types/realtime";

interface UseGameStateOptions {
  gameId: string;
  roomCode: string;
  enabled?: boolean;
}

export function useGameState({ gameId, roomCode, enabled = true }: UseGameStateOptions) {
  const hasFetched = useRef(false);

  const fetchState = useCallback(async () => {
    const store = useGameStore.getState();
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) return;
      const data = await res.json();

      store.setGameData({
        gameId: data.id,
        roomCode: data.room_code,
        gameTitle: data.game_title || data.name,
        hideScoreboard: data.hide_scoreboard,
        teams: [],
        rounds: data.rounds ?? [],
        sponsors: data.sponsors ?? [],
      });

      // Fetch game_state
      const stateRes = await fetch(`/api/games/${gameId}/state`);
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        store.setGameState(stateData);
      }

      // Fetch teams
      const teamsRes = await fetch(`/api/games/${gameId}/teams`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        store.setTeams(teamsData.teams ?? []);
      }
    } catch {
      // Silently fail — will retry on reconnect
    }
  }, [gameId]);

  const handleMessage = useCallback(
    (event: GameEvent) => {
      const store = useGameStore.getState();
      switch (event.type) {
        case "STATE_UPDATE":
          store.setGameState(event.payload);
          break;
        case "TIMER_TICK":
          store.setTimer(event.payload.remaining);
          break;
        case "SCOREBOARD":
          if (event.payload.teams) {
            for (const team of event.payload.teams) {
              store.updateTeamScore(team.teamId, team.score);
            }
          }
          break;
        case "GAME_OVER":
          store.setPhase("gameOver");
          break;
      }
    },
    []
  );

  const { send } = useRealtimeChannel({
    channelName: `game:${roomCode}`,
    onMessage: handleMessage as (event: GameEvent | import("@/types/realtime").TeamEvent) => void,
    onReconnect: fetchState,
    enabled,
  });

  // Initial fetch — only once
  useEffect(() => {
    if (enabled && !hasFetched.current) {
      hasFetched.current = true;
      fetchState();
    }
  }, [enabled, fetchState]);

  return { send, refetch: fetchState };
}

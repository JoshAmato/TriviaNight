"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Team } from "@/types/game";

interface JoinScreenProps {
  gameId: string;
  onJoined: (team: Team, isCaptain: boolean) => void;
}

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("triviaDeviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("triviaDeviceId", id);
  }
  return id;
}

export function JoinScreen({ gameId, onJoined }: JoinScreenProps) {
  const [teamName, setTeamName] = useState("");
  const [pin, setPin] = useState("");
  const [needsPin, setNeedsPin] = useState(false);
  const [isNewTeam, setIsNewTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!teamName.trim()) return;
    setLoading(true);
    setError(null);

    const deviceId = getDeviceId();

    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName: teamName.trim(),
        pin: pin || undefined,
        deviceId,
        gameId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.needsPin) {
        setNeedsPin(true);
        setLoading(false);
        return;
      }
      setError(data.error || "Failed to join");
      setLoading(false);
      return;
    }

    onJoined(data.team, data.isCaptain);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <h1 className="font-display text-3xl text-accent">Join Game</h1>

      {error && (
        <div className="w-full max-w-sm rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="text"
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          maxLength={40}
          className="rounded-lg border border-surface-border bg-surface px-4 py-3 text-center text-lg text-text outline-none focus:border-accent"
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />

        {(needsPin || isNewTeam) && (
          <div>
            <p className="mb-2 text-center text-sm text-text-mid">
              {needsPin
                ? "Enter your team PIN"
                : "Set a 4-digit PIN for your team"}
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-text outline-none focus:border-accent"
            />
          </div>
        )}

        <Button
          size="lg"
          onClick={handleJoin}
          disabled={loading || !teamName.trim()}
        >
          {loading ? "Joining..." : needsPin ? "Join Team" : "Join"}
        </Button>

        {!needsPin && !isNewTeam && (
          <button
            onClick={() => setIsNewTeam(true)}
            className="text-sm text-text-dim hover:text-text-mid"
          >
            Set a team PIN (optional)
          </button>
        )}
      </div>
    </div>
  );
}

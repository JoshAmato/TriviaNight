"use client";

import { useState, useEffect } from "react";
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
  const [existingTeams, setExistingTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Fetch existing teams
  useEffect(() => {
    async function fetchTeams() {
      const res = await fetch(`/api/games/${gameId}/teams`);
      if (res.ok) {
        const data = await res.json();
        setExistingTeams(data.teams ?? []);
      }
    }
    fetchTeams();
  }, [gameId]);

  const handleSelectTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setTeamName(team.name);
    setIsNewTeam(false);
    setNeedsPin(true);
    setPin("");
    setError(null);
  };

  const handleNewTeam = () => {
    setSelectedTeamId(null);
    setTeamName("");
    setNeedsPin(false);
    setIsNewTeam(false);
    setPin("");
    setError(null);
  };

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
        {/* Existing teams */}
        {existingTeams.length > 0 && !selectedTeamId && (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-text-mid">Join an existing team</p>
            {existingTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelectTeam(team)}
                className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface px-4 py-3 transition-colors hover:border-accent/30"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-lg font-medium text-text">{team.name}</span>
              </button>
            ))}
            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-border" />
              <span className="text-xs text-text-dim">or create a new team</span>
              <div className="h-px flex-1 bg-surface-border" />
            </div>
          </div>
        )}

        {/* Back button when a team is selected */}
        {selectedTeamId && (
          <button
            onClick={handleNewTeam}
            className="self-start text-sm text-text-dim hover:text-text-mid"
          >
            &larr; Back
          </button>
        )}

        {/* Team name input — for new teams or when no team selected */}
        {!selectedTeamId && (
          <input
            type="text"
            placeholder="New team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={40}
            className="rounded-lg border border-surface-border bg-surface px-4 py-3 text-center text-lg text-text outline-none focus:border-accent"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
        )}

        {/* Selected team display */}
        {selectedTeamId && (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-accent/30 bg-surface px-4 py-3">
            <span
              className="h-4 w-4 rounded-full"
              style={{
                backgroundColor:
                  existingTeams.find((t) => t.id === selectedTeamId)?.color,
              }}
            />
            <span className="text-lg font-medium text-text">{teamName}</span>
          </div>
        )}

        {/* PIN input */}
        {(needsPin || isNewTeam) && (
          <div>
            <p className="mb-2 text-center text-sm text-text-mid">
              {needsPin
                ? "Enter the team PIN"
                : "Set a 4-digit PIN for your team"}
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              maxLength={4}
              className="w-full rounded-lg border border-surface-border bg-surface px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-text outline-none focus:border-accent"
              autoFocus
            />
          </div>
        )}

        <Button
          size="lg"
          onClick={handleJoin}
          disabled={loading || !teamName.trim()}
        >
          {loading
            ? "Joining..."
            : selectedTeamId
              ? "Join Team"
              : "Create Team"}
        </Button>

        {!selectedTeamId && !needsPin && !isNewTeam && (
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

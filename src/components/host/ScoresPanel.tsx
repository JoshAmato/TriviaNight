"use client";

import { useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";

interface ScoresPanelProps {
  gameId: string;
}

export function ScoresPanel({ gameId }: ScoresPanelProps) {
  const { getTeamScores, updateTeamScore } = useGameStore();
  const scores = getTeamScores();
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [delta, setDelta] = useState(0);

  const handleAdjust = async (teamId: string, amount: number) => {
    const res = await fetch(`/api/teams/${teamId}/score`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: amount, reason: "manual" }),
    });

    if (res.ok) {
      const data = await res.json();
      updateTeamScore(teamId, data.newScore);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {scores.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-dim">
          No teams yet
        </p>
      ) : (
        scores.map((team) => (
          <div
            key={team.teamId}
            className="rounded-lg border border-surface-border bg-surface-hi p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-sm font-semibold" style={{ color: team.color }}>
                  {team.name}
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-text">
                {team.score}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdjust(team.teamId, -1)}
              >
                -1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAdjust(team.teamId, 1)}
              >
                +1
              </Button>
              {adjusting === team.teamId ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={delta}
                    onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded border border-surface-border bg-surface px-2 py-1 text-sm text-text outline-none"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleAdjust(team.teamId, delta);
                      setAdjusting(null);
                      setDelta(0);
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdjusting(null);
                      setDelta(0);
                    }}
                  >
                    &times;
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdjusting(team.teamId)}
                >
                  +/-
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

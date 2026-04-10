"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useTimer } from "@/hooks/useTimer";
import { Button } from "@/components/ui/Button";
import { Timer } from "@/components/ui/Timer";
import type { GameEvent } from "@/types/realtime";
import type { GamePhase } from "@/types/game";

interface ControlsPanelProps {
  gameId: string;
  send: (event: GameEvent) => Promise<void>;
}

export function ControlsPanel({ gameId, send }: ControlsPanelProps) {
  const store = useGameStore();
  const {
    phase,
    currentRound,
    currentQuestion,
    rounds,
    timerRemaining,
    timerRunning,
    hideScoreboard,
    scoreboardOverride,
  } = store;

  const [endConfirm, setEndConfirm] = useState(false);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const updatePhase = useCallback(
    async (newPhase: GamePhase, extra: Record<string, unknown> = {}) => {
      const body = { phase: newPhase, ...extra };
      const res = await fetch(`/api/games/${gameId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        store.setGameState(data);
        await send({ type: "STATE_UPDATE", payload: data });
      }
    },
    [gameId, send, store]
  );

  const handleTimerExpired = useCallback(async () => {
    if (!currentRound) return;

    if (currentRound.round_type === "speed") {
      // Speed round: auto-reveal then advance
      await updatePhase("answerReveal");
      setTimeout(async () => {
        const currentIdx = currentRound.questions.findIndex(
          (rq) => rq.id === currentQuestion?.id
        );
        const nextQ = currentRound.questions[currentIdx + 1];
        if (nextQ) {
          await updatePhase("question", {
            current_question_id: nextQ.id,
            timer_remaining: currentRound.timer_seconds,
            timer_running: true,
          });
          timer.start(currentRound.timer_seconds);
        } else {
          await updatePhase("scoreboard");
        }
      }, 2000);
    } else {
      // Standard: just stop timer, host decides next step
    }
  }, [currentRound, currentQuestion]);

  const timer = useTimer({ send, onExpired: handleTimerExpired });

  // ─── Primary action based on phase ───
  const handlePrimaryAction = async () => {
    switch (phase) {
      case "lobby": {
        // Start first round
        const firstRound = rounds[0];
        if (!firstRound) return;
        await updatePhase("roundIntro", {
          current_round_id: firstRound.id,
        });
        break;
      }

      case "roundIntro": {
        if (!currentRound) return;
        if (currentRound.round_type === "break") {
          await updatePhase("break", {
            timer_remaining: currentRound.timer_seconds,
            timer_running: true,
          });
          timer.start(currentRound.timer_seconds);
        } else if (currentRound.round_type === "final") {
          await updatePhase("wagerWait");
        } else {
          const firstQ = currentRound.questions[0];
          if (!firstQ) return;
          await updatePhase("question", {
            current_question_id: firstQ.id,
            timer_remaining: currentRound.timer_seconds,
            timer_running: true,
          });
          timer.start(currentRound.timer_seconds);
        }
        break;
      }

      case "wagerWait": {
        // Start the final question
        if (!currentRound) return;
        // Auto-set wagers for non-submitters
        await fetch(`/api/games/${gameId}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const firstQ = currentRound.questions[0];
        if (!firstQ) return;
        await updatePhase("question", {
          current_question_id: firstQ.id,
          timer_remaining: currentRound.timer_seconds,
          timer_running: true,
        });
        timer.start(currentRound.timer_seconds);
        break;
      }

      case "question": {
        // Reveal answer
        timer.pause();
        await updatePhase("answerReveal");
        break;
      }

      case "answerReveal": {
        if (!currentRound) return;
        // Check if there are more questions
        const currentIdx = currentRound.questions.findIndex(
          (rq) => rq.id === currentQuestion?.id
        );
        const nextQ = currentRound.questions[currentIdx + 1];

        if (nextQ && currentRound.reveal_mode === "per-question") {
          // Next question
          await updatePhase("question", {
            current_question_id: nextQ.id,
            timer_remaining: currentRound.timer_seconds,
            timer_running: true,
          });
          timer.start(currentRound.timer_seconds);
        } else {
          // End of round → scoreboard
          await updatePhase("scoreboard");
        }
        break;
      }

      case "scoreboard": {
        // Move to next round or game over
        const currentRoundIdx = rounds.findIndex(
          (r) => r.id === currentRound?.id
        );
        const nextRound = rounds[currentRoundIdx + 1];

        if (nextRound) {
          await updatePhase("roundIntro", {
            current_round_id: nextRound.id,
            current_question_id: null,
          });
        } else {
          // No more rounds → game over
          await updatePhase("gameOver");
        }
        break;
      }

      case "break": {
        // End break, move to next round
        timer.pause();
        const currentRoundIdx = rounds.findIndex(
          (r) => r.id === currentRound?.id
        );
        const nextRound = rounds[currentRoundIdx + 1];
        if (nextRound) {
          await updatePhase("roundIntro", {
            current_round_id: nextRound.id,
            current_question_id: null,
          });
        }
        break;
      }
    }
  };

  const primaryActionLabel = () => {
    switch (phase) {
      case "lobby":
        return "Start Game";
      case "roundIntro":
        return currentRound?.round_type === "break"
          ? "Start Break"
          : currentRound?.round_type === "final"
            ? "Open Wagers"
            : "Start Round";
      case "wagerWait":
        return "Start Final Question";
      case "question":
        return "Reveal Answer";
      case "answerReveal":
        return "Continue";
      case "scoreboard":
        return rounds.findIndex((r) => r.id === currentRound?.id) ===
          rounds.length - 1
          ? "End Game"
          : "Next Round";
      case "break":
        return "End Break";
      default:
        return "Next";
    }
  };

  // ─── Scoreboard toggle ───
  const handleScoreboardToggle = async () => {
    const prevPhase = phase;
    if (phase === "scoreboard") {
      // Return to previous phase
      if (store.prevPhase) {
        await updatePhase(store.prevPhase as GamePhase, { scoreboard_override: false });
      }
    } else {
      await updatePhase("scoreboard", { prev_phase: prevPhase, scoreboard_override: true });
    }
  };

  // ─── Sponsor splash ───
  const handleSponsorSplash = async () => {
    const sponsor = store.sponsors[0];
    if (!sponsor) return;
    await send({
      type: "SPONSOR_SPLASH",
      payload: {
        sponsorId: sponsor.id,
        name: sponsor.name,
        logoUrl: sponsor.logo_url,
      },
    });
  };

  // ─── End game ───
  const handleEndGame = async () => {
    if (!endConfirm) {
      setEndConfirm(true);
      const t = setTimeout(() => setEndConfirm(false), 5000);
      setUndoTimer(t);
      return;
    }
    if (undoTimer) clearTimeout(undoTimer);
    setEndConfirm(false);
    await fetch(`/api/games/${gameId}/end`, { method: "POST" });
    store.setPhase("gameOver");
    await send({
      type: "GAME_OVER",
      payload: { finalStandings: store.getTeamScores() },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Timer display */}
      {timerRemaining !== null && phase === "question" && (
        <div className="flex justify-center">
          <Timer
            remaining={timerRemaining}
            total={currentRound?.timer_seconds ?? 30}
            running={timerRunning}
            size="md"
          />
        </div>
      )}

      {/* Primary action */}
      {phase !== "gameOver" && (
        <Button size="lg" onClick={handlePrimaryAction}>
          {primaryActionLabel()}
        </Button>
      )}

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleScoreboardToggle}
        >
          {phase === "scoreboard" ? "Back" : "Scoreboard"}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSponsorSplash}>
          Sponsor
        </Button>
      </div>

      {/* Scoreboard visibility */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hideScoreboard}
          onChange={async (e) => {
            await fetch(`/api/games/${gameId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hide_scoreboard: e.target.checked }),
            });
            store.setGameData({ ...store, hideScoreboard: e.target.checked } as Parameters<typeof store.setGameData>[0]);
          }}
          className="accent-accent"
        />
        <span className="text-text-mid">Hide Scoreboard</span>
      </label>

      {/* End game */}
      {phase !== "gameOver" && (
        <div className="mt-4 border-t border-surface-border pt-4">
          <Button
            variant={endConfirm ? "danger" : "ghost"}
            size="sm"
            onClick={handleEndGame}
            className="w-full"
          >
            {endConfirm ? "Confirm End Game (tap again)" : "End Game"}
          </Button>
        </div>
      )}
    </div>
  );
}

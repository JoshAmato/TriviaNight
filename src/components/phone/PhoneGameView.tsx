"use client";

import { useState, useCallback, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useGameState } from "@/hooks/useGameState";
import { Button } from "@/components/ui/Button";
import { Timer } from "@/components/ui/Timer";
import type { Team } from "@/types/game";

interface PhoneGameViewProps {
  gameId: string;
  roomCode: string;
  team: Team;
  isCaptain: boolean;
}

function getDeviceId(): string {
  return localStorage.getItem("triviaDeviceId") ?? "";
}

export function PhoneGameView({
  gameId,
  roomCode,
  team,
  isCaptain,
}: PhoneGameViewProps) {
  const store = useGameStore();
  const {
    phase,
    currentRound,
    currentQuestion,
    timerRemaining,
    timerRunning,
    teams,
    hideScoreboard,
    scoreboardOverride,
    gameTitle,
  } = store;

  useGameState({ gameId, roomCode, enabled: true });

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(1);
  const [wagerLocked, setWagerLocked] = useState(false);

  // Reset answer state when question changes
  useEffect(() => {
    setSelectedChoice(null);
    setAnswerText("");
    setSubmitted(false);
  }, [currentQuestion?.id]);

  // Reset wager when round changes
  useEffect(() => {
    setWagerLocked(false);
    setWagerAmount(1);
  }, [currentRound?.id]);

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || !isCaptain) return;
    const text =
      currentQuestion.question.answer_type === "mc"
        ? selectedChoice
        : answerText;
    if (!text) return;

    const res = await fetch(`/api/teams/${team.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer_text: text,
        round_question_id: currentQuestion.id,
        device_id: getDeviceId(),
      }),
    });

    if (res.ok) setSubmitted(true);
  }, [currentQuestion, selectedChoice, answerText, team.id, isCaptain]);

  const submitWager = useCallback(async () => {
    if (!currentRound || !isCaptain) return;
    const res = await fetch(`/api/teams/${team.id}/wager`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wager_amount: wagerAmount,
        round_id: currentRound.id,
        device_id: getDeviceId(),
      }),
    });
    if (res.ok) setWagerLocked(true);
  }, [currentRound, wagerAmount, team.id, isCaptain]);

  const teamScore = teams.find((t) => t.id === team.id)?.score ?? 0;
  const maxWager = Math.max(1, teamScore);

  const scores = [...teams].sort((a, b) => b.score - a.score);
  const myRank = scores.findIndex((t) => t.id === team.id) + 1;

  // ─── Render based on phase ───
  switch (phase) {
    case "lobby":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <div
            className="rounded-xl px-6 py-3"
            style={{
              backgroundColor: `${team.color}20`,
              border: `2px solid ${team.color}`,
            }}
          >
            <p className="text-center text-lg font-bold" style={{ color: team.color }}>
              {team.name}
            </p>
          </div>
          <p className="text-text-mid">Waiting for the host to start...</p>
          <p className="text-sm text-text-dim">
            {isCaptain ? "You are the captain" : "Viewer mode"}
          </p>
        </div>
      );

    case "roundIntro":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-text-mid">
            Next Up
          </p>
          <h1 className="font-display text-3xl text-text">
            {currentRound?.name}
          </h1>
          {currentRound && currentRound.round_type !== "break" && (
            <p className="text-text-dim">
              {currentRound.questions.length} questions &middot;{" "}
              {currentRound.timer_seconds}s each
            </p>
          )}
          {!hideScoreboard && scores.length > 0 && (
            <div className="mt-4 w-full max-w-sm">
              {scores.slice(0, 5).map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between py-1.5 text-sm ${t.id === team.id ? "font-bold" : ""}`}
                >
                  <span style={{ color: t.color }}>
                    {i + 1}. {t.name}
                  </span>
                  <span className="font-mono text-text-mid">{t.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "wagerWait":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <h1 className="font-display text-2xl text-accent">Place Your Wager</h1>
          <p className="text-text-mid">
            Your score: <span className="font-mono font-bold">{teamScore}</span>
          </p>

          {wagerLocked ? (
            <div className="rounded-xl bg-correct/10 px-8 py-4 text-center">
              <p className="text-lg font-bold text-correct">
                Wager locked: {wagerAmount}
              </p>
            </div>
          ) : isCaptain ? (
            <div className="flex w-full max-w-sm flex-col gap-4">
              <input
                type="range"
                min={1}
                max={maxWager}
                value={wagerAmount}
                onChange={(e) => setWagerAmount(parseInt(e.target.value, 10))}
                className="w-full accent-accent"
              />
              <p className="text-center font-mono text-4xl font-bold text-text">
                {wagerAmount}
              </p>
              <Button size="lg" onClick={submitWager}>
                Lock Wager
              </Button>
            </div>
          ) : (
            <p className="text-text-dim">Waiting for captain...</p>
          )}
        </div>
      );

    case "question": {
      if (!currentQuestion) return null;
      const question = currentQuestion.question;
      const timerExpired = timerRemaining !== null && timerRemaining <= 0;

      if (timerExpired && !submitted) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-4xl">&#x1F622;</p>
            <p className="text-lg text-text-mid">No Answer Submitted</p>
            <p className="text-sm text-text-dim">Time ran out!</p>
          </div>
        );
      }

      if (submitted) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-4xl">&#x2705;</p>
            <p className="text-lg text-correct">Answer Submitted!</p>
            <p className="text-sm text-text-dim">
              Waiting for the host to reveal...
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-1 flex-col gap-4 px-4 py-6">
          {timerRemaining !== null && (
            <div className="flex justify-center">
              <Timer
                remaining={timerRemaining}
                total={currentRound?.timer_seconds ?? 30}
                running={timerRunning}
                size="sm"
              />
            </div>
          )}

          <p className="text-center text-lg font-semibold text-text">
            {question.text}
          </p>

          {question.image_url && (
            <img
              src={question.image_url}
              alt="Question"
              className="mx-auto max-h-40 rounded-lg object-contain"
            />
          )}

          {question.answer_type === "mc" && question.choices ? (
            <div className="flex flex-col gap-2">
              {question.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => isCaptain && setSelectedChoice(choice)}
                  className={`rounded-lg border-2 p-4 text-left text-lg font-semibold transition-all ${
                    selectedChoice === choice
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-surface-border text-text"
                  } ${!isCaptain ? "opacity-60" : ""}`}
                >
                  <span className="mr-2 text-text-mid">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {choice}
                </button>
              ))}
              {isCaptain && selectedChoice && (
                <Button size="lg" onClick={submitAnswer} className="mt-2">
                  Submit Answer
                </Button>
              )}
            </div>
          ) : (
            isCaptain && (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="rounded-lg border border-surface-border bg-surface px-4 py-3 text-lg text-text outline-none focus:border-accent"
                  onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                />
                <Button
                  size="lg"
                  onClick={submitAnswer}
                  disabled={!answerText.trim()}
                >
                  Submit Answer
                </Button>
              </div>
            )
          )}

          {!isCaptain && (
            <p className="text-center text-sm text-text-dim">
              Only the captain can submit answers
            </p>
          )}
        </div>
      );
    }

    case "answerReveal": {
      if (!currentQuestion) return null;
      const question = currentQuestion.question;

      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-text-mid">{question.text}</p>
          <div className="rounded-xl bg-correct/10 px-8 py-4">
            <p className="text-sm font-bold uppercase text-correct">Answer</p>
            <p className="font-display text-3xl text-correct">
              {question.answer}
            </p>
          </div>
        </div>
      );
    }

    case "scoreboard": {
      if (hideScoreboard && !scoreboardOverride) {
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <p className="text-4xl">&#x1F92B;</p>
            <p className="text-lg text-text-mid">Scores Hidden</p>
          </div>
        );
      }

      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <h2 className="font-display text-2xl text-accent">Scoreboard</h2>
          <div className="w-full max-w-sm">
            {scores.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between border-b border-surface-border py-2 ${t.id === team.id ? "font-bold" : ""}`}
              >
                <span style={{ color: t.color }}>
                  {i + 1}. {t.name}
                </span>
                <span className="font-mono text-text">{t.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-text-mid">
            You are #{myRank} with {teamScore} points
          </p>
        </div>
      );
    }

    case "break":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-4xl">&#x2615;</p>
          <h1 className="font-display text-2xl text-text">Halftime Break</h1>
          {timerRemaining !== null && timerRemaining > 0 && (
            <Timer
              remaining={timerRemaining}
              total={currentRound?.timer_seconds ?? 600}
              size="md"
            />
          )}
          <p className="text-text-dim">Grab a drink!</p>
        </div>
      );

    case "gameOver":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl text-accent">Game Over!</h1>
          <p className="text-text-mid">{gameTitle}</p>
          <div className="w-full max-w-sm">
            {scores.slice(0, 3).map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between py-2 text-lg ${t.id === team.id ? "font-bold" : ""}`}
              >
                <span style={{ color: t.color }}>
                  {["&#x1F947;", "&#x1F948;", "&#x1F949;"][i]} {t.name}
                </span>
                <span className="font-mono text-text">{t.score}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-lg" style={{ color: team.color }}>
            You finished #{myRank} with {teamScore} points
          </p>
        </div>
      );

    default:
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-mid">Waiting...</p>
        </div>
      );
  }
}

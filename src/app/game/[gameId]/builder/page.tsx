"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoundList, type RoundItem } from "@/components/builder/RoundList";
import { RoundDetail, type RoundData } from "@/components/builder/RoundDetail";
import { QuestionBankPanel } from "@/components/builder/QuestionBankPanel";
import { DEFAULT_TIMERS } from "@/lib/constants";
import type { Question, RoundType, Game, Sponsor } from "@/types/game";

interface GameData extends Game {
  rounds: Array<{
    id: string;
    name: string;
    round_type: RoundType;
    sort_order: number;
    timer_seconds: number;
    reveal_mode: "per-question" | "end-of-round";
    questions: Array<{
      id: string;
      round_id: string;
      question_id: string;
      sort_order: number;
      question: Question;
    }>;
  }>;
  sponsors: Sponsor[];
}

export default function GameBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const supabase = createClient();

  const [game, setGame] = useState<GameData | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Game settings state
  const [gameName, setGameName] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [hideScoreboard, setHideScoreboard] = useState(false);

  const fetchGame = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {
      setError("Failed to load game");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setGame(data);
    setGameName(data.name);
    setGameTitle(data.game_title || "");
    setHideScoreboard(data.hide_scoreboard);
    if (data.rounds.length > 0 && !selectedRoundId) {
      setSelectedRoundId(data.rounds[0].id);
    }
    setLoading(false);
  }, [gameId, selectedRoundId]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const selectedRound = game?.rounds.find((r) => r.id === selectedRoundId);

  // Question IDs already in the selected round
  const usedQuestionIds = new Set(
    selectedRound?.questions.map((rq) => rq.question_id) ?? []
  );

  // ─── Round operations ───
  const handleAddRound = async () => {
    if (!game) return;
    const sortOrder = game.rounds.length;
    const { data, error } = await supabase
      .from("rounds")
      .insert({
        game_id: gameId,
        name: `Round ${sortOrder + 1}`,
        round_type: "standard" as RoundType,
        sort_order: sortOrder,
        timer_seconds: DEFAULT_TIMERS.standard,
        reveal_mode: "per-question",
      })
      .select()
      .single();

    if (error || !data) {
      setError("Failed to add round");
      return;
    }

    const newRound = { ...data, questions: [] };
    setGame({ ...game, rounds: [...game.rounds, newRound] });
    setSelectedRoundId(data.id);
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!game) return;
    const { error } = await supabase.from("rounds").delete().eq("id", roundId);
    if (error) {
      setError("Failed to delete round");
      return;
    }
    const updated = game.rounds.filter((r) => r.id !== roundId);
    // Reorder
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].sort_order !== i) {
        await supabase
          .from("rounds")
          .update({ sort_order: i })
          .eq("id", updated[i].id);
        updated[i] = { ...updated[i], sort_order: i };
      }
    }
    setGame({ ...game, rounds: updated });
    if (selectedRoundId === roundId) {
      setSelectedRoundId(updated[0]?.id ?? null);
    }
  };

  const handleReorderRounds = async (activeId: string, overId: string) => {
    if (!game) return;
    const oldIndex = game.rounds.findIndex((r) => r.id === activeId);
    const newIndex = game.rounds.findIndex((r) => r.id === overId);
    const reordered = arrayMove(game.rounds, oldIndex, newIndex);

    // Update sort_order
    const updated = reordered.map((r, i) => ({ ...r, sort_order: i }));
    setGame({ ...game, rounds: updated });

    for (const round of updated) {
      await supabase
        .from("rounds")
        .update({ sort_order: round.sort_order })
        .eq("id", round.id);
    }
  };

  // ─── Round detail updates ───
  const handleUpdateRound = async (updates: Partial<RoundData>) => {
    if (!game || !selectedRoundId) return;
    const roundIndex = game.rounds.findIndex((r) => r.id === selectedRoundId);
    if (roundIndex === -1) return;

    // Separate questions from other updates — questions are managed separately
    const { questions: _ignoreQuestions, ...roundUpdates } = updates;
    const updatedRound = { ...game.rounds[roundIndex], ...roundUpdates };
    const updatedRounds = [...game.rounds];
    updatedRounds[roundIndex] = updatedRound;
    setGame({ ...game, rounds: updatedRounds });

    if (Object.keys(roundUpdates).length > 0) {
      await supabase
        .from("rounds")
        .update(roundUpdates)
        .eq("id", selectedRoundId);
    }
  };

  // ─── Question operations on round ───
  const handleAddQuestion = async (question: Question) => {
    if (!game || !selectedRoundId || !selectedRound) return;

    // Speed round: warn about non-MC
    if (
      selectedRound.round_type === "speed" &&
      question.answer_type !== "mc"
    ) {
      setError(
        "Speed rounds only support multiple choice questions. Change the round type or pick an MC question."
      );
      return;
    }

    const sortOrder = selectedRound.questions.length;
    const { data, error } = await supabase
      .from("round_questions")
      .insert({
        round_id: selectedRoundId,
        question_id: question.id,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error || !data) {
      setError("Failed to add question");
      return;
    }

    const newRQ = { ...data, question };
    const roundIndex = game.rounds.findIndex((r) => r.id === selectedRoundId);
    const updatedRound = {
      ...game.rounds[roundIndex],
      questions: [...game.rounds[roundIndex].questions, newRQ],
    };
    const updatedRounds = [...game.rounds];
    updatedRounds[roundIndex] = updatedRound;
    setGame({ ...game, rounds: updatedRounds });
    setError(null);
  };

  const handleRemoveQuestion = async (roundQuestionId: string) => {
    if (!game || !selectedRoundId) return;
    await supabase
      .from("round_questions")
      .delete()
      .eq("id", roundQuestionId);

    const roundIndex = game.rounds.findIndex((r) => r.id === selectedRoundId);
    const updatedQuestions = game.rounds[roundIndex].questions.filter(
      (rq) => rq.id !== roundQuestionId
    );
    // Reorder
    for (let i = 0; i < updatedQuestions.length; i++) {
      if (updatedQuestions[i].sort_order !== i) {
        await supabase
          .from("round_questions")
          .update({ sort_order: i })
          .eq("id", updatedQuestions[i].id);
        updatedQuestions[i] = { ...updatedQuestions[i], sort_order: i };
      }
    }

    const updatedRound = {
      ...game.rounds[roundIndex],
      questions: updatedQuestions,
    };
    const updatedRounds = [...game.rounds];
    updatedRounds[roundIndex] = updatedRound;
    setGame({ ...game, rounds: updatedRounds });
  };

  const handleReorderQuestions = async (activeId: string, overId: string) => {
    if (!game || !selectedRoundId) return;
    const roundIndex = game.rounds.findIndex((r) => r.id === selectedRoundId);
    const questions = game.rounds[roundIndex].questions;

    const oldIndex = questions.findIndex((rq) => rq.id === activeId);
    const newIndex = questions.findIndex((rq) => rq.id === overId);
    const reordered = arrayMove(questions, oldIndex, newIndex).map((rq, i) => ({
      ...rq,
      sort_order: i,
    }));

    const updatedRound = { ...game.rounds[roundIndex], questions: reordered };
    const updatedRounds = [...game.rounds];
    updatedRounds[roundIndex] = updatedRound;
    setGame({ ...game, rounds: updatedRounds });

    for (const rq of reordered) {
      await supabase
        .from("round_questions")
        .update({ sort_order: rq.sort_order })
        .eq("id", rq.id);
    }
  };

  // ─── Game settings ───
  const handleSaveSettings = async () => {
    setSaving(true);
    const res = await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: gameName,
        game_title: gameTitle || null,
        hide_scoreboard: hideScoreboard,
      }),
    });
    if (!res.ok) setError("Failed to save settings");
    setSaving(false);
  };

  // ─── Clone game ───
  const handleClone = async () => {
    if (!game) return;

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${game.name} (copy)`,
        game_title: game.game_title,
        hide_scoreboard: game.hide_scoreboard,
      }),
    });
    if (!res.ok) {
      setError("Failed to clone game");
      return;
    }
    const newGame = await res.json();

    // Copy rounds and round_questions
    for (const round of game.rounds) {
      const { data: newRound } = await supabase
        .from("rounds")
        .insert({
          game_id: newGame.id,
          name: round.name,
          round_type: round.round_type,
          sort_order: round.sort_order,
          timer_seconds: round.timer_seconds,
          reveal_mode: round.reveal_mode,
        })
        .select()
        .single();

      if (newRound && round.questions.length > 0) {
        await supabase.from("round_questions").insert(
          round.questions.map((rq) => ({
            round_id: newRound.id,
            question_id: rq.question_id,
            sort_order: rq.sort_order,
          }))
        );
      }
    }

    router.push(`/game/${newGame.id}/builder`);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-mid">Loading game...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-danger">Game not found</p>
      </div>
    );
  }

  const roundItems: RoundItem[] = game.rounds.map((r) => ({
    id: r.id,
    name: r.name,
    round_type: r.round_type,
    questionCount: r.questions.length,
  }));

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-surface-border bg-surface px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-text-mid hover:text-text"
          >
            &larr; Dashboard
          </button>
          <h1 className="font-semibold text-text">{game.name}</h1>
          <span className="rounded-md bg-surface-hi px-2 py-0.5 text-xs font-bold uppercase text-accent">
            {game.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleClone}>
            Clone
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          {game.status === "draft" && (
            <Button
              size="sm"
              onClick={() => router.push(`/game/${gameId}/live`)}
            >
              Go Live
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 px-6 py-2 text-sm text-danger">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-text-mid hover:text-text"
          >
            &times;
          </button>
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Round list */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-surface-border bg-surface p-4">
          <RoundList
            rounds={roundItems}
            selectedId={selectedRoundId}
            onSelect={setSelectedRoundId}
            onReorder={handleReorderRounds}
            onAdd={handleAddRound}
            onDelete={handleDeleteRound}
          />

          {/* Game settings below rounds */}
          <div className="mt-6 border-t border-surface-border pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-mid">
              Game Settings
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-dim">Game Name</span>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="rounded-md border border-surface-border bg-surface-hi px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-dim">
                  Title Override
                </span>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Uses default from branding"
                  className="rounded-md border border-surface-border bg-surface-hi px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hideScoreboard}
                  onChange={(e) => setHideScoreboard(e.target.checked)}
                  className="accent-accent"
                />
                <span className="text-xs text-text-mid">Hide Scoreboard</span>
              </label>
            </div>
          </div>
        </div>

        {/* Center: Round detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedRound ? (
            <RoundDetail
              round={{
                ...selectedRound,
                questions: selectedRound.questions.map((rq) => ({
                  id: rq.id,
                  sort_order: rq.sort_order,
                  question: rq.question,
                })),
              }}
              onUpdate={handleUpdateRound}
              onRemoveQuestion={handleRemoveQuestion}
              onReorderQuestions={handleReorderQuestions}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-text-dim">
                {game.rounds.length === 0
                  ? "Add a round to get started"
                  : "Select a round"}
              </p>
            </div>
          )}
        </div>

        {/* Right: Question bank */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-surface-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-mid">
            Question Bank
          </h3>
          {selectedRound && selectedRound.round_type !== "break" ? (
            <QuestionBankPanel
              compact
              onSelect={handleAddQuestion}
              excludeIds={usedQuestionIds}
            />
          ) : (
            <p className="py-4 text-center text-sm text-text-dim">
              {selectedRound?.round_type === "break"
                ? "Break rounds don't have questions"
                : "Select a round to add questions"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useTeamAnswers } from "@/hooks/useTeamAnswers";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { normalize } from "@/lib/grading";

export function AnswersPanel() {
  const { currentQuestion, teams, phase, gameId } = useGameStore();
  const { answers, loading, refetch } = useTeamAnswers({
    gameId,
    roundQuestionId: currentQuestion?.id ?? null,
    enabled: phase === "question" || phase === "answerReveal",
  });

  const handleGrade = useCallback(
    async (answerText: string, isCorrect: boolean) => {
      if (!currentQuestion || !gameId) return;

      await fetch(`/api/games/${gameId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round_question_id: currentQuestion.id,
          answer_text: answerText,
          is_correct: isCorrect,
          question_points: currentQuestion.question.points,
        }),
      });

      refetch();
    },
    [currentQuestion, gameId, refetch]
  );

  if (!currentQuestion) {
    return (
      <p className="py-4 text-center text-sm text-text-dim">
        No active question
      </p>
    );
  }

  const question = currentQuestion.question;
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Group answers by normalized text
  const groups = new Map<
    string,
    { original: string; answers: typeof answers; isCorrect: boolean | null }
  >();
  for (const ans of answers) {
    const key = normalize(ans.answer_text);
    if (!groups.has(key)) {
      groups.set(key, { original: ans.answer_text, answers: [], isCorrect: ans.is_correct });
    }
    groups.get(key)!.answers.push(ans);
    // If any in group is graded, use that status
    if (ans.is_correct !== null) {
      groups.get(key)!.isCorrect = ans.is_correct;
    }
  }

  const submittedCount = answers.length;
  const totalTeams = teams.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-mid">
          {submittedCount} / {totalTeams} submitted
        </span>
        {loading && <span className="text-text-dim">Refreshing...</span>}
      </div>

      {/* Question context */}
      <div className="rounded-lg bg-surface-hi p-3">
        <p className="text-sm text-text">{question.text}</p>
        <p className="mt-1 text-xs text-correct">Answer: {question.answer}</p>
      </div>

      {/* Answer groups */}
      {groups.size === 0 ? (
        <p className="py-4 text-center text-sm text-text-dim">
          No answers yet
        </p>
      ) : (
        Array.from(groups.entries()).map(([key, group]) => (
          <div
            key={key}
            className={`rounded-lg border p-3 ${
              group.isCorrect === true
                ? "border-correct/30 bg-correct/5"
                : group.isCorrect === false
                  ? "border-danger/30 bg-danger/5"
                  : "border-surface-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-text">
                &ldquo;{group.original}&rdquo;
              </span>
              <Badge>{group.answers.length}x</Badge>
            </div>

            {/* Team names */}
            <div className="mt-2 flex flex-wrap gap-1">
              {group.answers.map((ans) => {
                const team = teamMap.get(ans.team_id);
                return (
                  <span
                    key={ans.id}
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${team?.color ?? "#666"}20`,
                      color: team?.color ?? "#666",
                    }}
                  >
                    {team?.name ?? "Unknown"}
                  </span>
                );
              })}
            </div>

            {/* Grading buttons */}
            {group.isCorrect === null && (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="correct"
                  size="sm"
                  onClick={() => handleGrade(group.original, true)}
                >
                  Correct
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleGrade(group.original, false)}
                >
                  Wrong
                </Button>
              </div>
            )}

            {group.isCorrect !== null && (
              <div className="mt-2">
                <Badge
                  color={group.isCorrect ? "#22c985" : "#ef4444"}
                  bg={group.isCorrect ? "#22c98520" : "#ef444420"}
                >
                  {group.isCorrect ? "Correct" : "Wrong"}
                </Badge>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

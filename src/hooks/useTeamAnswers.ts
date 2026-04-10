"use client";

import { useEffect, useState, useCallback } from "react";
import type { TeamAnswer } from "@/types/game";

interface UseTeamAnswersOptions {
  gameId: string | null;
  roundQuestionId: string | null;
  enabled?: boolean;
}

export function useTeamAnswers({ gameId, roundQuestionId, enabled = true }: UseTeamAnswersOptions) {
  const [answers, setAnswers] = useState<TeamAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnswers = useCallback(async () => {
    if (!roundQuestionId || !gameId) {
      setAnswers([]);
      return;
    }
    setLoading(true);
    const res = await fetch(
      `/api/games/${gameId}/answers?round_question_id=${roundQuestionId}`
    );
    if (res.ok) {
      const data = await res.json();
      setAnswers(data.answers ?? []);
    }
    setLoading(false);
  }, [roundQuestionId, gameId]);

  useEffect(() => {
    if (enabled && roundQuestionId && gameId) {
      fetchAnswers();
      const interval = setInterval(fetchAnswers, 3000);
      return () => clearInterval(interval);
    }
  }, [enabled, roundQuestionId, gameId, fetchAnswers]);

  return { answers, loading, refetch: fetchAnswers };
}

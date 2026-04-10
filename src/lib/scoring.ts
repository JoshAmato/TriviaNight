import { gradeAnswer } from "./grading";
import type { TeamAnswer, RoundType } from "@/types/game";

export interface ScoreResult {
  pointsEarned: number;
  isCorrect: boolean;
}

/**
 * Score a standard/picture/speed round answer.
 * Correct = question points, wrong = 0 (no deductions).
 */
export function scoreAnswer(
  answer: TeamAnswer,
  correctAnswer: string,
  questionPoints: number,
  roundType: RoundType
): ScoreResult {
  const isCorrect = gradeAnswer(
    answer.answer_text,
    correctAnswer,
    roundType === "speed" ? "mc" : undefined
  );

  return {
    isCorrect,
    pointsEarned: isCorrect ? questionPoints : 0,
  };
}

/**
 * Score a final question answer.
 * Correct = +wager, wrong = -wager.
 */
export function scoreFinalAnswer(
  answer: TeamAnswer,
  correctAnswer: string,
  wagerAmount: number
): ScoreResult {
  const isCorrect = gradeAnswer(answer.answer_text, correctAnswer);

  return {
    isCorrect,
    pointsEarned: isCorrect ? wagerAmount : -wagerAmount,
  };
}

/**
 * Determine the tiebreaker winner (closest to the correct number).
 */
export function scoreTiebreaker(
  answers: { teamId: string; answer: number }[],
  correctAnswer: number
): string {
  return answers.sort(
    (a, b) =>
      Math.abs(a.answer - correctAnswer) - Math.abs(b.answer - correctAnswer)
  )[0].teamId;
}

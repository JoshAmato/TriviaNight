"use client";

import { useGameStore } from "@/stores/gameStore";
import { Timer } from "@/components/ui/Timer";

export function QuestionSlide() {
  const { currentQuestion, currentRound, timerRemaining, timerRunning, rounds, currentRoundId } =
    useGameStore();

  if (!currentQuestion || !currentRound) return null;

  const question = currentQuestion.question;
  const questionIndex = currentRound.questions.findIndex(
    (rq) => rq.id === currentQuestion.id
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-16">
      {/* Question number */}
      <p className="text-lg text-text-mid">
        Question {questionIndex + 1} of {currentRound.questions.length}
      </p>

      {/* Timer */}
      {timerRemaining !== null && (
        <Timer
          remaining={timerRemaining}
          total={currentRound.timer_seconds}
          running={timerRunning}
          size="lg"
        />
      )}

      {/* Question image */}
      {question.image_url && (
        <div className="max-h-[300px] overflow-hidden rounded-xl">
          <img
            src={question.image_url}
            alt="Question"
            className="max-h-[300px] object-contain"
          />
        </div>
      )}

      {/* Question text */}
      <h1 className="max-w-4xl text-center font-display text-5xl leading-tight text-text">
        {question.text}
      </h1>

      {/* MC choices */}
      {question.answer_type === "mc" && question.choices && (
        <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
          {question.choices.map((choice, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-border bg-surface p-6 text-center text-2xl font-bold text-text"
            >
              <span className="mr-3 text-accent">
                {String.fromCharCode(65 + i)}.
              </span>
              {choice}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

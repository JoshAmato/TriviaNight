"use client";

import { useGameStore } from "@/stores/gameStore";

export function AnswerRevealSlide() {
  const { currentQuestion, currentRound } = useGameStore();

  if (!currentQuestion || !currentRound) return null;

  const question = currentQuestion.question;
  const questionIndex = currentRound.questions.findIndex(
    (rq) => rq.id === currentQuestion.id
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-16">
      <p className="text-lg text-text-mid">
        Question {questionIndex + 1} of {currentRound.questions.length}
      </p>

      <h2 className="max-w-4xl text-center text-3xl text-text-mid">
        {question.text}
      </h2>

      {/* MC with correct highlighted */}
      {question.answer_type === "mc" && question.choices && (
        <div className="grid w-full max-w-3xl grid-cols-2 gap-4">
          {question.choices.map((choice, i) => {
            const isCorrect =
              choice.toLowerCase() === question.answer.toLowerCase();
            return (
              <div
                key={i}
                className={`rounded-xl border-2 p-6 text-center text-2xl font-bold ${
                  isCorrect
                    ? "border-correct bg-correct/10 text-correct"
                    : "border-surface-border bg-surface text-text-dim"
                }`}
              >
                <span className="mr-3">
                  {String.fromCharCode(65 + i)}.
                </span>
                {choice}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer */}
      <div className="rounded-2xl bg-correct/10 px-12 py-8 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-correct">
          Answer
        </p>
        <p className="font-display text-6xl text-correct">{question.answer}</p>
      </div>

      {question.points > 0 && (
        <p className="text-xl text-text-dim">
          {question.points} point{question.points !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

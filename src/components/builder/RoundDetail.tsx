"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RoundTypeSelector } from "./RoundTypeSelector";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_TIMERS } from "@/lib/constants";
import type { RoundType, RevealMode, Question } from "@/types/game";

export interface RoundData {
  id: string;
  name: string;
  round_type: RoundType;
  timer_seconds: number;
  reveal_mode: RevealMode;
  questions: { id: string; sort_order: number; question: Question; round_id?: string; question_id?: string }[];
}

interface RoundDetailProps {
  round: RoundData;
  onUpdate: (updates: Partial<RoundData>) => void;
  onRemoveQuestion: (roundQuestionId: string) => void;
  onReorderQuestions: (activeId: string, overId: string) => void;
}

function SortableQuestion({
  rq,
  index,
  onRemove,
  roundType,
}: {
  rq: { id: string; question: Question };
  index: number;
  onRemove: () => void;
  roundType: RoundType;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: rq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-lg border border-surface-border bg-surface-hi p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab text-text-dim hover:text-text-mid"
      >
        &#x2630;
      </button>
      <span className="mt-0.5 font-mono text-xs text-text-dim">
        {index + 1}.
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text">{rq.question.text}</p>
        <div className="mt-1 flex gap-2">
          <Badge>
            {rq.question.answer_type === "mc" ? "MC" : "Free Text"}
          </Badge>
          {roundType === "speed" && rq.question.answer_type !== "mc" && (
            <Badge color="#ef4444" bg="#ef444420">
              Not MC
            </Badge>
          )}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-sm text-text-dim hover:text-danger"
      >
        &times;
      </button>
    </div>
  );
}

export function RoundDetail({
  round,
  onUpdate,
  onRemoveQuestion,
  onReorderQuestions,
}: RoundDetailProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderQuestions(active.id as string, over.id as string);
    }
  };

  const handleTypeChange = (newType: RoundType) => {
    onUpdate({
      round_type: newType,
      timer_seconds: DEFAULT_TIMERS[newType],
    });
  };

  const isBreak = round.round_type === "break";
  const hasNonMCInSpeed =
    round.round_type === "speed" &&
    round.questions.some((rq) => rq.question.answer_type !== "mc");

  return (
    <div className="flex flex-col gap-5">
      {/* Round Name */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-mid">Round Name</span>
        <input
          type="text"
          value={round.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
        />
      </label>

      {/* Round Type */}
      <div>
        <span className="mb-2 block text-sm font-medium text-text-mid">
          Round Type
        </span>
        <RoundTypeSelector
          value={round.round_type}
          onChange={handleTypeChange}
        />
      </div>

      {/* Timer */}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text-mid">
          Timer (seconds)
        </span>
        <input
          type="number"
          min={5}
          value={round.timer_seconds}
          onChange={(e) =>
            onUpdate({ timer_seconds: parseInt(e.target.value, 10) || 30 })
          }
          className="w-32 rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none focus:border-accent"
        />
      </label>

      {/* Reveal Mode (not for break/tiebreaker) */}
      {!isBreak && round.round_type !== "tiebreaker" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text-mid">
            Answer Reveal
          </span>
          <select
            value={round.reveal_mode}
            onChange={(e) =>
              onUpdate({ reveal_mode: e.target.value as RevealMode })
            }
            className="w-64 rounded-lg border border-surface-border bg-surface-hi px-4 py-2.5 text-text outline-none"
          >
            <option value="per-question">After each question</option>
            <option value="end-of-round">At end of round</option>
          </select>
        </label>
      )}

      {/* Speed round warning */}
      {hasNonMCInSpeed && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          Speed rounds require multiple choice questions only. Remove free-text
          questions or change the round type.
        </div>
      )}

      {/* Questions (not for break) */}
      {!isBreak && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-mid">
            Questions ({round.questions.length})
          </h3>

          {round.questions.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-dim">
              No questions added. Select questions from the bank on the right.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={round.questions.map((rq) => rq.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {round.questions.map((rq, idx) => (
                    <SortableQuestion
                      key={rq.id}
                      rq={rq}
                      index={idx}
                      roundType={round.round_type}
                      onRemove={() => onRemoveQuestion(rq.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

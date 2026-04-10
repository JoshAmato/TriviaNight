"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RoundType } from "@/types/game";
import { ROUND_TYPE_INFO } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

const ROUND_TYPE_ICONS: Record<RoundType, string> = {
  standard: "\uD83D\uDCCB",
  picture: "\uD83D\uDDBC\uFE0F",
  speed: "\u26A1",
  final: "\uD83C\uDFC6",
  break: "\u2615",
  tiebreaker: "\uD83C\uDFAF",
};

export interface RoundItem {
  id: string;
  name: string;
  round_type: RoundType;
  questionCount: number;
}

interface RoundListProps {
  rounds: RoundItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function SortableRound({
  round,
  isSelected,
  onSelect,
  onDelete,
}: {
  round: RoundItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: round.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
        isSelected
          ? "border-accent bg-accent/10"
          : "border-surface-border hover:border-text-dim"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-text-dim hover:text-text-mid"
        title="Drag to reorder"
      >
        &#x2630;
      </button>
      <button onClick={onSelect} className="flex min-w-0 flex-1 flex-col items-start text-left">
        <div className="flex items-center gap-2">
          <span>{ROUND_TYPE_ICONS[round.round_type]}</span>
          <span className="truncate text-sm font-semibold text-text">
            {round.name}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge>{ROUND_TYPE_INFO[round.round_type].label}</Badge>
          {round.round_type !== "break" && (
            <span className="text-xs text-text-dim">
              {round.questionCount} Q
            </span>
          )}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-sm text-text-dim hover:text-danger"
        title="Delete round"
      >
        &times;
      </button>
    </div>
  );
}

export function RoundList({
  rounds,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
}: RoundListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-mid">
          Rounds
        </h3>
        <button
          onClick={onAdd}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-bg hover:bg-accent-dim"
        >
          + Add
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rounds.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {rounds.map((round) => (
            <SortableRound
              key={round.id}
              round={round}
              isSelected={round.id === selectedId}
              onSelect={() => onSelect(round.id)}
              onDelete={() => onDelete(round.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {rounds.length === 0 && (
        <p className="py-6 text-center text-sm text-text-dim">
          No rounds yet. Click + Add to start.
        </p>
      )}
    </div>
  );
}

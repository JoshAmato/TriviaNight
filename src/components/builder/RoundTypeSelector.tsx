"use client";

import type { RoundType } from "@/types/game";
import { ROUND_TYPE_INFO } from "@/lib/constants";

const ROUND_TYPE_ICONS: Record<RoundType, string> = {
  standard: "\uD83D\uDCCB",
  picture: "\uD83D\uDDBC\uFE0F",
  speed: "\u26A1",
  final: "\uD83C\uDFC6",
  break: "\u2615",
  tiebreaker: "\uD83C\uDFAF",
};

interface RoundTypeSelectorProps {
  value: RoundType;
  onChange: (type: RoundType) => void;
}

export function RoundTypeSelector({ value, onChange }: RoundTypeSelectorProps) {
  const types: RoundType[] = [
    "standard",
    "picture",
    "speed",
    "final",
    "break",
    "tiebreaker",
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
            value === type
              ? "bg-accent text-bg"
              : "bg-surface-hi text-text-mid hover:text-text"
          }`}
        >
          <span className="mr-1">{ROUND_TYPE_ICONS[type]}</span>
          {ROUND_TYPE_INFO[type].label}
        </button>
      ))}
    </div>
  );
}

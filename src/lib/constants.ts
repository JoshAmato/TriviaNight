import type { RoundType } from "@/types/game";

// Team colors — assigned in order as teams join
export const TEAM_COLORS = [
  "#e8b931", // accent/gold
  "#60a5fa", // blue
  "#22c985", // correct/green
  "#ef4444", // danger/red
  "#a78bfa", // purple
  "#f472b6", // pink
  "#fb923c", // orange
  "#2dd4bf", // teal
];

// Default timer durations per round type (in seconds)
export const DEFAULT_TIMERS: Record<RoundType, number> = {
  standard: 30,
  picture: 30,
  speed: 10,
  final: 90,
  break: 600,
  tiebreaker: 60,
};

// Round type display info
export const ROUND_TYPE_INFO: Record<
  RoundType,
  { label: string; icon: string }
> = {
  standard: { label: "Standard", icon: "clipboard-list" },
  picture: { label: "Picture", icon: "image" },
  speed: { label: "Speed", icon: "zap" },
  final: { label: "Final", icon: "trophy" },
  break: { label: "Break", icon: "coffee" },
  tiebreaker: { label: "Tiebreaker", icon: "target" },
};

// Room code length
export const ROOM_CODE_LENGTH = 4;

// PIN length
export const PIN_LENGTH = 4;

// Image upload limits (in bytes)
export const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_QUESTION_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Accepted image formats
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

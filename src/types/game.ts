export type GamePhase =
  | "lobby"
  | "roundIntro"
  | "wagerWait"
  | "question"
  | "answerReveal"
  | "scoreboard"
  | "break"
  | "sponsorSplash"
  | "gameOver";

export type RoundType =
  | "standard"
  | "picture"
  | "speed"
  | "final"
  | "break"
  | "tiebreaker";

export type AnswerType = "free-text" | "mc";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type GameStatus = "draft" | "live" | "completed";

export type RevealMode = "per-question" | "end-of-round";

export interface Host {
  id: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  default_game_title: string;
  open_join: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  host_id: string;
  name: string;
  logo_url: string;
  created_at: string;
}

export interface Question {
  id: string;
  host_id: string;
  text: string;
  answer: string;
  answer_type: AnswerType;
  choices: string[] | null;
  image_url: string | null;
  category: string;
  difficulty: Difficulty;
  points: number;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  host_id: string;
  name: string;
  room_code: string;
  status: GameStatus;
  hide_scoreboard: boolean;
  game_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  game_id: string;
  name: string;
  round_type: RoundType;
  sort_order: number;
  timer_seconds: number;
  reveal_mode: RevealMode;
  created_at: string;
}

export interface RoundQuestion {
  id: string;
  round_id: string;
  question_id: string;
  sort_order: number;
}

export interface Team {
  id: string;
  game_id: string;
  name: string;
  color: string;
  pin_hash: string | null;
  join_order: number;
  score: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  device_id: string;
  is_captain: boolean;
  connected_at: string;
}

export interface TeamAnswer {
  id: string;
  team_id: string;
  round_question_id: string;
  answer_text: string;
  is_correct: boolean | null;
  points_earned: number;
  submitted_at: string;
}

export interface TeamWager {
  id: string;
  team_id: string;
  round_id: string;
  wager_amount: number;
}

export interface GameState {
  id: string;
  game_id: string;
  current_round_id: string | null;
  current_question_id: string | null;
  phase: GamePhase;
  prev_phase: string | null;
  timer_remaining: number | null;
  timer_running: boolean;
  scoreboard_override: boolean;
  updated_at: string;
}

export interface ScoreAdjustment {
  id: string;
  team_id: string;
  delta: number;
  reason: string | null;
  created_at: string;
}

// Composite types for API responses
export interface RoundWithQuestions extends Round {
  questions: (RoundQuestion & { question: Question })[];
}

export interface GameWithRounds extends Game {
  rounds: RoundWithQuestions[];
  sponsors: Sponsor[];
}

export interface TeamScore {
  teamId: string;
  name: string;
  color: string;
  score: number;
  rank: number;
}

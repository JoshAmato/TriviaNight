import type { GameState, TeamScore } from "./game";

// Host → All devices
export type GameEvent =
  | { type: "STATE_UPDATE"; payload: GameState }
  | { type: "TIMER_TICK"; payload: { remaining: number } }
  | {
      type: "ANSWER_REVEAL";
      payload: {
        questionId: string;
        answer: string;
        stats: AnswerStats;
      };
    }
  | {
      type: "SCOREBOARD";
      payload: { teams: TeamScore[]; override: boolean };
    }
  | {
      type: "SPONSOR_SPLASH";
      payload: { sponsorId: string; name: string; logoUrl: string };
    }
  | { type: "GAME_OVER"; payload: { finalStandings: TeamScore[] } };

// Team → Host only (via DB insert, not broadcast — answer content never broadcast)
export type TeamEvent =
  | {
      type: "ANSWER_SUBMITTED";
      payload: { teamId: string; questionId: string };
    }
  | { type: "WAGER_LOCKED"; payload: { teamId: string; roundId: string } };

export interface AnswerStats {
  totalTeams: number;
  correctCount: number;
  answerBreakdown: { answer: string; count: number; isCorrect: boolean }[];
}

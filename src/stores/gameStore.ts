import { create } from "zustand";
import type { GamePhase, Team, GameState, Round, RoundQuestion, Question, Sponsor } from "@/types/game";
import type { TeamScore } from "@/types/game";

interface GameStoreState {
  // Game state
  gameId: string | null;
  roomCode: string | null;
  phase: GamePhase;
  prevPhase: string | null;
  currentRoundId: string | null;
  currentQuestionId: string | null;
  timerRemaining: number | null;
  timerRunning: boolean;
  scoreboardOverride: boolean;
  hideScoreboard: boolean;

  // Game data
  teams: Team[];
  rounds: (Round & { questions: (RoundQuestion & { question: Question })[] })[];
  sponsors: Sponsor[];
  gameTitle: string;

  // Derived / cached
  currentRound: (Round & { questions: (RoundQuestion & { question: Question })[] }) | null;
  currentQuestion: (RoundQuestion & { question: Question }) | null;

  // Actions
  setGameData: (data: {
    gameId: string;
    roomCode: string;
    gameTitle: string;
    hideScoreboard: boolean;
    teams: Team[];
    rounds: (Round & { questions: (RoundQuestion & { question: Question })[] })[];
    sponsors: Sponsor[];
  }) => void;
  setGameState: (state: Partial<GameState>) => void;
  setPhase: (phase: GamePhase) => void;
  setTimer: (remaining: number | null, running?: boolean) => void;
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeamScore: (teamId: string, score: number) => void;
  setScoreboardOverride: (override: boolean) => void;
  getTeamScores: () => TeamScore[];
  reset: () => void;
}

const initialState = {
  gameId: null as string | null,
  roomCode: null as string | null,
  phase: "lobby" as GamePhase,
  prevPhase: null as string | null,
  currentRoundId: null as string | null,
  currentQuestionId: null as string | null,
  timerRemaining: null as number | null,
  timerRunning: false,
  scoreboardOverride: false,
  hideScoreboard: false,
  teams: [] as Team[],
  rounds: [] as (Round & { questions: (RoundQuestion & { question: Question })[] })[],
  sponsors: [] as Sponsor[],
  gameTitle: "Trivia Night",
  currentRound: null as (Round & { questions: (RoundQuestion & { question: Question })[] }) | null,
  currentQuestion: null as (RoundQuestion & { question: Question }) | null,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...initialState,

  setGameData: (data) => {
    set({
      gameId: data.gameId,
      roomCode: data.roomCode,
      gameTitle: data.gameTitle,
      hideScoreboard: data.hideScoreboard,
      teams: data.teams,
      rounds: data.rounds,
      sponsors: data.sponsors,
    });
  },

  setGameState: (state) => {
    const { rounds } = get();
    const updates: Partial<GameStoreState> = {};

    if (state.phase !== undefined) updates.phase = state.phase;
    if (state.prev_phase !== undefined) updates.prevPhase = state.prev_phase;
    if (state.current_round_id !== undefined) updates.currentRoundId = state.current_round_id;
    if (state.current_question_id !== undefined) updates.currentQuestionId = state.current_question_id;
    if (state.timer_remaining !== undefined) updates.timerRemaining = state.timer_remaining;
    if (state.timer_running !== undefined) updates.timerRunning = state.timer_running;
    if (state.scoreboard_override !== undefined) updates.scoreboardOverride = state.scoreboard_override;

    // Derive current round and question
    if (updates.currentRoundId !== undefined) {
      updates.currentRound = rounds.find((r) => r.id === updates.currentRoundId) ?? null;
    }
    if (updates.currentQuestionId !== undefined) {
      const round = updates.currentRound ?? get().currentRound;
      updates.currentQuestion = round?.questions.find((rq) => rq.id === updates.currentQuestionId) ?? null;
    }

    set(updates);
  },

  setPhase: (phase) => set({ phase }),

  setTimer: (remaining, running) =>
    set({
      timerRemaining: remaining,
      ...(running !== undefined ? { timerRunning: running } : {}),
    }),

  setTeams: (teams) => set({ teams }),

  addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),

  updateTeamScore: (teamId, score) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === teamId ? { ...t, score } : t)),
    })),

  setScoreboardOverride: (override) => set({ scoreboardOverride: override }),

  getTeamScores: () => {
    const { teams } = get();
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    return sorted.map((t, i) => ({
      teamId: t.id,
      name: t.name,
      color: t.color,
      score: t.score,
      rank: i + 1,
    }));
  },

  reset: () => set(initialState),
}));

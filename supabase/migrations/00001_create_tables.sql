-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════
-- HOSTS (extends Supabase auth.users)
-- ═══════════════════════════════════════════
CREATE TABLE hosts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#e8b931',
  accent_color TEXT DEFAULT '#a78bfa',
  default_game_title TEXT DEFAULT 'Trivia Night',
  open_join BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- SPONSORS
-- ═══════════════════════════════════════════
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_sponsors_host ON sponsors(host_id);

-- ═══════════════════════════════════════════
-- QUESTION BANK
-- ═══════════════════════════════════════════
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  answer TEXT NOT NULL,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('free-text', 'mc')),
  choices JSONB,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  points INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_questions_host ON questions(host_id);
CREATE INDEX idx_questions_category ON questions(host_id, category);

-- ═══════════════════════════════════════════
-- GAMES
-- ═══════════════════════════════════════════
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'completed')),
  hide_scoreboard BOOLEAN NOT NULL DEFAULT FALSE,
  game_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_games_host ON games(host_id);
CREATE UNIQUE INDEX idx_games_room_code ON games(room_code) WHERE status = 'live';

-- ═══════════════════════════════════════════
-- GAME SPONSORS (many-to-many)
-- ═══════════════════════════════════════════
CREATE TABLE game_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  UNIQUE(game_id, sponsor_id)
);

-- ═══════════════════════════════════════════
-- ROUNDS
-- ═══════════════════════════════════════════
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  round_type TEXT NOT NULL CHECK (round_type IN ('standard', 'picture', 'speed', 'final', 'break', 'tiebreaker')),
  sort_order INTEGER NOT NULL,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  reveal_mode TEXT NOT NULL DEFAULT 'per-question' CHECK (reveal_mode IN ('per-question', 'end-of-round')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_rounds_game ON rounds(game_id, sort_order);

-- ═══════════════════════════════════════════
-- ROUND QUESTIONS
-- ═══════════════════════════════════════════
CREATE TABLE round_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  UNIQUE(round_id, question_id)
);
CREATE INDEX idx_round_questions ON round_questions(round_id, sort_order);

-- ═══════════════════════════════════════════
-- TEAMS (per game)
-- ═══════════════════════════════════════════
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  pin_hash TEXT,
  join_order INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_teams_game ON teams(game_id);
CREATE UNIQUE INDEX idx_teams_name ON teams(game_id, name);

-- ═══════════════════════════════════════════
-- TEAM MEMBERS (multiple devices per team)
-- ═══════════════════════════════════════════
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  connected_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_team_members_team ON team_members(team_id);

-- ═══════════════════════════════════════════
-- TEAM ANSWERS
-- ═══════════════════════════════════════════
CREATE TABLE team_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_question_id UUID NOT NULL REFERENCES round_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, round_question_id)
);
CREATE INDEX idx_team_answers_rq ON team_answers(round_question_id);

-- ═══════════════════════════════════════════
-- TEAM WAGERS (Final Question only)
-- ═══════════════════════════════════════════
CREATE TABLE team_wagers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  wager_amount INTEGER NOT NULL CHECK (wager_amount >= 1),
  UNIQUE(team_id, round_id)
);

-- ═══════════════════════════════════════════
-- GAME STATE (singleton per game — drives real-time sync)
-- ═══════════════════════════════════════════
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  current_round_id UUID REFERENCES rounds(id),
  current_question_id UUID REFERENCES round_questions(id),
  phase TEXT NOT NULL DEFAULT 'lobby'
    CHECK (phase IN ('lobby', 'roundIntro', 'wagerWait', 'question', 'answerReveal', 'scoreboard', 'break', 'sponsorSplash', 'gameOver')),
  prev_phase TEXT,
  timer_remaining INTEGER,
  timer_running BOOLEAN DEFAULT FALSE,
  scoreboard_override BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- SCORE ADJUSTMENTS (audit log)
-- ═══════════════════════════════════════════
CREATE TABLE score_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_score_adj_team ON score_adjustments(team_id);

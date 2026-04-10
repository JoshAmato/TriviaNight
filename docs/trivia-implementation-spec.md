# Trivia Night App — Implementation Spec
## For Claude Code / VS Code Agent

---

## 0. INSTRUCTIONS FOR THE IMPLEMENTING AGENT

You are building a production-grade trivia night hosting app. Before writing any code, read this entire document. Every section contains decisions that affect other sections.

**Reference files:**
- `trivia-night-spec.md` — Feature spec with all business rules, UX flows, and decisions log (23 decisions)
- `trivia-prototype.jsx` — Interactive React prototype showing exact visual design, component layout, color system, typography, and UX flow for every screen

**Design mandate:** The prototype IS the design spec. Match its visual language exactly: dark theme, color tokens, font choices (Outfit, Archivo Black, IBM Plex Mono), spacing, border radii, badge styles, card styles, and layout structure. Do not invent a new design system. Extract the design tokens from the prototype's `C` object and `FONTS`/`DISPLAY_FONT`/`MONO` constants.

**Code quality rules:**
- DRY: Extract shared components, hooks, and utilities. Never copy-paste UI patterns.
- Shared components: Button, Badge, Card, SponsorBar, Timer, TeamColor, ScoreRow — define once, import everywhere.
- Custom hooks: `useTimer`, `useGameState`, `useRealtimeChannel`, `useAuth` — encapsulate logic, expose clean interfaces.
- Type everything with TypeScript. No `any` types except where explicitly unavoidable.
- Use Zod for runtime validation of all API inputs and realtime payloads.
- Server components by default. Client components only when state/interactivity is needed.
- All database queries go through server actions or API routes — never call Supabase directly from client components.
- Environment variables: never hardcode URLs, keys, or secrets.

---

## 1. TECH STACK

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 15.x | SSR, routing, API routes, server actions |
| Language | TypeScript | 5.x | Type safety everywhere |
| Styling | Tailwind CSS | 4.x | Utility-first CSS, custom theme from prototype tokens |
| Database | Supabase (PostgreSQL) | — | Auth, DB, Realtime, Storage |
| Real-time | Supabase Realtime | — | WebSocket channels for game state sync |
| File storage | Supabase Storage | — | Logos, sponsor images, question images |
| Hosting | Vercel | — | Edge deployment, pairs with Next.js |
| Validation | Zod | 3.x | Runtime schema validation |
| State mgmt | Zustand | 5.x | Client-side game state store |
| Fonts | Google Fonts | — | Outfit, Archivo Black, IBM Plex Mono |

---

## 2. INFRASTRUCTURE SETUP

### 2.1 Supabase Project

Create a new Supabase project. Configure:

**Auth:**
- Enable email/password auth only (no OAuth providers for V1)
- Disable email confirmation for development; enable for production
- Set minimum password length: 8 characters

**Storage buckets:**
Create three public buckets:
```
host-logos      — Host branding logos (public read, authenticated write)
sponsor-logos   — Sponsor logo images (public read, authenticated write)
question-images — Question attachment images (public read, authenticated write)
```

Storage policies for each bucket:
```sql
-- Public read
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'host-logos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Authenticated users can update/delete their own files
CREATE POLICY "Auth manage" ON storage.objects FOR UPDATE
  USING (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'host-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```
Repeat the same pattern for `sponsor-logos` and `question-images`.

**Realtime:**
- Enable Realtime on the `game_state` table (for broadcasting game state changes)
- Also use Supabase Realtime Broadcast channels for ephemeral events (timer ticks, answer submissions)

### 2.2 Vercel Project

- Connect to GitHub repo
- Set environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...  (server-side only, never exposed to client)
  NEXT_PUBLIC_APP_URL=https://trivia.app (or localhost:3000 for dev)
  ```

### 2.3 Local Development

```bash
npx create-next-app@latest trivia-night --typescript --tailwind --app --src-dir
cd trivia-night
npm install @supabase/supabase-js @supabase/ssr zustand zod
npm install -D supabase
npx supabase init
npx supabase link --project-ref <your-project-ref>
```

---

## 3. DATABASE SCHEMA

Run these migrations in order. Every table uses UUIDs as primary keys and has created_at/updated_at timestamps.

### 3.1 Core Tables

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════
-- HOSTS (extends Supabase auth.users)
-- ═══════════════════════════════════════════
CREATE TABLE hosts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  logo_url TEXT,                          -- Supabase Storage path
  primary_color TEXT DEFAULT '#e8b931',   -- Hex color
  accent_color TEXT DEFAULT '#a78bfa',    -- Hex color
  default_game_title TEXT DEFAULT 'Trivia Night',
  open_join BOOLEAN DEFAULT FALSE,       -- When true, team PIN not required
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
  logo_url TEXT NOT NULL,                 -- Supabase Storage path
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
  choices JSONB,                          -- Array of strings for MC, e.g., ["A","B","C","D"]
  image_url TEXT,                         -- Supabase Storage path, nullable
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
  room_code TEXT NOT NULL UNIQUE,         -- 4-char uppercase code
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'completed')),
  hide_scoreboard BOOLEAN NOT NULL DEFAULT FALSE,
  game_title TEXT,                        -- Override for this game, falls back to host default
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
-- ROUND QUESTIONS (ordered link between rounds and questions)
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
  color TEXT NOT NULL,                    -- Hex color assigned on join
  pin_hash TEXT,                          -- bcrypt hash of 4-digit PIN (null if open_join)
  join_order INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,       -- Denormalized running total
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
  device_id TEXT NOT NULL,                -- Generated UUID stored in localStorage
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
  is_correct BOOLEAN,                     -- null = not yet graded
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
  prev_phase TEXT,                        -- For scoreboard return
  timer_remaining INTEGER,
  timer_running BOOLEAN DEFAULT FALSE,
  scoreboard_override BOOLEAN DEFAULT FALSE, -- Host manual push
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════
-- SCORE ADJUSTMENTS (audit log)
-- ═══════════════════════════════════════════
CREATE TABLE score_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,                            -- 'manual', 'answer_graded', 'wager_result'
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_score_adj_team ON score_adjustments(team_id);
```

### 3.2 Row Level Security (RLS)

Enable RLS on all tables. Policies:

```sql
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_adjustments ENABLE ROW LEVEL SECURITY;

-- HOST-OWNED TABLES: hosts, sponsors, questions, games, game_sponsors, rounds, round_questions
-- Pattern: host can CRUD their own data
CREATE POLICY "host_own" ON hosts FOR ALL USING (id = auth.uid());
CREATE POLICY "host_own" ON sponsors FOR ALL USING (host_id = auth.uid());
CREATE POLICY "host_own" ON questions FOR ALL USING (host_id = auth.uid());
CREATE POLICY "host_own" ON games FOR ALL USING (host_id = auth.uid());
CREATE POLICY "host_own" ON game_sponsors FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));
CREATE POLICY "host_own" ON rounds FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));
CREATE POLICY "host_own" ON round_questions FOR ALL
  USING (round_id IN (SELECT r.id FROM rounds r JOIN games g ON r.game_id = g.id WHERE g.host_id = auth.uid()));

-- GAME-PARTICIPANT TABLES: teams, team_members, team_answers, team_wagers, game_state, score_adjustments
-- Pattern: public read for live games (players need to see state), host can write
CREATE POLICY "public_read_live" ON teams FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE status = 'live'));
CREATE POLICY "host_write" ON teams FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));
-- Anonymous insert for team creation (players aren't authenticated)
CREATE POLICY "anon_insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON team_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON team_wagers FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_live" ON game_state FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE status = 'live'));
CREATE POLICY "host_write" ON game_state FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));

CREATE POLICY "public_read_live" ON team_answers FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "public_read_live" ON team_wagers FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "public_read_live" ON score_adjustments FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "host_write" ON score_adjustments FOR INSERT
  WITH CHECK (team_id IN (SELECT t.id FROM teams t JOIN games g ON t.game_id = g.id WHERE g.host_id = auth.uid()));
```

### 3.3 Database Functions

```sql
-- Generate unique 4-char room code
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM games WHERE room_code = code AND status = 'live') INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update team score (called after grading)
CREATE OR REPLACE FUNCTION update_team_score(p_team_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE teams SET score = COALESCE((
    SELECT SUM(points_earned) FROM team_answers WHERE team_id = p_team_id AND is_correct IS NOT NULL
  ), 0) + COALESCE((
    SELECT SUM(delta) FROM score_adjustments WHERE team_id = p_team_id
  ), 0)
  WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql;

-- Increment question usage count
CREATE OR REPLACE FUNCTION increment_question_usage(p_question_ids UUID[]) RETURNS VOID AS $$
BEGIN
  UPDATE questions
  SET used_count = used_count + 1, last_used_at = now()
  WHERE id = ANY(p_question_ids);
END;
$$ LANGUAGE plpgsql;

-- Auto-set wager for teams that didn't submit (Final Question)
CREATE OR REPLACE FUNCTION auto_set_wagers(p_round_id UUID, p_game_id UUID) RETURNS VOID AS $$
BEGIN
  INSERT INTO team_wagers (team_id, round_id, wager_amount)
  SELECT t.id, p_round_id, 1
  FROM teams t
  WHERE t.game_id = p_game_id
    AND t.id NOT IN (SELECT team_id FROM team_wagers WHERE round_id = p_round_id);
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger
CREATE OR REPLACE FUNCTION trigger_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON game_state FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
```

---

## 4. PROJECT STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                    — Root layout, font loading, Supabase provider
│   ├── page.tsx                      — Landing / login redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx                  — Host dashboard (past games, create new)
│   │   ├── branding/page.tsx         — Logo, colors, sponsors setup
│   │   └── questions/page.tsx        — Question bank CRUD
│   ├── game/
│   │   ├── [gameId]/
│   │   │   ├── builder/page.tsx      — Game builder (rounds, questions)
│   │   │   ├── live/page.tsx         — Host remote (phone controls)
│   │   │   └── projector/page.tsx    — Projector display (full-screen, no chrome)
│   ├── play/
│   │   └── [roomCode]/page.tsx       — Team phone join + play experience
│   └── api/
│       ├── games/
│       │   ├── route.ts              — POST create game
│       │   └── [gameId]/
│       │       ├── route.ts          — GET/PATCH/DELETE game
│       │       ├── go-live/route.ts  — POST start game
│       │       ├── state/route.ts    — PATCH update game state
│       │       └── end/route.ts      — POST end game
│       ├── teams/
│       │   ├── join/route.ts         — POST join team (creates or joins existing)
│       │   └── [teamId]/
│       │       ├── answer/route.ts   — POST submit answer
│       │       ├── wager/route.ts    — POST submit wager
│       │       └── score/route.ts    — PATCH manual score adjust
│       └── questions/
│           ├── route.ts              — GET list / POST create
│           ├── [questionId]/route.ts — PATCH/DELETE
│           └── import/route.ts       — POST CSV bulk import
├── components/
│   ├── ui/                           — Shared primitives (extract from prototype)
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── TabBar.tsx
│   │   ├── Timer.tsx
│   │   └── SponsorBar.tsx
│   ├── projector/                    — Projector display screens
│   │   ├── LobbySlide.tsx
│   │   ├── RoundIntroSlide.tsx
│   │   ├── QuestionSlide.tsx
│   │   ├── AnswerRevealSlide.tsx
│   │   ├── ScoreboardSlide.tsx
│   │   ├── BreakSlide.tsx
│   │   ├── SponsorSplashSlide.tsx
│   │   ├── FinalRevealSlide.tsx
│   │   └── ProjectorOverlay.tsx
│   ├── host/                         — Host remote panels
│   │   ├── ControlsPanel.tsx
│   │   ├── ScoresPanel.tsx
│   │   ├── AnswersPanel.tsx
│   │   └── GameProgress.tsx
│   ├── phone/                        — Team phone screens
│   │   ├── JoinScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── RoundIntroScreen.tsx
│   │   ├── QuestionScreen.tsx
│   │   ├── WagerScreen.tsx
│   │   ├── BreakScreen.tsx
│   │   ├── ScoreboardScreen.tsx
│   │   └── GameOverScreen.tsx
│   └── builder/                      — Game builder components
│       ├── RoundList.tsx
│       ├── RoundDetail.tsx
│       ├── QuestionBankPanel.tsx
│       └── RoundTypeSelector.tsx
├── hooks/
│   ├── useAuth.ts                    — Supabase auth state
│   ├── useTimer.ts                   — Countdown timer (extract from prototype)
│   ├── useGameState.ts               — Subscribe to game_state changes via Realtime
│   ├── useTeamAnswers.ts             — Subscribe to team answer submissions
│   └── useRealtimeChannel.ts         — Generic Supabase Realtime channel wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 — Browser Supabase client
│   │   ├── server.ts                 — Server-side Supabase client (with service role)
│   │   └── middleware.ts             — Auth middleware for protected routes
│   ├── scoring.ts                    — Score calculation engine
│   ├── grading.ts                    — Answer matching / fuzzy grading
│   ├── room-codes.ts                 — Room code generation
│   └── constants.ts                  — Team colors, default timers, etc.
├── stores/
│   └── gameStore.ts                  — Zustand store for client-side game state
└── types/
    ├── database.ts                   — Generated Supabase types (npx supabase gen types)
    ├── game.ts                       — Game, Round, Question, Team interfaces
    └── realtime.ts                   — Realtime event payload types
```

---

## 5. REAL-TIME ARCHITECTURE

This is the most critical system. Every connected device must stay in sync.

### 5.1 Channel Structure

Each live game has ONE Supabase Realtime Broadcast channel:
```
channel: `game:${roomCode}`
```

### 5.2 Event Types

The host pushes state changes. All other devices listen.

```typescript
// Host → All devices
type GameEvent =
  | { type: 'STATE_UPDATE'; payload: GameState }      // Phase changes, current question, timer
  | { type: 'TIMER_TICK'; payload: { remaining: number } }  // Every second during countdown
  | { type: 'ANSWER_REVEAL'; payload: { questionId: string; answer: string; stats: AnswerStats } }
  | { type: 'SCOREBOARD'; payload: { teams: TeamScore[]; override: boolean } }
  | { type: 'SPONSOR_SPLASH'; payload: { sponsorId: string; name: string; logoUrl: string } }
  | { type: 'GAME_OVER'; payload: { finalStandings: TeamScore[] } }

// Team → Host only (via separate presence or DB insert)
type TeamEvent =
  | { type: 'ANSWER_SUBMITTED'; payload: { teamId: string; questionId: string } }
  | { type: 'WAGER_LOCKED'; payload: { teamId: string; roundId: string } }

// Answer content is stored in DB, not broadcast (prevents cheating via network inspection)
```

### 5.3 State Sync Flow

```
Host Remote (phone)
  │
  ├── User taps "Reveal Answer"
  ├── API call: PATCH /api/games/[gameId]/state  { phase: 'answerReveal' }
  ├── Server updates game_state table
  ├── Server broadcasts: { type: 'STATE_UPDATE', payload: newState }
  │
  ├──→ Projector (listening on channel)
  │    └── Receives STATE_UPDATE → re-renders current slide
  │
  └──→ Team phones (listening on channel)
       └── Receives STATE_UPDATE → shows answer + points earned
```

### 5.4 Timer Sync

The timer runs server-side to prevent drift:

```typescript
// Server action: startTimer(gameId, seconds)
// 1. Set game_state.timer_remaining = seconds, timer_running = true
// 2. Start server-side interval (or use Supabase Edge Function cron)
// 3. Every second: broadcast TIMER_TICK with remaining count
// 4. At 0: broadcast TIMER_TICK { remaining: 0 }, set timer_running = false
```

For V1, an acceptable simplification: run the timer on the host's device and broadcast ticks. This introduces slight drift but avoids server-side timer complexity. The host device is the source of truth.

### 5.5 Connection Recovery

When any device reconnects:
1. Fetch current `game_state` from DB via API
2. Fetch current teams, scores, and the current question
3. Re-subscribe to the Realtime channel
4. Render the correct screen based on the fetched state

Implement this in the `useGameState` hook with a `refetch` on channel reconnect.

---

## 6. FRONTEND SPECIFICATIONS

### 6.1 Tailwind Theme

Extract from the prototype's `C` object into `tailwind.config.ts`:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: '#08080f',
        surface: '#111119',
        'surface-hi': '#1a1a26',
        'surface-border': '#252536',
        accent: '#e8b931',
        'accent-dim': '#b8922a',
        'accent-glow': '#e8b93130',
        correct: '#22c985',
        danger: '#ef4444',
        purple: '#a78bfa',
        blue: '#60a5fa',
        pink: '#f472b6',
        orange: '#fb923c',
        teal: '#2dd4bf',
        text: '#f0f0f5',
        'text-mid': '#a0a0b8',
        'text-dim': '#65657a',
      },
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'sans-serif'],
        display: ['Archivo Black', 'Impact', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Courier New', 'monospace'],
      },
    },
  },
}
```

### 6.2 Page Routing & Layout

| Route | Purpose | Auth Required | Layout |
|-------|---------|---------------|--------|
| `/` | Landing → redirect to `/dashboard` if logged in | No | Marketing |
| `/login` | Email/password login | No | Auth |
| `/register` | Email/password register | No | Auth |
| `/dashboard` | Host home: past games, create new | Yes (host) | Dashboard |
| `/dashboard/branding` | Logo, colors, sponsors | Yes (host) | Dashboard |
| `/dashboard/questions` | Question bank CRUD | Yes (host) | Dashboard |
| `/game/[gameId]/builder` | Game builder | Yes (host) | Full-width |
| `/game/[gameId]/live` | Host remote controls | Yes (host) | Phone-optimized, no nav |
| `/game/[gameId]/projector` | Projector display | Yes (host) | Full-screen, no chrome |
| `/play/[roomCode]` | Team join + play | No (anonymous) | Phone-optimized, no nav |

### 6.3 Projector Page (`/game/[gameId]/projector`)

This page runs full-screen with NO browser chrome. It subscribes to the game's Realtime channel and renders the appropriate slide based on `game_state.phase`.

```typescript
// Pseudocode for projector page
const phase = useGameState(gameId).phase;

switch (phase) {
  case 'lobby':        return <LobbySlide />;
  case 'roundIntro':   return <RoundIntroSlide />;
  case 'question':     return <QuestionSlide />;
  case 'answerReveal': return <AnswerRevealSlide />;
  case 'scoreboard':   return <ScoreboardSlide />;
  case 'break':        return <BreakSlide />;
  case 'sponsorSplash':return <SponsorSplashSlide />;
  case 'gameOver':     return <FinalRevealSlide />;
}
```

Every slide includes `<SponsorBar />` at the bottom. The projector page also renders `<ProjectorOverlay />` when toggled (floating controls for when host is at the projector laptop).

### 6.4 Host Remote Page (`/game/[gameId]/live`)

Phone-optimized layout. Three tabs at the top: Controls, Scores, Answers.

The Controls tab contains the primary action button (context-sensitive based on phase), the scoreboard toggle, sponsor splash button, and game progress tracker. See the prototype's `HostRemoteView` component for exact layout.

All actions hit API routes which update `game_state` and trigger Realtime broadcasts.

### 6.5 Team Phone Page (`/play/[roomCode]`)

Anonymous page — no auth required. On first visit:
1. Generate a `deviceId` (UUID) and store in localStorage
2. Show join form: team name input
3. If team name exists in this game: prompt for PIN (unless `open_join` is true)
4. If team name is new: prompt to set a PIN, create team, assign as captain
5. After join: subscribe to game's Realtime channel and render based on phase

The phone page renders different screens based on `game_state.phase`, identical to the prototype's `TeamPhoneView` logic. Key behaviors:
- **MC submission**: tap to select (highlight), then tap "Submit Answer" to lock in
- **Timer expired**: show "No Answer Submitted 😢" if no answer was submitted before time ran out
- **Round transitions**: show round intro with next round details + leaderboard (respects `hide_scoreboard`)
- **Break**: show "Halftime Break" with timer, sponsor logo, and standings
- **Sponsor splash**: when host triggers, phone shows full-screen sponsor overlay
- **Scoreboard hidden**: when `hide_scoreboard` is true, show "🤫 Scores Hidden" instead of standings (unless host overrides or game is over)

---

## 7. SCORING ENGINE (`lib/scoring.ts`)

```typescript
interface ScoreResult {
  pointsEarned: number;
  isCorrect: boolean;
}

// Standard, Picture, Speed rounds
function scoreAnswer(answer: TeamAnswer, correctAnswer: string, questionPoints: number, roundType: string): ScoreResult {
  const isCorrect = gradeAnswer(answer.answer_text, correctAnswer, roundType === 'speed' ? 'mc' : undefined);
  return {
    isCorrect,
    pointsEarned: isCorrect ? questionPoints : 0,  // No deductions on standard rounds
  };
}

// Final Question
function scoreFinalAnswer(answer: TeamAnswer, correctAnswer: string, wagerAmount: number): ScoreResult {
  const isCorrect = gradeAnswer(answer.answer_text, correctAnswer);
  return {
    isCorrect,
    pointsEarned: isCorrect ? wagerAmount : -wagerAmount,  // +/- wager
  };
}

// Tiebreaker (closest number)
function scoreTiebreaker(answers: { teamId: string; answer: number }[], correctAnswer: number): string {
  return answers.sort((a, b) =>
    Math.abs(a.answer - correctAnswer) - Math.abs(b.answer - correctAnswer)
  )[0].teamId;
}
```

---

## 8. ANSWER GRADING (`lib/grading.ts`)

```typescript
// Fuzzy matching for free-text answers
function gradeAnswer(submitted: string, correct: string, forceType?: 'mc'): boolean {
  if (forceType === 'mc') return submitted.trim().toUpperCase() === correct.trim().toUpperCase();

  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ');         // Collapse whitespace

  const a = normalize(submitted);
  const b = normalize(correct);

  if (a === b) return true;

  // Common abbreviation handling
  // "Martin Luther King Jr" = "MLK Jr" = "mlk" = "martin luther king junior"
  // This is a suggestion match — the host makes the final call on free-text
  // Return true for exact/near matches, false otherwise
  // The host UI groups similar answers and lets host batch-approve

  return levenshteinDistance(a, b) <= Math.max(1, Math.floor(b.length * 0.15));
}

// Host sees all submitted answers grouped by similarity
// Host taps ✓ or ✗ per unique answer
// When host approves "MLK", all submissions normalized to "mlk" auto-approve
```

---

## 9. SPEED ROUND AUTO-ADVANCE

Speed rounds use a different flow than standard rounds:

```typescript
// In the host's timer management:
if (roundType === 'speed') {
  // When timer hits 0:
  // 1. Broadcast answerReveal with correct answer
  // 2. Auto-grade all MC submissions
  // 3. Wait 2 seconds
  // 4. If more questions remain: advance to next question, reset timer, broadcast STATE_UPDATE
  // 5. If no more questions: transition to scoreboard phase
  //
  // Host has an emergency "Skip" button that:
  //   - If answer not yet revealed: immediately reveals answer
  //   - If answer revealed: immediately advances to next question
}
```

---

## 10. IMAGE & FILE UPLOAD

### Upload Flow (Host)

All uploads go through Supabase Storage. The client uploads directly to Supabase using signed URLs.

```typescript
// 1. Client calls server action to get a signed upload URL
// 2. Client uploads file directly to Supabase Storage
// 3. Client sends the resulting public URL back to the server to save in DB

async function uploadImage(file: File, bucket: string, path: string): Promise<string> {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}
```

### Image Requirements

| Type | Bucket | Max Size | Formats | Recommended Dimensions |
|------|--------|----------|---------|----------------------|
| Host logo | `host-logos` | 2MB | PNG, SVG | 400×400px min, square |
| Sponsor logo | `sponsor-logos` | 2MB | PNG, SVG | 400×400px min, square |
| Question image | `question-images` | 5MB | PNG, JPG, WebP | 1200×800px min |

Path convention: `{hostId}/{uuid}.{ext}`

---

## 11. IMPLEMENTATION ORDER

Build in this sequence. Each phase should be deployable and testable independently.

### Phase 1: Foundation (Days 1-3)
1. Initialize Next.js project with TypeScript, Tailwind, Supabase
2. Run database migrations (all tables, RLS, functions)
3. Implement auth (register, login, logout, middleware)
4. Create the `hosts` record on registration (DB trigger or server action)
5. Build shared UI components: Button, Badge, Card, TabBar — extract directly from prototype
6. Set up Tailwind theme from prototype color tokens

### Phase 2: Dashboard & Content (Days 4-6)
7. Dashboard page: list past games, create new game button
8. Branding settings page: logo upload, color pickers, sponsor CRUD with logo upload
9. Question bank page: CRUD questions, category filter, search, bulk CSV import
10. Question bank must show usage count and last-used date

### Phase 3: Game Builder (Days 7-9)
11. Game builder page: create/edit games with rounds
12. Round CRUD: add/remove/reorder rounds, set type, timer, reveal mode
13. Question assignment: add questions from bank to rounds, reorder, create inline
14. Clone game functionality
15. Game settings: title, scoreboard visibility toggle, sponsor selection

### Phase 4: Live Game — Host & Projector (Days 10-14)
16. "Go Live" action: generate room code, set status to 'live', create game_state record
17. Projector page: all slide components, Realtime subscription, sponsor bar
18. Host remote page: three-tab layout (Controls, Scores, Answers), all phase-specific controls
19. Timer implementation (host-driven with broadcast)
20. Phase transition logic: lobby → roundIntro → question → answerReveal → scoreboard → next round
21. Speed round auto-advance logic
22. Final question wager flow
23. Tiebreaker flow
24. Sponsor splash (host trigger → projector + phone display)
25. Scoreboard visibility toggle with host override
26. End game confirmation with undo window
27. Post-game: save results, update question usage counts

### Phase 5: Team Phone Experience (Days 15-18)
28. Join page: room code entry, team name, PIN flow (create vs join existing)
29. Lobby screen: waiting for host
30. Round intro screen: next round info + leaderboard
31. Question screen: MC (select + submit) and free-text submission
32. Timer expired state: "No Answer Submitted 😢"
33. Answer reveal screen: correct/incorrect + points
34. Wager screen (Final Question): slider/input, lock wager
35. Break screen: timer, sponsor logo, standings
36. Scoreboard screen: respects hide setting
37. Game over screen: final standings
38. Sponsor splash overlay (pushed from host)
39. Connection recovery: refetch state on reconnect

### Phase 6: Answer Grading (Days 19-20)
40. MC auto-grading on submission
41. Free-text fuzzy matching and grouping
42. Host grading UI: approve/reject per unique answer, batch approve
43. Score calculation and team score update
44. Score adjustment audit log

### Phase 7: Polish & Testing (Days 21-25)
45. Responsive testing: projector (1080p+), host phone (375px+), team phone (320px+)
46. Load testing: simulate 15+ teams connecting simultaneously
47. Edge cases: late join, disconnect/reconnect, browser refresh, duplicate team names
48. Projector display: ensure all text is readable from 30+ feet at bar lighting
49. Performance: optimize Realtime subscription handling, minimize re-renders
50. Deploy to Vercel, test with real Supabase instance

---

## 12. TESTING STRATEGY

### Critical Paths to Test

1. **Full game flow**: lobby → 3 rounds (standard, speed, picture) → break → final question → game over
2. **Team join**: new team with PIN → second device joins same team as viewer
3. **Speed round**: auto-advance fires correctly, answers are auto-graded
4. **Final question**: wager submission, lock, auto-set for non-submitters, scoring (+/-)
5. **Scoreboard hide**: toggle on, verify projector and phones show hidden message, override works
6. **Connection recovery**: refresh projector mid-game, verify it resumes correctly
7. **Concurrent answers**: 10+ teams submitting answers simultaneously
8. **Sponsor splash**: triggers on projector AND all team phones simultaneously

### Device Testing Matrix

| Device | Screen | Test Focus |
|--------|--------|------------|
| Laptop (1920×1080) | Projector display | Readability, sponsor bar, animations |
| Laptop (1440×900) | Host dashboard, builder | Layout, drag-and-drop |
| iPhone SE (375×667) | Host remote | Thumb targets, tab switching |
| iPhone 14 (390×844) | Team phone | Join flow, answer submission |
| Android mid-range | Team phone | Performance, WebSocket stability |
| iPad | Host remote | Layout scaling |

---

## 13. CRITICAL IMPLEMENTATION NOTES

1. **Answer content NEVER goes through Realtime broadcast.** Teams submit answers via API (stored in DB). The host fetches answers from DB. This prevents teams from sniffing answers via WebSocket network inspection.

2. **The projector page must work without any user interaction after load.** It subscribes to Realtime and re-renders based on state changes. No clicks needed. The host drives everything from their phone.

3. **Room codes must be unique among LIVE games only.** A code can be reused once the previous game using it is completed. The unique index is conditional: `WHERE status = 'live'`.

4. **Team PINs are hashed.** Never store plaintext PINs. Use bcrypt. When a player enters a PIN to join an existing team, hash and compare.

5. **The `game_state` table is the single source of truth.** Every device reads from it (via Realtime subscription or API fetch). Only the host writes to it (via server actions). There is exactly one `game_state` row per game.

6. **Speed rounds are MC-only.** The game builder must enforce this: if a round's type is set to 'speed', only allow MC questions to be added. Show a warning if the host tries to add a free-text question.

7. **Sponsor logos must be served from Supabase Storage public URLs.** The prototype uses text placeholders (initials). In production, these are replaced with `<img>` tags pointing to the uploaded logo URLs. Always include the sponsor name as alt text and as a text fallback below the image.

8. **The `hide_scoreboard` setting is a game-level toggle but can be changed mid-game by the host.** The toggle lives in the Host Remote controls panel and updates the game record in real-time. All connected devices react to the change.

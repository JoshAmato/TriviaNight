# Trivia Night App — Feature Spec & UX Flows
## "C Lite" Scope

---

## 1. SYSTEM OVERVIEW

**Three-screen architecture:**
- **Projector Display** (TV/projector, full-screen) — what the audience sees. Runs as a standalone URL. Optional floating control overlay the host can toggle on/off (for when the host is at the projector laptop).
- **Host Remote** (host's phone or tablet) — builds games, controls pacing, grades answers, manages scoring. Designed mobile-first with large thumb-friendly buttons. Three panels: Controls (primary game flow), Scores (manual +/− per team), Answers (real-time submission feed with ✓/✗ grading).
- **Team View** (team phones) — teams join via room code, see questions, submit answers

The host remote and projector display connect to the same game session via room code. The host can control the game entirely from their phone while the projector runs unattended on a separate screen. For smaller setups, the projector view includes a toggleable floating control overlay so the host can drive the game from the same device.

---

## 2. QUESTION BANK & GAME BUILDER

### Question Bank (persistent library)
- Host creates questions over time, tagged by **category** (e.g., "Geography", "90s Movies", "Sports")
- Each question has:
  - Question text (required)
  - Answer (required)
  - Answer type: **free-text** or **multiple choice** (2-4 options)
  - Optional image attachment (for picture rounds or visual context)
  - Optional point value override (default: 1 pt)
  - Difficulty tag: Easy / Medium / Hard (for host reference only)
  - Category tag(s)
- Bulk import via **paste or CSV upload** (columns: question, answer, category, type)
- Search/filter library by category, type, difficulty
- **Usage tracking:** each question shows times used and date of last use (auto-updated when a game containing the question is played)
- Edit/delete questions anytime outside of a live game

### Game Builder
- A **Game** is a named event (e.g., "Tuesday Night Trivia - Week 12")
- A Game contains ordered **Rounds** (typically 4-7)
- Each Round has:
  - Name (e.g., "General Knowledge", "Picture Round")
  - **Round type:** Standard, Picture, Speed, Final, Break, or Tiebreaker
  - Questions pulled from the bank or created inline
  - Answer format override: free-text or multiple-choice (set per round or per question; speed rounds are MC-only)
  - **Reveal mode** per round: "after each question" or "at end of round"
- Host can **clone a past game** as a starting template
- Host can reorder rounds and questions via drag-and-drop
- **Scoreboard visibility:** per-game toggle — "Hide scoreboard until game end" (default: show). When enabled, scores are not displayed on projector or team phones between rounds. Host can manually override to push the scoreboard at any time from the Controls panel. Host always sees scores in their own Scores tab regardless of this setting.

---

## 3. ROUND TYPES — DETAILED MECHANICS

### Standard Q&A
- Host reveals one question at a time on projector
- Configurable timer per round (default: 30 seconds per question)
- Teams submit answers on phones
- Host advances to reveal answer, then next question
- Scoring: fixed points per question (default 1 pt, configurable)
- **Reveal mode** (per-round setting): "after each question" (default) or "at end of round"

### Picture Round
- Each question has one image displayed prominently on the projector and team phones
- Question text appears below/alongside the image (e.g., "Name this landmark")
- One image per question; for a "name 10 logos" round, create 10 separate questions each with one logo image
- Timer is configurable per round (default: 30 seconds per question, same as standard)
- Can also be used as a "table round" — host distributes at start and collects later
- **Reveal mode** (per-round setting): "after each question" or "at end of round" (default for picture rounds)

### Speed Round
- Rapid-fire questions, shorter timer (default: 10 seconds)
- **Auto-advances** to next question when timer expires (no host advance)
- Answer format should be **multiple-choice only** (auto-graded, since host can't grade free-text in 10 seconds)
- Projector shows question + countdown prominently with urgent visual treatment
- Points per question (default 1 pt)
- Reveal mode: always per-question (auto-revealed on advance)

### Final Question
- Single question, high stakes — always the last element of the game
- Host reveals **category** first on projector
- Teams wager any amount from **1** (minimum) up to their **current total score** (min 1 even if score is 0)
- Timer is longer (default: 60-90 seconds)
- Correct = add wagered points; Incorrect = subtract wagered points
- Teams can go negative (only possible scenario in the game)
- Teams that don't submit a wager before host locks are auto-set to 1
- Dramatic projector reveal sequence: category → wager phase → question → answer → final standings

### Break
- Inserted between rounds in the game builder (treated as a round-level block)
- Projector shows: countdown timer (configurable, default 10 min), game branding, sponsor logo rotation, and optionally the current scoreboard
- Team phones show: scoreboard + "Next round starts in..." countdown
- Host controls: start break, adjust timer, end break early
- Natural window for distributing picture round handouts

### Tiebreaker
- "Closest number" format (e.g., "How many miles from Seattle to Paris?")
- Host can trigger manually if teams are tied after the Final Question
- Single question; the team closest to the correct numerical answer wins
- Can be pre-loaded in the game builder as an optional last element, or pulled from the bank on the fly

---

## 4. BRANDING / CUSTOMIZATION

### Host Branding

**Setup flow:**
1. Navigate to Branding settings from the dashboard
2. Click the logo upload area to select or drag-and-drop a logo file
3. **Logo requirements:** PNG or SVG, recommended minimum 400×400px, transparent background preferred. Logo is displayed at various sizes across projector (80px on lobby) and phone (28px on bars), so must be legible at small scales.
4. Set primary and accent colors via color picker — these are applied globally to projector theme and team phone UI
5. Set a default game title (can be overridden per game in the Game Builder)
6. All branding settings persist at the account level and apply to every game unless overridden

- One **logo** per account (uploadable, replaceable anytime)
- **Primary color** and **accent color** (applied to projector theme and team UI)
- Custom **default game title** (e.g., "Brews & Brains Trivia") — overridable per game
- Logo appears on: projector welcome/lobby screen, team join screen, break screens, game over screen
- Future: multiple accounts per host (e.g., personal, insurance agency, Rotary) each with their own branding

### Sponsor Logos

**Setup flow:**
1. Navigate to Branding settings from the dashboard
2. Under "Sponsors," click "+ Add Sponsor"
3. Enter sponsor name and upload a logo image
4. **Logo requirements:** PNG or SVG, recommended minimum 400×400px, transparent background preferred. Logos are displayed at various sizes (40px–160px) so they must be legible at small scales. Square or roughly square aspect ratio works best.
5. Logos are saved to the host's persistent sponsor library and can be reused across games
6. Per game: in the Game Builder, host selects which sponsors from their library are active for that game

**Display placement — sponsors appear on ALL major screens:**
- Welcome/lobby screen (game start)
- Each question display (persistent sponsor bar at bottom with rotating logo + name)
- Answer reveal screens
- Scoreboard screens
- Break screens (sponsor logo displayed prominently alongside countdown timer)
- Game over / final standings screen
- Full-screen sponsor splash: host can trigger from Controls panel between rounds ("This round brought to you by..."). Displays on both projector and team phones. Auto-dismisses after ~6 seconds or on host advance.
- **Team phone placement:** small sponsor bar on scoreboard/waiting screens; full sponsor card during breaks; full-screen during sponsor splash

**Sponsor bar behavior:**
- Rotates through active sponsors on ~10s cycle
- Shows sponsor logo (image) + name
- Bottom or lower-corner strip on projector, subtle enough to not distract from questions

- Sponsors are display-only at launch (no click-through URLs or analytics)

---

## 5. HOST EXPERIENCE — SCREEN BY SCREEN

### 5A. Home / Dashboard
- List of past games (with date, team count, winner)
- "Create New Game" button
- "Question Bank" button
- Branding settings access

### 5B. Game Builder
- Left panel: round list (reorderable)
- Main panel: selected round's questions
- Right panel: question bank search (drag questions into rounds)
- Round type selector per round
- "Preview on Projector" button
- "Go Live" button → starts the game, generates room code

### 5C. Live Host Controls
Once live, the host sees a compact, mobile-first control panel with three tabs: Controls, Scores, Answers.

**Top bar:**
- Room code (large, shareable)
- Team count (joined)
- Current round / question indicator

**Controls tab:**
- Current question text + answer (host cheat sheet)
- Answer format indicator (free-text or MC)
- Timer controls: start / pause / reset / skip
- Primary action button (context-sensitive): "Begin Round", "Reveal Answer", "Next Question", etc.
- "Show Scoreboard" button — can be triggered mid-round; returns to current question when dismissed (does not advance the game)
- "Sponsor Splash" button — triggers full-screen sponsor display on projector
- "End Round" / "End Game" buttons — **End Game requires confirmation** ("Are you sure? This cannot be undone.") with a 3-second undo window after confirmation

**Scores tab:**
- All teams listed with manual +/− score adjustment buttons (large, thumb-friendly tap targets)

**Answers tab:**
- Team answer feed: real-time stream of submitted answers
  - For free-text: host taps ✓ or ✗ on each answer (fuzzy match suggestions highlighted)
  - For multiple-choice: auto-graded, host sees results tally

**Final Question controls:**
- Wager flow: host sees "Waiting for wagers..." with team wager status
- "Lock Wagers" button to close wagering and proceed to question
- Teams that haven't locked are auto-set to wager of 1
- "Reveal Final Scores" button with dramatic animation on projector

### 5D. Post-Game
- Final standings displayed
- Host can adjust scores manually if needed (correction mode)
- "Save Game" (archives results)
- "New Game" returns to dashboard

---

## 6. PROJECTOR DISPLAY — SCREEN BY SCREEN

Large text, high contrast, designed for noisy bar projection. No small UI elements.

### 6A. Welcome / Lobby
- Game title + logo
- Room code displayed HUGE (with join URL, e.g., "trivia.app/ABCD")
- Optional: QR code for easy phone join
- List of joined team names (updates live as teams join)
- Ambient animation / music-ready state (host controls when to begin)

### 6B. Round Intro
- Round number + round name
- Round type badge (e.g., "⚡ SPEED ROUND" or "🖼️ PICTURE ROUND")
- Brief pause (3-5 sec) before first question
- For Final Question: displays category, then "Teams are wagering..." with countdown

### 6C. Question Display
- Question text (large, readable from back of bar)
- For picture rounds: image fills most of the screen, question text below
- For MC: answer options displayed (A/B/C/D)
- Timer ring or bar (prominent, animated)
- For speed rounds: more aggressive visual treatment (pulsing, color shifts)
- Question count indicator (e.g., "3 of 10")
- Round name in corner

### 6D. Answer Reveal
- Correct answer displayed prominently
- For MC: correct option highlighted green, wrong options dimmed
- Brief animation / transition
- Optional: show how many teams got it right (e.g., "7 of 12 teams correct")

### 6E. Scoreboard
- If scoreboard is **visible** (default): ranked team list with scores, top 3 highlighted, animated transitions when shown between rounds (scores tick up)
- If scoreboard is **hidden**: shows "🤫 Scores are hidden until the end!" message unless the host manually overrides from Controls
- Can be shown at host's discretion at any time via manual override (even when hidden)

### 6F. Final Reveal
- Dramatic sequence: show category → wager phase → question → answer
- Final standings with winner celebration animation
- Podium-style top 3 display

### 6G. Break Screen
- Countdown timer (large, centered)
- Game branding + **sponsor logo card** (rotating through active sponsors with logo + name prominently displayed)
- Current scoreboard displayed alongside (respects scoreboard visibility setting)
- "Next round starts in..." messaging
- Sponsor bar also visible at bottom

### 6H. Sponsor Splash
- Full-screen sponsor logo + name on projector
- Simultaneously displays on all team phones
- Host triggers manually from Controls panel ("This round brought to you by...")
- Auto-dismisses after ~6 seconds or on host advance

### Persistent Sponsor Bar (all screens)
- Bottom or lower-corner strip on projector during gameplay
- Rotates through active game sponsors on ~10s cycle
- Subtle enough to not distract from questions

---

## 7. TEAM PHONE EXPERIENCE — SCREEN BY SCREEN

Mobile-first, thumb-friendly, minimal UI. Works on any phone browser (no app install).

### 7A. Join
- Navigate to URL or scan QR code
- Enter **team name**
- **New team:** creator becomes captain, sets a **4-digit PIN**. Captain is the only member who can submit answers.
- **Existing team:** enter team name + PIN to join as a viewer. Viewers see all questions and the game state but cannot submit answers. Shows "Waiting for captain to submit..." during question phases.
- Account-level toggle: host can switch to **open join** (no PIN required) for casual events.
- See lobby: "Waiting for host to start..."
- Show joined confirmation + team color assignment

### 7A2. Round Transitions
- Between rounds, team phones show the **next round intro**: round name, round type icon, and type-specific subtitle (e.g., "⚡ Quick fire — auto-advancing!" for speed rounds)
- Below the round intro: current **leaderboard** (if scoreboard is visible) or **team list** (if scoreboard is hidden)
- This screen stays until the host begins the next round

### 7B. Active Question
- Question text displayed on phone (mirrors projector)
- For MC: tap to select answer (highlights selection with checkmark), then tap **"Submit Answer"** button to lock in. No auto-submit on tap.
- For free-text: text input field + "Submit Answer" button
- For picture rounds: image displayed on phone too (helps teams at far tables)
- Timer shown (synced with projector)
- Submitted state: "Answer locked in ✓" with option to change before timer expires
- **Timer expired without submission:** shows "No Answer Submitted 😢" with "Time's up!" message

### 7C. Wager Input (Final Question only)
- Slider or number input for wager amount (min 1, max = current score or 1 if score is 0)
- Shows current score and max wager allowed
- "Lock Wager" button
- Waiting state after locking

### 7D. Answer Reveal (on phone)
- Shows correct answer
- Shows whether team got it right/wrong
- Points earned/lost this question
- Running score

### 7E. Scoreboard (on phone)
- If scoreboard is **visible** (default): team's current rank and score, abbreviated leaderboard (top 5 + your position)
- If scoreboard is **hidden**: shows "🤫 Scores Hidden — all will be revealed at the end!" unless the host manually overrides
- Game over always shows full scoreboard regardless of setting
- Shows between rounds when host triggers scoreboard

### 7E2. Break (on phone)
- "Halftime Break" header with countdown timer (synced with projector)
- Sponsor logo card (rotating through active sponsors)
- Current standings below (respects scoreboard visibility setting — shows team names without scores if hidden)

### 7F. Game Over
- Final rank + score
- Winner announcement
- "Thanks for playing" with host branding

---

## 8. SCORING ENGINE

- Base scoring: configurable points per question (default 1)
- Standard and picture rounds: +points for correct, 0 for incorrect (no deductions)
- Speed round: same as standard (no speed bonus at launch — keeps it simple)
- Final question: +/- wagered amount (minimum wager 1, max = current total score; min 1 even at 0 points)
- Teams can only go negative via the Final Question (min wager of 1 at 0 points → -1 if wrong)
- Tiebreaker: closest numerical answer wins; no points awarded, just determines placement
- Host can manually adjust any team's score at any time (override mode)
- Score corrections logged (audit trail for disputes)
- **Late-joining teams** start at 0 points and see the current question immediately

---

## 9. ANSWER GRADING

### Multiple Choice
- Auto-graded on submission
- Host sees results in real-time (percentage breakdown per option)

### Free-Text
- Fuzzy matching: normalize case, whitespace, common abbreviations
  - "Martin Luther King Jr" = "MLK Jr" = "Martin Luther King Junior"
- Host sees all submitted answers grouped by similarity
- Host taps ✓ (correct) or ✗ (incorrect) on each unique answer
- Batch approve: if host marks "MLK" correct, all submissions matching that string auto-approve
- Host can override any grading decision

---

## 10. REAL-TIME SYNC

- All state changes (question reveal, timer, answer reveal, scores) push instantly to:
  - Projector display
  - Host remote (if on separate device)
  - All connected team phones (captain + viewers)
- **Game state persistence:** full game state is stored server-side. If the projector browser refreshes, host phone reconnects, or any device loses and regains connection, it syncs to the current game state. No data is lost.
- **Late join:** teams can join mid-game, start with 0 points, and see the current question. If they join during the Final Question wager phase, they can wager (min 1, max 0 → forced to 1). If they join during a break, they see the scoreboard and wait for next round.

---

## 11. TECH STACK (recommendation)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js + React | SSR for projector display, fast mobile loads |
| Styling | Tailwind CSS | Rapid iteration, responsive |
| Backend | Supabase | Auth, Postgres DB, Realtime subscriptions, file storage (images) |
| Real-time | Supabase Realtime | WebSocket channels per game room |
| Hosting | Vercel | Edge deployment, pairs with Next.js |
| Image storage | Supabase Storage | Question images, logos |

This aligns with your existing MyReve stack (Vercel + Supabase).

---

## 12. DATA MODEL (high-level)

```
Host (account)
├── branding (logo_url, primary_color, accent_color, default_game_title)
├── settings (open_join: bool — disables team PIN requirement)
├── Sponsors (name, logo_url)
├── Question Bank
│   └── Question (text, answer, type, choices[], image_url, category, difficulty, points, used_count, last_used_at)
├── Games
│   └── Game (name, date, status, room_code, hide_scoreboard: bool)
│       ├── Game_Sponsors (links to active Sponsors for this game)
│       ├── Rounds (ordered) — types: standard, picture, speed, final, break, tiebreaker
│       │   └── Round (name, type, timer_seconds, reveal_mode)
│       │       └── Round_Questions (ordered, links to Question)
│       ├── Teams (name, color, pin_hash, join_order)
│       │   └── Team_Members (device_id, is_captain, connected_at)
│       │   └── Team_Answers (question_id, answer_text, is_correct, points_earned)
│       │   └── Team_Wagers (round_id, wager_amount) — Final Question only
│       └── Game_State (current_round, current_question, phase, prev_phase, timer_remaining)
│       └── Score_Adjustments (team_id, delta, reason, timestamp) — audit log
```

---

## 13. OUT OF SCOPE (for now)

- Audio/music rounds (requires audio streaming — add later)
- Sound effects (timer ticks, buzzers — revisit post-V1)
- Recurring event scheduling
- Player data export / lead capture
- Multi-host / co-host support
- Team chat or reactions
- AI question generation (possible future feature)
- Native mobile app (web-only at launch)
- Double Down mechanic (team token to double a round's points)
- Wager rounds (wagering only on Final Question)
- Multiple accounts per host (for different branding contexts)
- Sponsor click-through tracking / analytics

---

## DECISIONS LOG

1. **Double Down:** Out for V1. Revisit as a future game setting.
2. **Wager rounds:** Removed entirely. Wagering only exists on the Final Question.
3. **Final Question wager:** Minimum wager is 1 (not 0). Teams that don't submit default to 1. Wrong answer deducts wagered points. Teams can go negative (only via Final Question).
4. **Team size/count:** No caps. Scoreboard must scroll/paginate gracefully for large groups.
5. **Host auth:** Simple email/password. No OAuth for V1.
6. **Offline fallback:** No. Requires WiFi. If connection drops, game pauses until restored. Game state persists server-side; all devices reconnect to current state on refresh.
7. **Sound effects:** Removed from V1 scope.
8. **Team join security:** 4-digit team PIN set by captain. Account-level toggle for open join (no PIN) for casual events.
9. **Multi-device per team:** Multiple devices can join same team via PIN. Captain (first joiner) submits answers; others are view-only.
10. **Speed rounds:** Auto-advance when timer expires. MC-only (no free-text, since host can't grade in 10 seconds).
11. **Picture rounds:** One image per question (not grids). For "name 10 logos," create 10 questions each with one image.
12. **Reveal mode:** Per-round setting — "after each question" (default) or "at end of round." Speed rounds always reveal per-question.
13. **Scoreboard mid-round:** Returns to the exact question/state when dismissed. Does not advance the game.
14. **End Game:** Requires confirmation dialog with undo window.
15. **Late join:** Teams join at 0 points, see current question. Can participate in Final Question wager (forced to min 1).
16. **Tiebreaker:** "Closest number" format. Can be pre-loaded or pulled from bank. Triggered manually by host after Final Question if tied.
17. **Question tracking:** Usage count and last-used date tracked per question, visible in question bank.
18. **Scoreboard visibility:** Per-game toggle "Hide scoreboard until game end" (default: show). When hidden, projector and team phones show a "scores hidden" message instead of standings. Host can manually override to push scoreboard at any time. Host always sees scores in their own Scores tab. Game Over always reveals full standings.
19. **Round transitions on phone:** Team phones show next round intro (name + type + subtitle) with current leaderboard (or team list if scores hidden) between rounds.
20. **Break screen sponsors:** Sponsor logo displayed prominently on both projector and team phone during breaks, alongside countdown timer and standings.
21. **MC answer submission:** Multiple choice requires tap-to-select then "Submit Answer" button (no auto-submit on tap). Matches free-text submission flow.
22. **Timer expired state:** Team phone shows "No Answer Submitted 😢" when timer hits 0 without a submission.
23. **Sponsor splash on phone:** Sponsor splash triggered by host pushes to both projector and all team phones simultaneously.

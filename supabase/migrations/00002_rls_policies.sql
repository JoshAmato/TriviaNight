-- Enable RLS on all tables
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

-- ═══════════════════════════════════════════
-- HOST-OWNED TABLES: host can CRUD their own data
-- ═══════════════════════════════════════════
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

-- ═══════════════════════════════════════════
-- GAME-PARTICIPANT TABLES: public read for live games, host can write
-- ═══════════════════════════════════════════

-- Teams
CREATE POLICY "public_read_live" ON teams FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE status = 'live'));
CREATE POLICY "host_write" ON teams FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));
CREATE POLICY "anon_insert" ON teams FOR INSERT WITH CHECK (true);

-- Team members
CREATE POLICY "anon_insert" ON team_members FOR INSERT WITH CHECK (true);

-- Team answers
CREATE POLICY "public_read_live" ON team_answers FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "anon_insert" ON team_answers FOR INSERT WITH CHECK (true);

-- Team wagers
CREATE POLICY "public_read_live" ON team_wagers FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "anon_insert" ON team_wagers FOR INSERT WITH CHECK (true);

-- Game state
CREATE POLICY "public_read_live" ON game_state FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE status = 'live'));
CREATE POLICY "host_write" ON game_state FOR ALL
  USING (game_id IN (SELECT id FROM games WHERE host_id = auth.uid()));

-- Score adjustments
CREATE POLICY "public_read_live" ON score_adjustments FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE game_id IN (SELECT id FROM games WHERE status = 'live')));
CREATE POLICY "host_write" ON score_adjustments FOR INSERT
  WITH CHECK (team_id IN (SELECT t.id FROM teams t JOIN games g ON t.game_id = g.id WHERE g.host_id = auth.uid()));

-- ═══════════════════════════════════════════
-- Additional read policies for host on participant tables
-- (rounds, round_questions need to be readable during live games for players)
-- ═══════════════════════════════════════════
CREATE POLICY "public_read_live" ON rounds FOR SELECT
  USING (game_id IN (SELECT id FROM games WHERE status = 'live'));
CREATE POLICY "public_read_live" ON round_questions FOR SELECT
  USING (round_id IN (SELECT r.id FROM rounds r JOIN games g ON r.game_id = g.id WHERE g.status = 'live'));
CREATE POLICY "public_read_live" ON games FOR SELECT
  USING (status = 'live');

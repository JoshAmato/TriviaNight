-- Generate unique 4-char room code
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM games WHERE room_code = code AND status = 'live') INTO code_exists;
    EXIT WHEN NOT code_exists;
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

-- updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON game_state FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

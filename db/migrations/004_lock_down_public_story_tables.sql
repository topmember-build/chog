ALTER TABLE chog_story_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chog_story_entries FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE chog_story_entries FROM PUBLIC, anon, authenticated;

ALTER TABLE chog_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE chog_adventures FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE chog_adventures FROM PUBLIC, anon, authenticated;

ALTER TABLE chog_life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chog_life_events FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE chog_life_events FROM PUBLIC, anon, authenticated;

ALTER TABLE chog_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chog_streaks FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE chog_streaks FROM PUBLIC, anon, authenticated;

ALTER TABLE chog_custom_story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chog_custom_story_chapters FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE chog_custom_story_chapters FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON SEQUENCE chog_life_events_id_seq, chog_custom_story_chapters_id_seq
  FROM PUBLIC, anon, authenticated;

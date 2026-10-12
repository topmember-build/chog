CREATE TABLE IF NOT EXISTS chog_adventures (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL CHECK (token_id ~ '^(0|[1-9][0-9]*)$'),
  played_on DATE,
  choice_id TEXT,
  outcome TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chog_adventures_token_played_idx
  ON chog_adventures (token_id, played_on);

CREATE UNIQUE INDEX IF NOT EXISTS chog_adventures_one_play_per_day_idx
  ON chog_adventures (token_id, played_on)
  WHERE played_on IS NOT NULL;

CREATE TABLE IF NOT EXISTS chog_life_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_id TEXT NOT NULL CHECK (token_id ~ '^(0|[1-9][0-9]*)$'),
  adventure_id TEXT NOT NULL REFERENCES chog_adventures (id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  text TEXT NOT NULL,
  stamp TEXT NOT NULL CHECK (stamp IN ('TITLE', 'SCAR', 'FRIEND', 'RIVAL', 'MILESTONE')),
  color TEXT NOT NULL CHECK (color IN ('purple', 'red', 'blue', 'green')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chog_life_events_token_recent_idx
  ON chog_life_events (token_id, created_at DESC);

CREATE INDEX IF NOT EXISTS chog_life_events_public_recent_idx
  ON chog_life_events (created_at DESC);

CREATE INDEX IF NOT EXISTS chog_life_events_stamp_recent_idx
  ON chog_life_events (stamp, created_at DESC);

CREATE TABLE IF NOT EXISTS chog_streaks (
  token_id TEXT PRIMARY KEY CHECK (token_id ~ '^(0|[1-9][0-9]*)$'),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  last_played_on DATE
);

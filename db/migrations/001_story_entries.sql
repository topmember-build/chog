CREATE TABLE IF NOT EXISTS chog_story_entries (
  token_id TEXT NOT NULL CHECK (token_id ~ '^(0|[1-9][0-9]*)$'),
  play_date DATE NOT NULL,
  adventure_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  choice_label TEXT NOT NULL,
  story_text TEXT NOT NULL,
  owner_wallet TEXT NOT NULL CHECK (owner_wallet ~ '^0x[0-9a-f]{40}$'),
  privy_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token_id, play_date)
);

CREATE INDEX IF NOT EXISTS chog_story_entries_recent_idx
  ON chog_story_entries (created_at DESC);

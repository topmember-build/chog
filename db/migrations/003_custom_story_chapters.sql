CREATE TABLE IF NOT EXISTS chog_custom_story_chapters (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_id TEXT NOT NULL CHECK (token_id ~ '^(0|[1-9][0-9]*)$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  story_text TEXT NOT NULL CHECK (char_length(story_text) BETWEEN 1 AND 2000),
  owner_wallet TEXT NOT NULL CHECK (owner_wallet ~ '^0x[0-9a-f]{40}$'),
  privy_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chog_custom_story_chapters_token_idx
  ON chog_custom_story_chapters (token_id, id);

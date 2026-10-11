import 'server-only'

import postgres from 'postgres'
import type { DailyAdventure } from '@/lib/daily-adventure'

export type StoryEntry = {
  tokenId: string
  playDate: string
  adventureId: string
  prompt: string
  choiceId: string
  choiceLabel: string
  storyText: string
  createdAt: string
}

type PublicStoryRow = {
  token_id: string
  play_date: string
  adventure_id: string
  prompt: string
  choice_id: string
  choice_label: string
  story_text: string
  created_at: Date
}

declare global {
  var chogStoryDatabase: ReturnType<typeof postgres> | undefined
}

function getDatabase(): ReturnType<typeof postgres> {
  const databaseUrl = process.env.POSTGRES_URL
  if (!databaseUrl) throw new Error('POSTGRES_URL is required for story storage.')

  return (globalThis.chogStoryDatabase ??= postgres(databaseUrl, {
    max: 5,
    prepare: false,
    connect_timeout: 12,
    idle_timeout: 20,
  }))
}

function toPublicEntry(row: PublicStoryRow): StoryEntry {
  return {
    tokenId: row.token_id,
    playDate: row.play_date,
    adventureId: row.adventure_id,
    prompt: row.prompt,
    choiceId: row.choice_id,
    choiceLabel: row.choice_label,
    storyText: row.story_text,
    createdAt: row.created_at.toISOString(),
  }
}

export async function getStoryEntries(tokenId: string, limit = 30): Promise<StoryEntry[]> {
  const rows = await getDatabase()<PublicStoryRow[]>`
    SELECT token_id, play_date, adventure_id, prompt, choice_id, choice_label, story_text, created_at
    FROM chog_story_entries
    WHERE token_id = ${tokenId}
    ORDER BY play_date DESC
    LIMIT ${limit}
  `
  return rows.map(toPublicEntry)
}

export async function saveDailyStoryEntry(input: {
  tokenId: string
  adventure: DailyAdventure & { date: string }
  choiceId: string
  choiceLabel: string
  storyText: string
  ownerWallet: string
  privyUserId: string
}): Promise<StoryEntry | null> {
  const rows = await getDatabase()<PublicStoryRow[]>`
    INSERT INTO chog_story_entries (
      token_id, play_date, adventure_id, prompt, choice_id, choice_label,
      story_text, owner_wallet, privy_user_id
    ) VALUES (
      ${input.tokenId}, ${input.adventure.date}::date, ${input.adventure.id},
      ${input.adventure.prompt}, ${input.choiceId}, ${input.choiceLabel},
      ${input.storyText}, ${input.ownerWallet.toLowerCase()}, ${input.privyUserId}
    )
    ON CONFLICT (token_id, play_date) DO NOTHING
    RETURNING token_id, play_date, adventure_id, prompt, choice_id, choice_label, story_text, created_at
  `

  return rows[0] ? toPublicEntry(rows[0]) : null
}

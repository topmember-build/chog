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

export type CustomStoryChapter = {
  id: string
  title: string
  storyText: string
  createdAt: string
}

export type PublicStoryFeedEntry = {
  id: string
  kind: 'daily-adventure' | 'owner-chapter'
  tokenId: string
  title: string
  storyText: string
  detail: string
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

type CustomStoryChapterRow = {
  id: string
  title: string
  story_text: string
  created_at: Date
}

type PublicStoryFeedRow = {
  id: string
  kind: PublicStoryFeedEntry['kind']
  token_id: string
  title: string
  story_text: string
  detail: string
  created_at: Date
}

declare global {
  var chogStoryDatabase: ReturnType<typeof postgres> | undefined
}

export function getDatabase(): ReturnType<typeof postgres> {
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

function toPublicChapter(row: CustomStoryChapterRow): CustomStoryChapter {
  return {
    id: row.id,
    title: row.title,
    storyText: row.story_text,
    createdAt: row.created_at.toISOString(),
  }
}

function toPublicStoryFeedEntry(row: PublicStoryFeedRow): PublicStoryFeedEntry {
  return {
    id: row.id,
    kind: row.kind,
    tokenId: row.token_id,
    title: row.title,
    storyText: row.story_text,
    detail: row.detail,
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

export async function getCustomStoryChapters(tokenId: string): Promise<CustomStoryChapter[]> {
  const rows = await getDatabase()<CustomStoryChapterRow[]>`
    SELECT id::text, title, story_text, created_at
    FROM chog_custom_story_chapters
    WHERE token_id = ${tokenId}
    ORDER BY id
  `
  return rows.map(toPublicChapter)
}

export async function getPublicStoryFeed(limit = 60): Promise<PublicStoryFeedEntry[]> {
  const rows = await getDatabase()<PublicStoryFeedRow[]>`
    SELECT id, kind, token_id, title, story_text, detail, created_at
    FROM (
      SELECT
        id::text AS id,
        'owner-chapter'::text AS kind,
        token_id,
        title,
        story_text,
        'Owner-written chapter'::text AS detail,
        created_at
      FROM chog_custom_story_chapters
      UNION ALL
      SELECT
        token_id || '-' || play_date::text AS id,
        'daily-adventure'::text AS kind,
        token_id,
        prompt AS title,
        story_text,
        choice_label AS detail,
        created_at
      FROM chog_story_entries
    ) AS story_feed
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return rows.map(toPublicStoryFeedEntry)
}

export async function saveCustomStoryChapter(input: {
  tokenId: string
  title: string
  storyText: string
  ownerWallet: string
  privyUserId: string
}): Promise<CustomStoryChapter> {
  const rows = await getDatabase()<CustomStoryChapterRow[]>`
    INSERT INTO chog_custom_story_chapters (
      token_id, title, story_text, owner_wallet, privy_user_id
    ) VALUES (
      ${input.tokenId}, ${input.title}, ${input.storyText},
      ${input.ownerWallet.toLowerCase()}, ${input.privyUserId}
    )
    RETURNING id::text, title, story_text, created_at
  `
  const chapter = rows[0]
  if (!chapter) throw new Error('The saved Chog chapter was not returned from the database.')
  return toPublicChapter(chapter)
}

export async function updateCustomStoryChapter(input: {
  tokenId: string
  chapterId: string
  title: string
  storyText: string
  ownerWallet: string
  privyUserId: string
}): Promise<CustomStoryChapter | null> {
  const rows = await getDatabase()<CustomStoryChapterRow[]>`
    UPDATE chog_custom_story_chapters
    SET title = ${input.title},
        story_text = ${input.storyText},
        owner_wallet = ${input.ownerWallet.toLowerCase()},
        privy_user_id = ${input.privyUserId}
    WHERE id::text = ${input.chapterId}
      AND token_id = ${input.tokenId}
    RETURNING id::text, title, story_text, created_at
  `
  return rows[0] ? toPublicChapter(rows[0]) : null
}

export async function deleteCustomStoryChapter(input: {
  tokenId: string
  chapterId: string
}): Promise<boolean> {
  const rows = await getDatabase()<Array<{ id: string }>>`
    DELETE FROM chog_custom_story_chapters
    WHERE id::text = ${input.chapterId}
      AND token_id = ${input.tokenId}
    RETURNING id::text
  `
  return rows.length > 0
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

import 'server-only'

import { getDatabase } from '@/lib/story-store'
import type { LifeEvent } from '@/lib/chog-data'

export type StoredAdventure = {
  adventureId: string
  title: string
  beats: string[]
  choices: { id: string; label: string }[]
}

type AdventureRow = {
  token_id: string
  payload: StoredAdventure
  played_on: string | null
}

export type ExploreEvent = LifeEvent & { token_id: string; created_at: Date }

export class AdventureAlreadyPlayedError extends Error {
  constructor() {
    super('This Chog has already played today.')
    this.name = 'AdventureAlreadyPlayedError'
  }
}

export class AdventureChoiceError extends Error {
  constructor() {
    super('That choice is not part of this chapter.')
    this.name = 'AdventureChoiceError'
  }
}

export class AdventureNotFoundError extends Error {
  constructor() {
    super('Adventure not found.')
    this.name = 'AdventureNotFoundError'
  }
}

export async function getLifeEvents(tokenId: string): Promise<LifeEvent[]> {
  return getDatabase()<LifeEvent[]>`
    SELECT day, text, stamp, color
    FROM chog_life_events
    WHERE token_id = ${tokenId}
    ORDER BY created_at DESC
    LIMIT 100
  `
}

export async function getStreak(tokenId: string): Promise<number> {
  const rows = await getDatabase()<Array<{ count: number }>>`
    SELECT count FROM chog_streaks WHERE token_id = ${tokenId}
  `
  return Number(rows[0]?.count ?? 0)
}

export async function recordLifeEvents(tokenId: string, events: LifeEvent[], adventureId: string) {
  const sql = getDatabase()
  await sql.begin(async (transaction) => {
    for (const event of events) {
      await transaction`
        INSERT INTO chog_life_events (token_id, adventure_id, day, text, stamp, color)
        VALUES (${tokenId}, ${adventureId}, ${event.day}, ${event.text}, ${event.stamp}, ${event.color})
      `
    }
  })
  return events
}

export async function createPendingAdventure(tokenId: string, adventure: StoredAdventure) {
  await getDatabase()`
    INSERT INTO chog_adventures (id, token_id, payload)
    VALUES (${adventure.adventureId}, ${tokenId}, ${JSON.stringify(adventure)}::jsonb)
  `
}

export async function getAdventure(adventureId: string): Promise<AdventureRow | null> {
  const rows = await getDatabase()<AdventureRow[]>`
    SELECT token_id, payload, played_on
    FROM chog_adventures
    WHERE id = ${adventureId}
  `
  return rows[0] ?? null
}

export async function getAdventureTokenId(adventureId: string): Promise<string | null> {
  const rows = await getDatabase()<Array<{ token_id: string }>>`
    SELECT token_id FROM chog_adventures WHERE id = ${adventureId}
  `
  return rows[0]?.token_id ?? null
}

export async function hasPlayedToday(tokenId: string): Promise<boolean> {
  const rows = await getDatabase()<Array<{ played: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM chog_adventures
      WHERE token_id = ${tokenId}
        AND played_on = (NOW() AT TIME ZONE 'UTC')::date
    ) AS played
  `
  return rows[0].played
}

export async function saveAdventureResult(input: {
  tokenId: string
  adventureId: string
  choiceId: string
  outcome: string
  events: LifeEvent[]
}) {
  const sql = getDatabase()
  try {
    await sql.begin(async (transaction) => {
      const updated = await transaction<Array<{ id: string }>>`
        UPDATE chog_adventures
        SET played_on = (NOW() AT TIME ZONE 'UTC')::date,
            choice_id = ${input.choiceId},
            outcome = ${input.outcome}
        WHERE id = ${input.adventureId}
          AND token_id = ${input.tokenId}
          AND played_on IS NULL
        RETURNING id
      `

      if (updated.length === 0) throw new AdventureAlreadyPlayedError()

      for (const event of input.events) {
        await transaction`
          INSERT INTO chog_life_events (token_id, adventure_id, day, text, stamp, color)
          VALUES (${input.tokenId}, ${input.adventureId}, ${event.day}, ${event.text}, ${event.stamp}, ${event.color})
        `
      }

      await transaction`
        INSERT INTO chog_streaks (token_id, count, last_played_on)
        VALUES (${input.tokenId}, 1, (NOW() AT TIME ZONE 'UTC')::date)
        ON CONFLICT (token_id) DO UPDATE
        SET count = CASE
              WHEN chog_streaks.last_played_on = EXCLUDED.last_played_on THEN chog_streaks.count
              WHEN chog_streaks.last_played_on = EXCLUDED.last_played_on - 1 THEN chog_streaks.count + 1
              ELSE 1
            END,
            last_played_on = EXCLUDED.last_played_on
      `

      if (Math.random() <= 0.25) {
        const otherRows = await transaction<Array<{ token_id: string }>>`
          SELECT token_id
          FROM chog_life_events
          WHERE token_id <> ${input.tokenId}
          ORDER BY RANDOM()
          LIMIT 1
        `
        const otherTokenId = otherRows[0]?.token_id
        if (otherTokenId) {
          await transaction`
            INSERT INTO chog_life_events (token_id, adventure_id, day, text, stamp, color)
            VALUES
              (${input.tokenId}, ${input.adventureId}, 'TODAY', ${`Crossed paths with Chog #${otherTokenId}. Neither subject will discuss the meeting.`}, 'FRIEND', 'blue'),
              (${otherTokenId}, ${input.adventureId}, 'TODAY', ${`Appeared in Chog #${input.tokenId}'s story. Claims it was coincidental.`}, 'FRIEND', 'blue')
          `
        }
      }
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      throw new AdventureAlreadyPlayedError()
    }
    throw error
  }
}

export async function getExploreEvents(filter: 'newest' | 'titles' | 'rivalries'): Promise<ExploreEvent[]> {
  const sql = getDatabase()
  if (filter === 'titles' || filter === 'rivalries') {
    const stamp = filter === 'titles' ? 'TITLE' : 'RIVAL'
    return sql<ExploreEvent[]>`
      SELECT token_id, day, text, stamp, color, created_at
      FROM chog_life_events
      WHERE stamp = ${stamp}
      ORDER BY created_at DESC
      LIMIT 60
    `
  }

  return sql<ExploreEvent[]>`
    SELECT token_id, day, text, stamp, color, created_at
    FROM chog_life_events
    ORDER BY created_at DESC
    LIMIT 60
  `
}

export async function getStreakDetails(tokenId: string) {
  const rows = await getDatabase()<Array<{ count: number; last_played_on: string | null }>>`
    SELECT count, last_played_on FROM chog_streaks WHERE token_id = ${tokenId}
  `
  return {
    count: Number(rows[0]?.count ?? 0),
    saved: Boolean(rows[0]?.last_played_on),
  }
}

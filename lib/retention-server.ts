import 'server-only'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { LifeEvent } from '@/lib/chog-data'

export type ExploreEvent = LifeEvent & { token_id: string; created_at?: string }

export async function getExploreEvents(filter = 'newest') {
  const db = supabaseAdmin()
  if (!db) return [] as ExploreEvent[]
  let query = db.from('life_events').select('token_id,day,text,stamp,color,created_at').limit(60)
  if (filter === 'titles') query = query.eq('stamp', 'TITLE')
  if (filter === 'rivalries') query = query.eq('stamp', 'RIVAL')
  const { data } = await query.order('created_at', { ascending: false })
  return (data || []) as ExploreEvent[]
}

export async function getStreakDetails(tokenId: string) {
  const db = supabaseAdmin()
  if (!db) return { count: 0, saved: false }
  const { data } = await db.from('streaks').select('count,last_played_on').eq('token_id', tokenId).maybeSingle()
  return { count: Number(data?.count || 0), saved: Boolean(data?.last_played_on) }
}

export async function writeStreak(tokenId: string) {
  const db = supabaseAdmin()
  if (!db) return 0
  const { data: current } = await db.from('streaks').select('count').eq('token_id', tokenId).maybeSingle()
  const count = Number(current?.count || 0) + 1
  await db.from('streaks').upsert({ token_id: tokenId, count, last_played_on: new Date().toISOString().slice(0, 10) }, { onConflict: 'token_id' })
  return count
}

export async function maybeCrossingPath(tokenId: string, adventureId: string) {
  const db = supabaseAdmin()
  if (!db || Math.random() > 0.25) return null
  const { data } = await db.from('life_events').select('token_id').neq('token_id', tokenId).limit(20)
  const other = data?.[Math.floor(Math.random() * (data.length || 1))]?.token_id
  if (!other) return null
  const linked = { day: 'TODAY', stamp: 'FRIEND' as const, color: 'blue' as const }
  await db.from('life_events').insert([
    { token_id: tokenId, adventure_id: adventureId, ...linked, text: `Crossed paths with Chog #${other}. Neither subject will discuss the meeting.` },
    { token_id: other, adventure_id: adventureId, ...linked, text: `Appeared in Chog #${tokenId}'s story. Claims it was coincidental.` },
  ])
  return other
}

export function becauseOfPast(events: LifeEvent[]) {
  const event = events.find((item) => item.stamp === 'RIVAL' || item.stamp === 'SCAR')
  return event ? 'Because of your past' : null
}

export const CHOG_CURRENCY_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CHOG_CURRENCY === 'true'
export const currencyStub = CHOG_CURRENCY_ENABLED ? 'Optional $CHOG actions are enabled.' : 'Optional $CHOG actions are coming later.'
export const retentionNote = 'A streak is saved when a chapter is recorded. Come back tomorrow to keep it alive.'
export const exploreFilters = ['newest', 'titles', 'rivalries'] as const

export function normalizeFilter(value: string | null) {
  return value === 'titles' || value === 'rivalries' ? value : 'newest'
}

export function getShareCardPath(tokenId: string) { return `/chog/${tokenId}/opengraph-image` }
export function getStreakCopy(count: number) { return `${count} day${count === 1 ? '' : 's'} streak` }
export function getEventTag(event: LifeEvent) { return event.stamp === 'RIVAL' || event.stamp === 'SCAR' ? 'Because of your past' : null }

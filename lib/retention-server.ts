import 'server-only'

import { getExploreEvents, getStreakDetails } from '@/lib/archive-store'
import type { LifeEvent } from '@/lib/chog-data'

export type ExploreEvent = LifeEvent & { token_id: string; created_at?: string }

export { getExploreEvents, getStreakDetails }

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

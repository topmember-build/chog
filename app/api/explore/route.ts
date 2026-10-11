import { NextResponse } from 'next/server'
import { getExploreEvents, normalizeFilter } from '@/lib/retention-server'

export async function GET(request: Request) {
  const filter = normalizeFilter(new URL(request.url).searchParams.get('filter'))
  const events = await getExploreEvents(filter)
  return NextResponse.json({ filter, events })
}

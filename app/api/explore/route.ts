import { NextResponse } from 'next/server'
import { getExploreEvents, normalizeFilter } from '@/lib/retention-server'

export async function GET(request: Request) {
  const filter = normalizeFilter(new URL(request.url).searchParams.get('filter'))
  try {
    const events = await getExploreEvents(filter)
    return NextResponse.json({ filter, events })
  } catch (error) {
    console.error('Could not load the Chog public ledger.', error)
    return NextResponse.json({ error: 'The public ledger is temporarily unavailable.' }, { status: 503 })
  }
}

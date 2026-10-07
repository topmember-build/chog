import { NextResponse } from 'next/server'
import { resolveAdventure } from '@/lib/adventure-server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.tokenId !== 'string' || typeof body.adventureId !== 'string' || typeof body.choiceId !== 'string') return NextResponse.json({ error: 'tokenId, adventureId, and choiceId are required.' }, { status: 400 })
    return NextResponse.json(await resolveAdventure(body.tokenId, body.adventureId, body.choiceId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Adventure unavailable'
    return NextResponse.json({ error: message }, { status: message.includes('already played') ? 409 : 500 })
  }
}

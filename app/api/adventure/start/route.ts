import { NextResponse } from 'next/server'
import { startAdventure } from '@/lib/adventure-server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.tokenId !== 'string' || !/^\d+$/.test(body.tokenId)) return NextResponse.json({ error: 'A numeric token ID is required.' }, { status: 400 })
    return NextResponse.json(await startAdventure(body.tokenId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Adventure unavailable'
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 409 })
  }
}

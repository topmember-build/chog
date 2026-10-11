import { NextResponse } from 'next/server'
import { resolveAdventure } from '@/lib/adventure-server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { getAdventureTokenId, getOnchainChog } from '@/lib/chog-server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.adventureId !== 'string' || typeof body.choiceId !== 'string') return NextResponse.json({ error: 'adventureId and choiceId are required.' }, { status: 400 })
    const tokenId = await getAdventureTokenId(body.adventureId)
    if (!tokenId) return NextResponse.json({ error: 'That chapter is no longer available.' }, { status: 404 })
    if (!body.adventureId.startsWith('demo-')) {
      const wallet = await getVerifiedWallet(request)
      const chog = await getOnchainChog(tokenId)
      if (!wallet) return NextResponse.json({ error: 'Sign in to finish this chapter.' }, { status: 401 })
      if (!chog || String((chog as { owner?: string }).owner || '').toLowerCase() !== wallet) return NextResponse.json({ error: 'Only the current keeper can finish this chapter.' }, { status: 403 })
    }
    return NextResponse.json(await resolveAdventure(body.adventureId, body.choiceId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Adventure unavailable'
    const status = message.includes('not found') ? 404 : message.includes('already played') ? 409 : 503
    const safeMessage = status === 503 ? 'The chapter could not be recorded yet. Please try again.' : message
    return NextResponse.json({ error: safeMessage }, { status })
  }
}

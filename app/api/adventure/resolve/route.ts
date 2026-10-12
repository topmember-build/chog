import { NextResponse } from 'next/server'
import { resolveAdventure } from '@/lib/adventure-server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { AdventureAlreadyPlayedError, AdventureChoiceError, getAdventureTokenId } from '@/lib/archive-store'
import { ChogDataError, ChogNotFoundError, getCurrentChogOwner } from '@/lib/chog-chain-data'

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }
    if (
      typeof body !== 'object' ||
      body === null ||
      !('adventureId' in body) ||
      typeof body.adventureId !== 'string' ||
      !('choiceId' in body) ||
      typeof body.choiceId !== 'string' ||
      body.choiceId.length === 0 ||
      body.choiceId.length > 120
    ) {
      return NextResponse.json({ error: 'adventureId and choiceId are required.' }, { status: 400 })
    }
    const isDemoAdventure = /^demo-\d+-[0-9a-f-]{36}$/i.test(body.adventureId)
    if (!isDemoAdventure) {
      const tokenId = await getAdventureTokenId(body.adventureId)
      if (!tokenId) return NextResponse.json({ error: 'That chapter is no longer available.' }, { status: 404 })
      const wallet = await getVerifiedWallet(request)
      if (!wallet) return NextResponse.json({ error: 'Sign in to finish this chapter.' }, { status: 401 })
      const owner = (await getCurrentChogOwner(tokenId)).toLowerCase()
      if (owner !== wallet) return NextResponse.json({ error: 'Only the current keeper can finish this chapter.' }, { status: 403 })
    }
    return NextResponse.json(await resolveAdventure(body.adventureId, body.choiceId))
  } catch (error) {
    if (error instanceof ChogNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 })
    if (error instanceof AdventureAlreadyPlayedError) return NextResponse.json({ error: error.message }, { status: 409 })
    if (error instanceof AdventureChoiceError) return NextResponse.json({ error: error.message }, { status: 400 })
    if (error instanceof ChogDataError) return NextResponse.json({ error: error.message }, { status: 503 })
    console.error('Could not resolve Chog adventure.', error)
    return NextResponse.json({ error: 'The chapter could not be recorded. Please try again.' }, { status: 503 })
  }
}

import { NextResponse } from 'next/server'
import { startAdventure } from '@/lib/adventure-server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { ChogDataError, ChogNotFoundError, getCurrentChogOwner, normalizeChogTokenId } from '@/lib/chog-chain-data'
import { AdventureAlreadyPlayedError } from '@/lib/archive-store'
import { TRIAL_TOKEN_ID } from '@/lib/trial-chog'

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null || !('tokenId' in body) || typeof body.tokenId !== 'string' || !/^\d{1,78}$/.test(body.tokenId)) {
      return NextResponse.json({ error: 'A numeric token ID is required.' }, { status: 400 })
    }
    let demoMode = false
    if ('demoMode' in body) {
      if (typeof body.demoMode !== 'boolean') {
        return NextResponse.json({ error: 'demoMode must be a boolean.' }, { status: 400 })
      }
      demoMode = body.demoMode
    }
    if (demoMode && body.tokenId !== TRIAL_TOKEN_ID) {
      return NextResponse.json({ error: 'Trial adventures are only available for the Trial Chog.', code: 'INVALID_TRIAL_SUBJECT' }, { status: 400 })
    }
    const tokenId = normalizeChogTokenId(body.tokenId)
    if (!demoMode) {
      const wallet = await getVerifiedWallet(request)
      if (!wallet) return NextResponse.json({ error: 'Sign in to play this Chog.' }, { status: 401 })
      const owner = (await getCurrentChogOwner(tokenId)).toLowerCase()
      if (owner.toLowerCase() !== wallet) return NextResponse.json({ error: 'Only the current keeper can play this chapter.' }, { status: 403 })
    }
    return NextResponse.json(await startAdventure(tokenId, demoMode))
  } catch (error) {
    if (error instanceof ChogNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 })
    if (error instanceof AdventureAlreadyPlayedError) return NextResponse.json({ error: error.message }, { status: 409 })
    if (error instanceof ChogDataError) return NextResponse.json({ error: error.message }, { status: 503 })
    console.error('Could not start Chog adventure.', error)
    return NextResponse.json({ error: 'This chapter could not be started. Please try again.' }, { status: 503 })
  }
}

import { requireCurrentChogOwner, StoryAuthorizationError } from '@/lib/chog-story-auth'
import { getDailyAdventure, getDailyAdventureChoice } from '@/lib/daily-adventure'
import { ChogDataError, ChogNotFoundError, normalizeChogTokenId } from '@/lib/chog-chain-data'
import { getStoryEntries, saveDailyStoryEntry } from '@/lib/story-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId } = await params
  const adventure = getDailyAdventure()

  try {
    const canonicalTokenId = normalizeChogTokenId(tokenId)
    const entries = await getStoryEntries(canonicalTokenId)
    return Response.json({
      adventure: {
        id: adventure.id,
        date: adventure.date,
        prompt: adventure.prompt,
        choices: adventure.choices.map(({ id, label }) => ({ id, label })),
      },
      todayEntry: entries.find((entry) => entry.playDate === adventure.date) ?? null,
      entries,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof ChogNotFoundError) {
      return Response.json({ error: 'No Chog exists with that token number.', code: 'TOKEN_NOT_FOUND' }, { status: 404 })
    }
    console.error('Could not load Chog story entries.', error)
    return Response.json(
      { error: 'Story entries could not be loaded. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') {
    return Response.json({ error: 'Content-Type must be application/json.', code: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 16_384) {
    return Response.json({ error: 'Request body is too large.', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.', code: 'INVALID_JSON' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('identityToken' in body) ||
    typeof body.identityToken !== 'string' ||
    !('adventureId' in body) ||
    typeof body.adventureId !== 'string' ||
    !('choiceId' in body) ||
    typeof body.choiceId !== 'string'
  ) {
    return Response.json({ error: 'A Privy identity token, adventure ID, and choice ID are required.', code: 'STORY_INPUT_REQUIRED' }, { status: 400 })
  }

  const { tokenId } = await params
  const adventure = getDailyAdventure()
  if (body.adventureId !== adventure.id) {
    return Response.json({ error: 'This adventure is no longer current. Reload today’s story and choose again.', code: 'ADVENTURE_EXPIRED' }, { status: 409 })
  }
  const choice = getDailyAdventureChoice(adventure.id, body.choiceId)
  if (!choice) {
    return Response.json({ error: 'That choice is not part of today’s adventure.', code: 'INVALID_CHOICE' }, { status: 400 })
  }

  try {
    const { tokenId: canonicalTokenId, ownerWallet, privyUserId } = await requireCurrentChogOwner(request, tokenId, body.identityToken)
    const entry = await saveDailyStoryEntry({
      tokenId: canonicalTokenId,
      adventure,
      choiceId: choice.id,
      choiceLabel: choice.label,
      storyText: choice.storyText,
      ownerWallet,
      privyUserId,
    })
    if (!entry) {
      return Response.json({ error: 'This Chog has already played today’s adventure.', code: 'ALREADY_PLAYED_TODAY' }, { status: 409 })
    }
    return Response.json({ entry }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof StoryAuthorizationError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error instanceof ChogNotFoundError) {
      return Response.json({ error: 'No Chog exists with that token number.', code: 'TOKEN_NOT_FOUND' }, { status: 404 })
    }
    if (error instanceof ChogDataError) {
      return Response.json({ error: 'Monad could not verify the current token owner.', code: 'CHAIN_UNAVAILABLE' }, { status: 503 })
    }
    console.error('Could not save Chog story entry.', error)
    return Response.json({ error: 'Story could not be saved. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}

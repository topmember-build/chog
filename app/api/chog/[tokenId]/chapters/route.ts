import { requireCurrentChogOwner, StoryAuthorizationError } from '@/lib/chog-story-auth'
import { ChogDataError, ChogNotFoundError, normalizeChogTokenId } from '@/lib/chog-chain-data'
import { getCustomStoryChapters, saveCustomStoryChapter } from '@/lib/story-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  try {
    const tokenId = normalizeChogTokenId((await params).tokenId)
    const chapters = await getCustomStoryChapters(tokenId)
    return Response.json({ chapters }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof ChogNotFoundError) {
      return Response.json({ error: 'No Chog exists with that token number.', code: 'TOKEN_NOT_FOUND' }, { status: 404 })
    }
    console.error('Could not load custom Chog story chapters.', error)
    return Response.json(
      { error: 'Custom story chapters could not be loaded. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' },
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
    !('title' in body) ||
    typeof body.title !== 'string' ||
    !('storyText' in body) ||
    typeof body.storyText !== 'string'
  ) {
    return Response.json({ error: 'A Privy identity token, chapter title, and story text are required.', code: 'CHAPTER_INPUT_REQUIRED' }, { status: 400 })
  }

  const title = body.title.trim()
  const storyText = body.storyText.trim()
  if (title.length < 1 || title.length > 80 || storyText.length < 1 || storyText.length > 2000) {
    return Response.json(
      { error: 'Chapter titles must be 1–80 characters and chapter text must be 1–2,000 characters.', code: 'INVALID_CHAPTER_LENGTH' },
      { status: 400 },
    )
  }

  try {
    const { tokenId, ownerWallet, privyUserId } = await requireCurrentChogOwner(
      request,
      (await params).tokenId,
      body.identityToken,
    )
    const chapter = await saveCustomStoryChapter({
      tokenId,
      title,
      storyText,
      ownerWallet,
      privyUserId,
    })
    return Response.json({ chapter }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
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
    console.error('Could not save custom Chog story chapter.', error)
    return Response.json(
      { error: 'The chapter could not be saved. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' },
      { status: 503 },
    )
  }
}

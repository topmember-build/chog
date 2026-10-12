import { requireCurrentChogOwner, StoryAuthorizationError } from '@/lib/chog-story-auth'
import { ChogDataError, ChogNotFoundError } from '@/lib/chog-chain-data'
import { deleteCustomStoryChapter, updateCustomStoryChapter } from '@/lib/story-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ tokenId: string; chapterId: string }> }

function validateChapterId(chapterId: string) {
  return /^[1-9]\d*$/.test(chapterId)
}

async function readMutationBody(request: Request): Promise<unknown | Response> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') {
    return Response.json({ error: 'Content-Type must be application/json.', code: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 16_384) {
    return Response.json({ error: 'Request body is too large.', code: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  }

  try {
    return await request.json()
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.', code: 'INVALID_JSON' }, { status: 400 })
  }
}

function isMutationBody(body: unknown): body is Record<string, unknown> & { identityToken: string } {
  return typeof body === 'object'
    && body !== null
    && 'identityToken' in body
    && typeof body.identityToken === 'string'
}

function authorizationFailure(error: unknown) {
  if (error instanceof StoryAuthorizationError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status })
  }
  if (error instanceof ChogNotFoundError) {
    return Response.json({ error: 'No Chog exists with that token number.', code: 'TOKEN_NOT_FOUND' }, { status: 404 })
  }
  if (error instanceof ChogDataError) {
    return Response.json({ error: 'Monad could not verify the current token owner.', code: 'CHAIN_UNAVAILABLE' }, { status: 503 })
  }
  return null
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const body = await readMutationBody(request)
  if (body instanceof Response) return body
  if (!isMutationBody(body) || typeof body.title !== 'string' || typeof body.storyText !== 'string') {
    return Response.json(
      { error: 'A Privy identity token, chapter title, and story text are required.', code: 'CHAPTER_INPUT_REQUIRED' },
      { status: 400 },
    )
  }

  const title = body.title.trim()
  const storyText = body.storyText.trim()
  if (title.length < 1 || title.length > 80 || storyText.length < 1 || storyText.length > 2000) {
    return Response.json(
      { error: 'Chapter titles must be 1–80 characters and chapter text must be 1–2,000 characters.', code: 'INVALID_CHAPTER_LENGTH' },
      { status: 400 },
    )
  }

  const { tokenId, chapterId } = await params
  if (!validateChapterId(chapterId)) {
    return Response.json({ error: 'No chapter exists with that ID.', code: 'CHAPTER_NOT_FOUND' }, { status: 404 })
  }

  try {
    const owner = await requireCurrentChogOwner(request, tokenId, body.identityToken)
    const chapter = await updateCustomStoryChapter({
      tokenId: owner.tokenId,
      chapterId,
      title,
      storyText,
      ownerWallet: owner.ownerWallet,
      privyUserId: owner.privyUserId,
    })
    if (!chapter) {
      return Response.json({ error: 'No chapter exists with that ID for this Chog.', code: 'CHAPTER_NOT_FOUND' }, { status: 404 })
    }
    return Response.json({ chapter }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const response = authorizationFailure(error)
    if (response) return response
    console.error('Could not update custom Chog story chapter.', error)
    return Response.json(
      { error: 'The chapter could not be updated. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' },
      { status: 503 },
    )
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const body = await readMutationBody(request)
  if (body instanceof Response) return body
  if (!isMutationBody(body)) {
    return Response.json(
      { error: 'A Privy identity token is required.', code: 'CHAPTER_INPUT_REQUIRED' },
      { status: 400 },
    )
  }

  const { tokenId, chapterId } = await params
  if (!validateChapterId(chapterId)) {
    return Response.json({ error: 'No chapter exists with that ID.', code: 'CHAPTER_NOT_FOUND' }, { status: 404 })
  }

  try {
    const owner = await requireCurrentChogOwner(request, tokenId, body.identityToken)
    const deleted = await deleteCustomStoryChapter({ tokenId: owner.tokenId, chapterId })
    if (!deleted) {
      return Response.json({ error: 'No chapter exists with that ID for this Chog.', code: 'CHAPTER_NOT_FOUND' }, { status: 404 })
    }
    return Response.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const response = authorizationFailure(error)
    if (response) return response
    console.error('Could not delete custom Chog story chapter.', error)
    return Response.json(
      { error: 'The chapter could not be deleted. Check that the story database migration has been applied.', code: 'STORY_STORAGE_UNAVAILABLE' },
      { status: 503 },
    )
  }
}

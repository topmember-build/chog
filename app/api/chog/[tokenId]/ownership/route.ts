import { requireCurrentChogOwner, StoryAuthorizationError } from '@/lib/chog-story-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    typeof body.identityToken !== 'string'
  ) {
    return Response.json({ error: 'A Privy identity token is required.', code: 'IDENTITY_TOKEN_REQUIRED' }, { status: 400 })
  }

  try {
    const { tokenId, ownerWallet } = await requireCurrentChogOwner(
      request,
      (await params).tokenId,
      body.identityToken,
    )
    return Response.json(
      { verified: true, tokenId, ownerWallet },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    if (error instanceof StoryAuthorizationError) {
      return Response.json(
        { verified: false, error: error.message, code: error.code },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    console.error('Could not verify current Chog owner.', error)
    return Response.json(
      { verified: false, error: 'Ownership could not be verified. Please try again.', code: 'OWNERSHIP_CHECK_FAILED' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}

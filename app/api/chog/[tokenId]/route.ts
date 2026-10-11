import { ChogDataError, ChogNotFoundError, getChog } from '@/lib/chog-chain-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId } = await params

  try {
    const chog = await getChog(tokenId)
    return Response.json(chog, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof ChogNotFoundError) {
      return Response.json({ error: 'No Chog exists with that token number.' }, { status: 404 })
    }
    if (error instanceof ChogDataError) {
      return Response.json({ error: error.message }, { status: 503 })
    }
    console.error('Could not load Chog token data.', error)
    return Response.json({ error: 'Chog data could not be loaded due to an unexpected error.' }, { status: 500 })
  }
}

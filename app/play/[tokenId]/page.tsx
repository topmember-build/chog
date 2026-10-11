import { getOnchainChog } from '@/lib/chog-server'
import PlayFlow from '@/components/play-flow'

export default async function PlayPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params
  const chog = await getOnchainChog(tokenId)
  return <PlayFlow tokenId={tokenId} chog={chog} />
}

import 'server-only'

import { createPublicClient, defineChain, http, parseAbi } from 'viem'
import type { Chog, LifeEvent } from '@/lib/chog-data'
import { getAdventureTokenId, getLifeEvents, getStreak, hasPlayedToday, recordLifeEvents } from '@/lib/archive-store'

const contractAddress = (process.env.CHOG_CONTRACT_ADDRESS || '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763') as `0x${string}`
const monad = defineChain({ id: 143, name: 'Monad', nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: [process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz'] } } })
const client = createPublicClient({ chain: monad, transport: http(process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz') })
const abi = parseAbi(['function ownerOf(uint256 tokenId) view returns (address)', 'function tokenURI(uint256 tokenId) view returns (string)'])
const metadataCache = new Map<string, Record<string, unknown>>()

function gatewayUri(uri: string) {
  if (!uri.startsWith('ipfs://')) return uri
  return `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`
}

async function fetchMetadata(uri: string) {
  const cached = metadataCache.get(uri)
  if (cached) return cached
  const response = await fetch(gatewayUri(uri), { next: { revalidate: 3600 } })
  if (!response.ok) throw new Error('Metadata unavailable')
  const metadata = await response.json() as Record<string, unknown>
  metadataCache.set(uri, metadata)
  return metadata
}

function traitValue(metadata: Record<string, unknown>, key: string) {
  const traits = Array.isArray(metadata.attributes) ? metadata.attributes : []
  const found = traits.find((trait) => trait && typeof trait === 'object' && String((trait as Record<string, unknown>).trait_type).toLowerCase() === key)
  return found && typeof found === 'object' ? String((found as Record<string, unknown>).value ?? '') : ''
}

export async function getOnchainChog(tokenId: string): Promise<Chog | null> {
  let owner: string
  let metadata: Record<string, unknown>
  try {
    const numericId = BigInt(tokenId)
    const [currentOwner, tokenUri] = await Promise.all([
      client.readContract({ address: contractAddress, abi, functionName: 'ownerOf', args: [numericId] }),
      client.readContract({ address: contractAddress, abi, functionName: 'tokenURI', args: [numericId] }),
    ])
    owner = String(currentOwner)
    metadata = await fetchMetadata(tokenUri)
  } catch {
    return null
  }

  const image = gatewayUri(String(metadata.image || metadata.image_url || ''))
  const ledger = await getLifeEvents(tokenId)
  return {
    tokenId,
    name: String(metadata.name || `Chog #${tokenId}`),
    image,
    status: 'ON-CHAIN FILE',
    quirk: traitValue(metadata, 'quirk') || 'keeps its own counsel',
    events: ledger,
    owner,
    traits: { tone: traitValue(metadata, 'tone'), quirk: traitValue(metadata, 'quirk'), fear: traitValue(metadata, 'fear'), catchphrase: traitValue(metadata, 'catchphrase') },
  } as Chog
}

export { getAdventureTokenId, getLifeEvents, getStreak, hasPlayedToday, recordLifeEvents }

export { contractAddress }

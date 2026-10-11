import 'server-only'

import { createPublicClient, defineChain, http, parseAbi } from 'viem'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Chog, LifeEvent } from '@/lib/chog-data'

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
  try {
    const numericId = BigInt(tokenId)
    const [owner, tokenUri] = await Promise.all([
      client.readContract({ address: contractAddress, abi, functionName: 'ownerOf', args: [numericId] }),
      client.readContract({ address: contractAddress, abi, functionName: 'tokenURI', args: [numericId] }),
    ])
    const metadata = await fetchMetadata(tokenUri)
    const image = gatewayUri(String(metadata.image || metadata.image_url || ''))
    const ledger = await getLifeEvents(tokenId)
    return {
      tokenId,
      name: String(metadata.name || `Chog #${tokenId}`),
      image,
      status: 'ON-CHAIN FILE',
      quirk: traitValue(metadata, 'quirk') || 'keeps its own counsel',
      events: ledger,
      owner: String(owner),
      traits: { tone: traitValue(metadata, 'tone'), quirk: traitValue(metadata, 'quirk'), fear: traitValue(metadata, 'fear'), catchphrase: traitValue(metadata, 'catchphrase') },
    } as Chog
  } catch {
    return null
  }
}

export async function getLifeEvents(tokenId: string): Promise<LifeEvent[]> {
  const db = supabaseAdmin()
  if (!db) return []
  const { data } = await db.from('life_events').select('day,text,stamp,color').eq('token_id', tokenId).order('created_at', { ascending: false }).limit(100)
  return (data || []) as LifeEvent[]
}

export async function getStreak(tokenId: string) {
  const db = supabaseAdmin()
  if (!db) return 0
  const { data } = await db.from('streaks').select('count').eq('token_id', tokenId).maybeSingle()
  return Number(data?.count || 0)
}

export async function recordLifeEvents(tokenId: string, events: LifeEvent[], adventureId: string) {
  const db = supabaseAdmin()
  if (!db) throw new Error('LedgerStore is not configured')
  const { error } = await db.from('life_events').insert(events.map((event) => ({ token_id: tokenId, adventure_id: adventureId, ...event })))
  if (error) throw error
  return events
}

export async function getAdventureTokenId(adventureId: string) {
  const db = supabaseAdmin()
  if (!db) return null
  const { data, error } = await db.from('adventures').select('token_id').eq('id', adventureId).maybeSingle()
  if (error) throw error
  return typeof data?.token_id === 'string' ? data.token_id : null
}

export async function hasPlayedToday(tokenId: string) {
  const db = supabaseAdmin()
  if (!db) return false
  const { data } = await db.from('adventures').select('id').eq('token_id', tokenId).eq('played_on', new Date().toISOString().slice(0, 10)).maybeSingle()
  return Boolean(data)
}

export { contractAddress }

import 'server-only'

import { unstable_cache } from 'next/cache'
import { createPublicClient, defineChain, getAddress, http, type Address } from 'viem'
import { FEATURED_TOKEN_IDS } from '@/lib/chog-constants'
import type { Chog, ChogTrait } from '@/lib/chog-types'

export { FEATURED_TOKEN_IDS } from '@/lib/chog-constants'
export type { Chog, ChogTrait } from '@/lib/chog-types'

const DEFAULT_CONTRACT_ADDRESS = '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763'
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.filebase.io/ipfs/',
  'https://ipfs.io/ipfs/',
]
const IPFS_GATEWAY_HOSTS = new Set(IPFS_GATEWAYS.map((gateway) => new URL(gateway).hostname))
const MAX_METADATA_BYTES = 2 * 1024 * 1024

const collectionAbi = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

export class ChogNotFoundError extends Error {
  constructor() {
    super('No token exists with that number.')
    this.name = 'ChogNotFoundError'
  }
}

export class ChogDataError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ChogDataError'
  }
}

function getChainConfig() {
  const chainId = process.env.CHAIN_ID
  if (chainId && Number(chainId) !== 143) {
    throw new ChogDataError('The configured chain must be Monad mainnet (chain ID 143).')
  }

  const rpcUrl = process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz'
  let contractAddress: Address

  try {
    contractAddress = getAddress(process.env.CHOG_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS)
  } catch (cause) {
    throw new ChogDataError('CHOG_CONTRACT_ADDRESS is not a valid address.', { cause })
  }

  return { rpcUrl, contractAddress }
}

function createMonadClient(rpcUrl: string) {
  const chain = defineChain({
    id: 143,
    name: 'Monad',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  })
  return createPublicClient({ chain, transport: http(rpcUrl, { timeout: 12_000 }) })
}

function normalizeIpfsPath(path: string): string {
  const normalizedPath = path.replace(/^ipfs\//, '')
  const segments = normalizedPath.split('/')
  const cid = segments[0]
  if (!cid || !/^[A-Za-z0-9]{20,120}$/.test(cid) || segments.length > 32) {
    throw new ChogDataError('NFT metadata contains an invalid IPFS path.')
  }

  const safeSegments = segments.map((segment) => {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    } catch (cause) {
      throw new ChogDataError('NFT metadata contains an invalid IPFS path.', { cause })
    }
    if (!decoded || decoded === '.' || decoded === '..' || /[/\\\0]/.test(decoded)) {
      throw new ChogDataError('NFT metadata contains an invalid IPFS path.')
    }
    return encodeURIComponent(decoded)
  })

  const safePath = safeSegments.join('/')
  if (safePath.length > 2048) throw new ChogDataError('NFT metadata path is too long.')
  return safePath
}

function resolveUri(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAYS[0]}${normalizeIpfsPath(uri.slice('ipfs://'.length))}`
  }
  if (uri.startsWith('https://')) {
    let parsed: URL
    try {
      parsed = new URL(uri)
    } catch (cause) {
      throw new ChogDataError('NFT metadata contains an invalid URL.', { cause })
    }
    if (
      parsed.username ||
      parsed.password ||
      (parsed.port !== '' && parsed.port !== '443') ||
      parsed.search ||
      parsed.hash ||
      !IPFS_GATEWAY_HOSTS.has(parsed.hostname.toLowerCase()) ||
      !parsed.pathname.startsWith('/ipfs/')
    ) {
      throw new ChogDataError('NFT metadata URL must use a supported HTTPS IPFS gateway.')
    }
    return `https://${parsed.hostname.toLowerCase()}/ipfs/${normalizeIpfsPath(parsed.pathname.slice('/ipfs/'.length))}`
  }
  throw new ChogDataError('NFT metadata uses an unsupported URI format.')
}

async function readMetadataBody(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_METADATA_BYTES) {
    throw new ChogDataError('NFT metadata exceeds the 2 MB size limit.')
  }

  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let body = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_METADATA_BYTES) {
        await reader.cancel()
        throw new ChogDataError('NFT metadata exceeds the 2 MB size limit.')
      }
      body += decoder.decode(value, { stream: true })
    }
    return body + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

function parseMetadata(uri: string, body: string): Record<string, unknown> {
  if (uri.startsWith('data:application/json')) {
    const [header, data = ''] = uri.split(',', 2)
    try {
      body = header.includes(';base64')
        ? Buffer.from(data, 'base64').toString('utf8')
        : decodeURIComponent(data)
    } catch (cause) {
      throw new ChogDataError('NFT metadata could not be decoded.', { cause })
    }
  }

  try {
    const metadata: unknown = JSON.parse(body)
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      throw new Error('Metadata must be a JSON object.')
    }
    return metadata as Record<string, unknown>
  } catch (cause) {
    throw new ChogDataError('NFT metadata is not valid JSON.', { cause })
  }
}

function normalizeTraits(value: unknown): ChogTrait[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((trait): ChogTrait[] => {
    if (
      typeof trait !== 'object' ||
      trait === null ||
      !('trait_type' in trait) ||
      !('value' in trait)
    ) {
      return []
    }

    const { trait_type: traitType, value: traitValue } = trait
    if (typeof traitType !== 'string' || !['string', 'number'].includes(typeof traitValue)) {
      return []
    }

    return [{ trait_type: traitType, value: String(traitValue) }]
  })
}

function isExecutionRevert(error: unknown): boolean {
  let current: unknown = error
  while (current instanceof Error) {
    if (/execution reverted|contractfunctionreverted/i.test(`${current.name} ${current.message}`)) {
      return true
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}

function parseTokenNumber(tokenId: string): bigint {
  if (!/^\d{1,78}$/.test(tokenId)) throw new ChogNotFoundError()

  const tokenNumber = BigInt(tokenId)
  if (tokenNumber > BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')) {
    throw new ChogNotFoundError()
  }

  return tokenNumber
}

export function normalizeChogTokenId(tokenId: string): string {
  return parseTokenNumber(tokenId).toString()
}

async function readCurrentOwner(tokenNumber: bigint, contractAddress: Address, rpcUrl: string): Promise<Address> {
  try {
    return await createMonadClient(rpcUrl).readContract({
      address: contractAddress,
      abi: collectionAbi,
      functionName: 'ownerOf',
      args: [tokenNumber],
    })
  } catch (cause) {
    if (isExecutionRevert(cause)) throw new ChogNotFoundError()
    throw new ChogDataError('Monad could not verify this file. Please try again.', { cause })
  }
}

const getCachedChog = unstable_cache(
  async (tokenId: string, contractAddress: Address, rpcUrl: string): Promise<Omit<Chog, 'tokenId' | 'owner'>> => {
    const client = createMonadClient(rpcUrl)
    const tokenNumber = BigInt(tokenId)

    let tokenUri: string
    try {
      tokenUri = await client.readContract({
        address: contractAddress,
        abi: collectionAbi,
        functionName: 'tokenURI',
        args: [tokenNumber],
      })
    } catch (cause) {
      throw new ChogDataError('The NFT exists, but its metadata location could not be read.', { cause })
    }

    let metadata: Record<string, unknown> | undefined
    try {
      if (tokenUri.startsWith('data:application/json')) {
        metadata = parseMetadata(tokenUri, '')
      } else {
        const isIpfs = tokenUri.startsWith('ipfs://')
        const ipfsPath = tokenUri.slice('ipfs://'.length).replace(/^ipfs\//, '')
        const metadataUrls = isIpfs
          ? IPFS_GATEWAYS.map((gateway) => `${gateway}${ipfsPath}`)
          : [resolveUri(tokenUri)]
        let metadataError: unknown

        for (const metadataUrl of metadataUrls) {
          try {
            const response = await fetch(metadataUrl, {
              next: { revalidate: 3600 },
              signal: AbortSignal.timeout(12_000),
              redirect: 'error',
            })
            if (!response.ok) {
              metadataError = new Error(`Metadata gateway responded with ${response.status}.`)
              continue
            }
            metadata = parseMetadata(tokenUri, await readMetadataBody(response))
            metadataError = undefined
            break
          } catch (cause) {
            metadataError = cause
          }
        }

        if (metadataError || !metadata) throw metadataError ?? new Error('Metadata could not be loaded.')
      }
    } catch (cause) {
      if (cause instanceof ChogDataError) throw cause
      throw new ChogDataError('The NFT exists, but its metadata could not be loaded.', { cause })
    }

    if (!metadata || typeof metadata.name !== 'string' || metadata.name.trim() === '') {
      throw new ChogDataError('NFT metadata does not include a display name.')
    }

    let image: string | null = null
    if (typeof metadata.image === 'string' && metadata.image.trim() !== '') {
      try {
        image = resolveUri(metadata.image)
      } catch (cause) {
        if (cause instanceof ChogDataError) image = null
        else throw cause
      }
    }

    return {
      name: metadata.name,
      image,
      traits: normalizeTraits(metadata.attributes),
    }
  },
  ['chog-live-chain-metadata-v1'],
  { revalidate: 3600 },
)

export async function getCurrentChogOwner(tokenId: string): Promise<Address> {
  const tokenNumber = BigInt(normalizeChogTokenId(tokenId))
  const { rpcUrl, contractAddress } = getChainConfig()
  return readCurrentOwner(tokenNumber, contractAddress, rpcUrl)
}

export async function getChog(tokenId: string): Promise<Chog> {
  const canonicalTokenId = normalizeChogTokenId(tokenId)
  const tokenNumber = BigInt(canonicalTokenId)
  const { rpcUrl, contractAddress } = getChainConfig()
  const owner = await readCurrentOwner(tokenNumber, contractAddress, rpcUrl)
  const metadata = await getCachedChog(canonicalTokenId, contractAddress, rpcUrl)
  return { tokenId: canonicalTokenId, owner, ...metadata }
}

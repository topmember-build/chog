import { NextResponse } from 'next/server'
import { startAdventure } from '@/lib/adventure-server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { createPublicClient, http } from 'viem'
import { contractAddress } from '@/lib/chog-server'

const chainClient = createPublicClient({ transport: http(process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz') })
const ownerAbi = [{ type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] }] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.tokenId !== 'string' || !/^\d+$/.test(body.tokenId)) return NextResponse.json({ error: 'A numeric token ID is required.' }, { status: 400 })
    if (!body.demoMode) {
      const wallet = await getVerifiedWallet(request)
      if (!wallet) return NextResponse.json({ error: 'Sign in to play this Chog.' }, { status: 401 })
      const owner = await chainClient.readContract({ address: contractAddress, abi: ownerAbi, functionName: 'ownerOf', args: [BigInt(body.tokenId)] })
      if (owner.toLowerCase() !== wallet) return NextResponse.json({ error: 'Only the current keeper can play this chapter.' }, { status: 403 })
    }
    return NextResponse.json(await startAdventure(body.tokenId))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Adventure unavailable'
    return NextResponse.json({ error: message }, { status: message.includes('not found') ? 404 : 409 })
  }
}

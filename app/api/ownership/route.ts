import { NextResponse } from 'next/server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { createPublicClient, http } from 'viem'
import { contractAddress } from '@/lib/chog-server'

const client = createPublicClient({ transport: http(process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz') })
const abi = [{ type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] }] as const
export async function GET(request: Request) {
  const wallet = await getVerifiedWallet(request)
  const tokenId = new URL(request.url).searchParams.get('tokenId')
  if (!wallet || !tokenId) return NextResponse.json({ owned: false }, { status: 401 })
  try { const owner = await client.readContract({ address: contractAddress, abi, functionName: 'ownerOf', args: [BigInt(tokenId)] }); return NextResponse.json({ owned: owner.toLowerCase() === wallet }) } catch { return NextResponse.json({ owned: false }, { status: 404 }) }
}

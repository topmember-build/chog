import { NextResponse } from 'next/server'
import { getVerifiedWallet } from '@/lib/privy-server'
import { createPublicClient, defineChain, getAddress, http } from 'viem'
import { contractAddress } from '@/lib/chog-server'

const rpcUrl = process.env.CHAIN_RPC_URL || 'https://rpc.monad.xyz'
const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
})
const client = createPublicClient({ chain: monad, transport: http(rpcUrl) })
const abi = [
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export async function GET(request: Request) {
  const wallet = await getVerifiedWallet(request)
  const tokenId = new URL(request.url).searchParams.get('tokenId')
  if (!wallet) return NextResponse.json({ error: 'A valid wallet sign-in is required.' }, { status: 401 })

  if (!tokenId) {
    try {
      const ownedCount = await client.readContract({
        address: contractAddress,
        abi,
        functionName: 'balanceOf',
        args: [getAddress(wallet)],
      })
      return NextResponse.json({ ownedCount: ownedCount.toString() }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      console.error('Could not check the authenticated wallet’s Chog balance.', error)
      return NextResponse.json({ error: 'Monad could not check this wallet’s Chog balance. Please try again.' }, { status: 503 })
    }
  }

  if (!/^\d{1,78}$/.test(tokenId)) {
    return NextResponse.json({ error: 'Token ID must be a valid non-negative integer.' }, { status: 400 })
  }

  try {
    const owner = await client.readContract({
      address: contractAddress,
      abi,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    })
    return NextResponse.json({ owned: owner.toLowerCase() === wallet })
  } catch {
    return NextResponse.json({ owned: false }, { status: 404 })
  }
}

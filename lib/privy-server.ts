import 'server-only'
import { PrivyClient } from '@privy-io/server-auth'

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
const appSecret = process.env.PRIVY_APP_SECRET
const client = appId && appSecret ? new PrivyClient(appId, appSecret) : null

export async function getVerifiedWallet(request: Request) {
  if (!client) return null
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const claims = await client.verifyAuthToken(token)
    const user = await client.getUser(claims.userId)
    const wallet = user.wallet?.address ?? user.linkedAccounts.find((account) => account.type === 'wallet')?.address
    return wallet?.toLowerCase() ?? null
  } catch { return null }
}

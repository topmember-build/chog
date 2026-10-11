import 'server-only'

import { InvalidAuthTokenError, PrivyClient, type VerifyAccessTokenResponse, type User } from '@privy-io/node'
import { getAddress } from 'viem'
import { ChogDataError, ChogNotFoundError, getCurrentChogOwner, normalizeChogTokenId } from '@/lib/chog-chain-data'

export class StoryAuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 404 | 413 | 415 | 503,
    readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'StoryAuthorizationError'
  }
}

let privyClient: PrivyClient | undefined

function getPrivyClient(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  if (!appId || !appSecret) {
    throw new StoryAuthorizationError(
      'Server-side Privy authentication is not configured.',
      503,
      'AUTH_NOT_CONFIGURED',
    )
  }

  return (privyClient ??= new PrivyClient({ appId, appSecret }))
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization')
  const match = authorization?.match(/^Bearer ([^\s]+)$/i)
  if (!match) {
    throw new StoryAuthorizationError('A valid Privy sign-in is required.', 401, 'UNAUTHENTICATED')
  }
  return match[1]
}

async function verifyPrivyTokens(
  accessToken: string,
  identityToken: string,
): Promise<[VerifyAccessTokenResponse, User]> {
  const auth = getPrivyClient().utils().auth()
  try {
    return await Promise.all([
      auth.verifyAccessToken(accessToken),
      auth.verifyIdentityToken(identityToken),
    ])
  } catch (cause) {
    if (cause instanceof InvalidAuthTokenError) {
      throw new StoryAuthorizationError('A valid Privy sign-in is required.', 401, 'UNAUTHENTICATED', { cause })
    }
    throw new StoryAuthorizationError(
      'Privy could not verify the sign-in right now.',
      503,
      'AUTH_PROVIDER_UNAVAILABLE',
      { cause },
    )
  }
}

export async function requireCurrentChogOwner(
  request: Request,
  tokenId: string,
  identityToken: string,
): Promise<{ tokenId: string; ownerWallet: string; privyUserId: string }> {
  const accessToken = getBearerToken(request)
  if (!identityToken || identityToken.length > 16_384) {
    throw new StoryAuthorizationError('A valid Privy identity token is required.', 401, 'UNAUTHENTICATED')
  }

  const [claims, user] = await verifyPrivyTokens(accessToken, identityToken)

  if (claims.user_id !== user.id || claims.app_id !== process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    throw new StoryAuthorizationError('The Privy sign-in does not match this account.', 401, 'UNAUTHENTICATED')
  }

  const wallets = user.linked_accounts.flatMap((account) => {
    if (account.type === 'smart_wallet') {
      try {
        return [getAddress(account.address).toLowerCase()]
      } catch {
        return []
      }
    }
    if (account.type !== 'wallet' || account.chain_type !== 'ethereum') {
      return []
    }
    try {
      return [getAddress(account.address).toLowerCase()]
    } catch {
      return []
    }
  })

  if (wallets.length === 0) {
    throw new StoryAuthorizationError('This Privy account has no linked Ethereum wallet.', 403, 'WALLET_REQUIRED')
  }

  let owner: string
  try {
    owner = (await getCurrentChogOwner(tokenId)).toLowerCase()
  } catch (cause) {
    if (cause instanceof ChogNotFoundError) {
      throw new StoryAuthorizationError('No Chog exists with that token number.', 404, 'TOKEN_NOT_FOUND', { cause })
    }
    if (cause instanceof ChogDataError) {
      throw new StoryAuthorizationError('Monad could not verify the current token owner.', 503, 'CHAIN_UNAVAILABLE', { cause })
    }
    throw cause
  }

  if (!wallets.includes(owner)) {
    throw new StoryAuthorizationError('The authenticated wallet does not own this Chog.', 403, 'NOT_CURRENT_OWNER')
  }

  return {
    tokenId: normalizeChogTokenId(tokenId),
    ownerWallet: owner,
    privyUserId: user.id,
  }
}

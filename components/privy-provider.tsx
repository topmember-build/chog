'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
import type { ReactNode } from 'react'

const monad = defineChain({
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_CHAIN_RPC_URL || 'https://rpc.monad.xyz'] } },
})

export default function ChogPrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) return <>{children}</>
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'google', 'twitter', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#e14a2b',
          landingHeader: 'Sign in with your wallet',
          loginMessage: 'You may be asked to sign a message. Signing in does not send a transaction or spend gas.',
          showWalletLoginFirst: true,
          walletChainType: 'ethereum-only',
        },
        supportedChains: [monad],
        defaultChain: monad,
      }}
    >
      {children}
    </PrivyProvider>
  )
}

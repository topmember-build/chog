'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { defineChain } from 'viem'
import type { ReactNode } from 'react'

const monad = defineChain({ id: 143, name: 'Monad', nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_CHAIN_RPC_URL || 'https://rpc.monad.xyz'] } } })

export default function ChogPrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) return <>{children}</>
  return <PrivyProvider appId={appId} config={{ loginMethods: ['email', 'google', 'twitter', 'wallet'], appearance: { theme: 'light', accentColor: '#e14a2b' }, supportedChains: [monad] }}>{children}</PrivyProvider>
}

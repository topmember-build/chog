'use client'

import { useState, type ReactNode } from 'react'
import { PrivyProvider, useLogin, usePrivy } from '@privy-io/react-auth'
import { Wallet } from 'lucide-react'
import { monad } from 'viem/chains'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function WalletSessionControls() {
  const { ready, authenticated, user, error, logout } = usePrivy()
  const [actionError, setActionError] = useState<string | null>(null)
  const { login } = useLogin({
    onComplete: () => setActionError(null),
    onError: (errorCode) => {
      console.error('Privy wallet login failed.', errorCode)
      setActionError(`Wallet sign-in failed (Privy error: ${errorCode}). Close the wallet prompt and try again. If it keeps failing, share this error code.`)
    },
  })

  if (error) {
    return (
      <div className="wallet-login-status">
        <span className="wallet-error" role="alert">Wallet sign-in could not start: {error.message}</span>
        <button className="wallet-signout" type="button" onClick={() => login({ loginMethods: ['wallet'] })}>Try again</button>
      </div>
    )
  }

  if (!ready) {
    return <button className="wallet-button" type="button" disabled>Opening wallet sign-in…</button>
  }

  if (!authenticated) {
    return (
      <div className="wallet-login-status">
        <button
          className="wallet-button"
          type="button"
          onClick={() => {
            setActionError(null)
            login({ loginMethods: ['wallet'] })
          }}
        >
          <Wallet size={15} aria-hidden="true" />
          <span>Connect wallet</span>
        </button>
        {actionError && <span className="wallet-error" role="alert">{actionError}</span>}
      </div>
    )
  }

  const address = user?.wallet?.address

  return (
    <div className="wallet-action">
      <span className="wallet-connected" title={address ?? 'Signed in'}>
        <span className="wallet-dot" aria-hidden="true" />
        {address ? shortenAddress(address) : 'Wallet signed in'}
      </span>
      <button
        className="wallet-signout"
        type="button"
        onClick={async () => {
          setActionError(null)
          try {
            await logout()
          } catch (caught) {
            setActionError(caught instanceof Error ? caught.message : 'Could not sign out. Try again.')
          }
        }}
      >
        Sign out
      </button>
    </div>
  )
}

export function PrivySessionProvider({ appId, children }: { appId: string; children: ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#836EF9',
          landingHeader: 'Sign in with your wallet',
          loginMessage: 'You may be asked to sign a message. Signing in does not send a transaction or spend gas.',
          showWalletLoginFirst: true,
          walletChainType: 'ethereum-only',
        },
        loginMethods: ['wallet'],
        supportedChains: [monad],
        defaultChain: monad,
      }}
    >
      {children}
    </PrivyProvider>
  )
}

export function PrivyWalletSession({ appId }: { appId: string }) {
  return (
    <PrivySessionProvider appId={appId}>
      <WalletSessionControls />
    </PrivySessionProvider>
  )
}

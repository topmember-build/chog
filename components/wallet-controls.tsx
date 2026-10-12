'use client'

import { useEffect, useState } from 'react'
import { LogIn, LogOut, Wallet } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

type ChogBalance =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'loaded'; count: string }
  | { state: 'error'; message: string }

export function WalletControls({
  compact = false,
  showOwnership = false,
  signInLabel,
}: {
  compact?: boolean
  showOwnership?: boolean
  signInLabel?: string
}) {
  const { ready, authenticated, login, logout, user, getAccessToken } = usePrivy()
  const [balance, setBalance] = useState<ChogBalance>({ state: 'idle' })
  const [balanceAttempt, setBalanceAttempt] = useState(0)

  useEffect(() => {
    if (!showOwnership || !ready || !authenticated) {
      setBalance({ state: 'idle' })
      return
    }

    let active = true
    setBalance({ state: 'loading' })

    async function loadBalance() {
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error('Privy could not provide a sign-in token.')
        }

        const response = await fetch('/api/ownership', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        })
        const payload: unknown = await response.json()
        if (!response.ok) {
          const message =
            typeof payload === 'object' &&
            payload !== null &&
            'error' in payload &&
            typeof payload.error === 'string'
              ? payload.error
              : 'Chog ownership could not be checked.'
          throw new Error(message)
        }
        if (
          typeof payload !== 'object' ||
          payload === null ||
          !('ownedCount' in payload) ||
          typeof payload.ownedCount !== 'string' ||
          !/^\d+$/.test(payload.ownedCount)
        ) {
          throw new Error('The Chog balance response was invalid.')
        }

        if (active) setBalance({ state: 'loaded', count: payload.ownedCount })
      } catch (error) {
        if (active) {
          setBalance({
            state: 'error',
            message: error instanceof Error ? error.message : 'Chog ownership could not be checked.',
          })
        }
      }
    }

    void loadBalance()
    return () => {
      active = false
    }
  }, [authenticated, balanceAttempt, getAccessToken, ready, showOwnership])

  if (!ready) return <span className="wallet-status" aria-live="polite">Checking access…</span>

  if (authenticated) {
    const label = user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}` : 'Signed in'
    return (
      <div className={`wallet-session ${compact ? 'compact' : ''}`}>
        <span className="wallet-connected" title={user?.wallet?.address ?? 'Signed in'}>
          <span className="wallet-dot" aria-hidden="true" />
          {label}
        </span>
        {showOwnership && (
          balance.state === 'loading' || balance.state === 'idle' ? (
            <span className="wallet-ownership" role="status">Checking Chogs…</span>
          ) : balance.state === 'loaded' ? (
            <span className="wallet-ownership" role="status">
              {balance.count === '0'
                ? 'No Chogs found'
                : `You own ${balance.count} Chog${balance.count === '1' ? '' : 's'}`}
            </span>
          ) : (
            <span className="wallet-ownership wallet-error" role="alert">
              {balance.message}{' '}
              <button className="story-text-button" type="button" onClick={() => setBalanceAttempt((attempt) => attempt + 1)}>
                Retry
              </button>
            </span>
          )
        )}
        <button className="wallet-signout" onClick={() => void logout()} type="button">
          <LogOut size={14} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    )
  }

  return (
    <button className={`wallet-button ${compact ? 'compact' : ''}`} onClick={() => login()} type="button">
      <LogIn size={15} aria-hidden="true" />
      <span>{signInLabel ?? (compact ? 'Sign in to play' : 'Sign in / connect wallet')}</span>
    </button>
  )
}

export function PlayWithMyChogButton() {
  const { ready, authenticated, login } = usePrivy()
  const handleClick = () => {
    if (!authenticated) return void login()
    window.location.assign('/#lookup')
  }
  return <button className="primary-button paper wallet-cta" type="button" disabled={!ready} onClick={handleClick}><span>{authenticated ? 'Find my Chog' : 'Sign in to play yours'}</span><Wallet size={16} aria-hidden="true" /></button>
}

export function WalletExplainer() {
  return <div className="wallet-explainer"><div className="wallet-explainer-icon"><Wallet size={18} aria-hidden="true" /></div><div><strong>Your Chog is your own character.</strong><p>Sign in with email or social login, or connect a wallet you already use. We check the blockchain before letting you play, so only the owner can add chapters.</p></div></div>
}

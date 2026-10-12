'use client'

import { useState, type ComponentType } from 'react'
import { Wallet } from 'lucide-react'

type PrivySession = ComponentType

export function PrivySignInLoader() {
  const [Session, setSession] = useState<PrivySession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openSignIn() {
    setLoading(true)
    setError(null)
    try {
      const module = await import('./privy-wallet-session')
      setSession(() => module.PrivyWalletSession)
    } catch {
      setError('Wallet sign-in could not load. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (Session) return <Session />

  return (
    <>
      <button className="wallet-button" type="button" disabled={loading} onClick={openSignIn}>
        <Wallet size={15} aria-hidden="true" />
        <span>{loading ? 'Loading wallet sign-in…' : 'Continue with your wallet'}</span>
      </button>
      {error && <p className="wallet-error" role="alert">{error}</p>}
    </>
  )
}

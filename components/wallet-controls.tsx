'use client'

import { LogIn, LogOut, Wallet } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

export function WalletControls({ compact = false }: { compact?: boolean }) {
  const { ready, authenticated, login, logout, user } = usePrivy()

  if (!ready) return <span className="wallet-status" aria-live="polite">Checking access…</span>

  if (authenticated) {
    const label = user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}` : 'Signed in'
    return <button className={`wallet-button ${compact ? 'compact' : ''}`} onClick={() => void logout()} type="button"><Wallet size={15} aria-hidden="true" /><span>{label}</span><LogOut size={14} aria-hidden="true" /></button>
  }

  return <button className={`wallet-button ${compact ? 'compact' : ''}`} onClick={() => login()} type="button"><LogIn size={15} aria-hidden="true" /><span>{compact ? 'Sign in to play' : 'Sign in / connect wallet'}</span></button>
}

export function PlayWithMyChogButton() {
  const { ready, authenticated, login } = usePrivy()
  const handleClick = () => {
    if (!authenticated) return void login()
    window.location.assign('/demo')
  }
  return <button className="primary-button paper wallet-cta" type="button" disabled={!ready} onClick={handleClick}><span>{authenticated ? 'Choose my Chog' : 'Sign in to play yours'}</span><Wallet size={16} aria-hidden="true" /></button>
}

export function WalletExplainer() {
  return <div className="wallet-explainer"><div className="wallet-explainer-icon"><Wallet size={18} aria-hidden="true" /></div><div><strong>Your Chog is your own character.</strong><p>Sign in with email or social login, or connect a wallet you already use. We check the blockchain before letting you play, so only the owner can add chapters.</p></div></div>
}

import Link from 'next/link'
import { Wallet } from 'lucide-react'

export function WalletSignIn() {
  return (
    <Link className="wallet-button" href="/sign-in">
      <Wallet size={15} aria-hidden="true" />
      <span>Sign in with your wallet</span>
    </Link>
  )
}

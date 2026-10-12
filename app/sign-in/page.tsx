import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PrivySignInLoader } from '@/components/privy-sign-in-loader'

export const metadata: Metadata = {
  title: 'Sign in with your wallet',
  description: 'Sign in with your wallet. A message signature may be requested; no transaction or gas is required.',
}

export default function SignInPage() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  return (
    <main className="site-shell route-shell">
      <header className="route-header">
        <Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link>
        <span className="mono">WALLET SIGN-IN</span>
      </header>
      <section className="sign-in-panel">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to public files</Link>
        <p className="eyebrow">OPTIONAL / FREE</p>
        <h1>Sign in with<br /><em>your wallet.</em></h1>
        <p>Signing in proves which wallet is yours. Your wallet may ask you to sign a message; this sends no blockchain transaction and spends no gas. You never need to sign in to read a Chog&apos;s public file.</p>
        {appId
          ? <PrivySignInLoader />
          : <p className="archive-notice" role="alert">Wallet sign-in is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and restart the app.</p>}
        <p className="sign-in-notice">To add a story, the server checks that your authenticated wallet currently owns the Chog. Public file lookup does not require sign-in.</p>
      </section>
      <footer className="route-footer"><Link href="/about">How Chog Chronicles works</Link><span>Built for Chogathon 2026. Fan-made, not official.</span></footer>
    </main>
  )
}

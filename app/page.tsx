import { Header, LedgerStrip, LookupForm, PrimaryButton } from '@/components/chog-system'
import { FeaturedChogs } from '@/components/featured-chogs'
import { WalletSignIn } from '@/components/wallet-sign-in'
import { FEATURED_TOKEN_IDS } from '@/lib/chog-constants'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <main className="site-shell">
      <div className="paper-noise" aria-hidden="true" />
      <Header />
      <LedgerStrip />

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="registration" /> DIVISION OF CHAOS RECORDS</p>
          <h1>Your Chog has a life.<br /><em>Its story should travel with it.</em></h1>
          <p className="hero-lede">Read a Chog&apos;s real file, then help its current owner write the next chapter. Every story belongs to the Chog—not the person holding it.</p>
          <div className="hero-actions">
            <PrimaryButton href="#lookup">Read a Chog&apos;s file</PrimaryButton>
            <PrimaryButton href="/about" variant="paper">Why Chog Chronicles?</PrimaryButton>
          </div>
          <p className="hero-note">Reading is open to everyone. The current owner can add one server-defined story per Chog each UTC day.</p>
        </div>

        <FeaturedChogs />
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro">
          <p className="eyebrow">THE IDEA / IN PLAIN WORDS</p>
          <h2>A story that belongs<br /><em>to the Chog.</em></h2>
          <p>Most stories stay with the person who wrote them. Chog Chronicles keeps each story with its Chog—even if it gets a new owner.</p>
        </div>
        <ol className="steps-list">
          <li>
            <span className="step-number">01</span>
            <div><h3>Read any Chog&apos;s file</h3><p>Enter a number to see its real name, picture, and traits. No wallet needed.</p><span className="step-status status-live">LIVE NOW</span></div>
          </li>
          <li>
            <span className="step-number">02</span>
            <div><h3>The owner plays once a day</h3><p>Privy sign-in and a live Monad owner check confirm that your wallet owns the Chog before a story can be saved.</p><span className="step-status status-live">LIVE NOW</span></div>
          </li>
          <li>
            <span className="step-number">03</span>
            <div><h3>The story stays with the Chog</h3><p>The choice becomes a dated entry in that Chog&apos;s public file, so a new owner can continue the story.</p><span className="step-status status-live">LIVE NOW</span></div>
          </li>
        </ol>
        <div className="wallet-explainer">
          <div>
            <p className="eyebrow">WALLET SIGN-IN / OPTIONAL</p>
            <h3>What is a wallet for?</h3>
            <p>Your signed-in wallet lets the server check which Chogs are yours before saving. Signing in is free and does not send a transaction. You never need to sign in just to read.</p>
            <p className="wallet-build-note">Connect the wallet that owns a Chog to add its daily story.</p>
          </div>
          <WalletSignIn />
        </div>
      </section>

      <section className="lookup-section" id="lookup">
        <div>
          <p className="eyebrow">START HERE / 01</p>
          <h2>Look up a Chog.<br /><em>See its real file.</em></h2>
          <p>Use any valid Chog token number to load its file directly. Some token numbers differ from the Chog&apos;s display name, so we show both to keep each file straight.</p>
        </div>
        <LookupForm featuredTokenIds={FEATURED_TOKEN_IDS} />
      </section>

      <footer>
        <span>Built for Chogathon 2026. Fan-made, not official.</span>
        <span><a href="/about">About the project</a> / CHOG CHRONICLES</span>
      </footer>
      <div className="mobile-nav">
        <a href="#lookup">Read a file</a>
        <a href="#how-it-works">How it works</a>
        <WalletSignIn />
      </div>
    </main>
  )
}

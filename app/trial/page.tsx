import Link from 'next/link'
import { ArrowLeft, Radio } from 'lucide-react'
import PlayFlow from '@/components/play-flow'
import { TRIAL_CHOG } from '@/lib/trial-chog'

export default function TrialPage() {
  return (
    <>
      <section className="trial-intro">
        <header className="route-header">
          <Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link>
          <Link href="/explore" className="mono"><Radio size={14} aria-hidden="true" /> READ REAL STORIES</Link>
        </header>
        <div className="trial-intro-copy">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to the archive</Link>
          <p className="eyebrow"><span className="stamp stamp-blue">TRIAL CHOG / SANDBOX ONLY</span></p>
          <h1>Practice here.<br /><em>Leave real files untouched.</em></h1>
          <p>This Trial Chog is a separate, temporary practice experience. You can play through an adventure without connecting a wallet or changing any real Chog story. Its artwork is the real CHOG #1381 NFT image (token 1889); only the image is reused, not its token or story data.</p>
          <Link href="/explore" className="trial-feed-link">Or read the public feed of real saved stories ↗</Link>
        </div>
      </section>
      <PlayFlow tokenId={TRIAL_CHOG.tokenId} chog={TRIAL_CHOG} demoMode />
    </>
  )
}

export const metadata = {
  title: 'Trial Chog | Chog Chronicles',
  description: 'Try the Chog Chronicles story loop in an isolated sandbox that never changes real Chog files.',
}

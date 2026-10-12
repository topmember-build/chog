import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EmptyState } from '@/components/chog-system'
import { IdPhoto } from '@/components/id-photo'
import { StoryAdventureLoader } from '@/components/story-adventure-loader'
import { WalletSignIn } from '@/components/wallet-sign-in'
import { ChogDataError, ChogNotFoundError, getChog } from '@/lib/chog-chain-data'

export const dynamic = 'force-dynamic'

export default async function ChogPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params
  let chog

  try {
    chog = await getChog(tokenId)
  } catch (error) {
    if (error instanceof ChogNotFoundError) {
      return (
        <main className="site-shell route-shell">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
          <EmptyState message="FILE NOT FOUND" />
          <p className="route-message">Check the number and try again.</p>
        </main>
      )
    }

    const message = error instanceof ChogDataError
      ? error.message
      : 'The file could not be loaded due to an unexpected error.'

    return (
      <main className="site-shell route-shell">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
        <EmptyState message="FILE TEMPORARILY UNAVAILABLE" />
        <p className="route-message" role="alert">{message}</p>
        <p className="route-message"><Link href={`/chog/${encodeURIComponent(tokenId)}`}>Try again</Link></p>
      </main>
    )
  }

  return (
    <main className="site-shell route-shell">
      <header className="route-header">
        <Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link>
        <Link href="/about" className="route-about-link">About the project</Link>
        <span className="mono">FILE No. {chog.tokenId}</span>
        <WalletSignIn />
      </header>
      <div className="route-inner">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
        <section className="file-header">
          <div><p className="eyebrow">DIVISION OF CHAOS RECORDS / LIVE NFT FILE</p><h1>{chog.name}</h1><p className="file-summary">Metadata name from the Chog Genesis NFT on Monad.</p></div>
          <span className="stamp stamp-green">ON CHAIN</span>
        </section>
        <div className="file-layout">
          <div className="file-photo"><IdPhoto image={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} /><span className="mono">IDENTIFICATION PHOTOGRAPH / TOKEN {chog.tokenId}</span></div>
          <div className="field-assessment">
            <p className="eyebrow">ON-CHAIN RECORD</p>
            <div className="field-row"><span>TOKEN ID</span><strong>{chog.tokenId}</strong></div>
            <div className="field-row"><span>DISPLAY NAME</span><strong>{chog.name}</strong></div>
            <div className="field-row"><span>OWNER</span><strong className="owner-address">{chog.owner}</strong></div>
            <div className="field-row"><span>METADATA TRAITS</span><strong>{chog.traits.length}</strong></div>
            <p className="file-notice">This file is read from Monad. Daily stories are saved to this Chog&apos;s token file after the current owner is verified.</p>
          </div>
        </div>
        <div className="entries-header" id="traits"><h2>Metadata traits <span>({String(chog.traits.length).padStart(2, '0')})</span></h2><span className="mono">LIVE METADATA</span></div>
        {chog.traits.length > 0 ? (
          <div className="trait-list">
            {chog.traits.map((trait, index) => (
              <article className="file-entry trait-entry" key={`${trait.trait_type}-${index}`}>
                <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                <div><p>{trait.value}</p><span className="mono entry-note">{trait.trait_type}</span></div>
              </article>
            ))}
          </div>
        ) : (
          <p className="archive-notice">No traits are listed in this token&apos;s metadata.</p>
        )}
        <div className="entries-header history-heading"><h2>Life entries</h2><span className="mono">ONE ADVENTURE / DAY / UTC</span></div>
        <StoryAdventureLoader tokenId={chog.tokenId} appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? null} />
      </div>
      <footer className="route-footer"><Link href="/about">How Chog Chronicles works</Link><span>Built for Chogathon 2026. Fan-made, not official.</span></footer>
      <div className="mobile-nav"><Link href="/">Archive</Link><a href="#traits">Traits</a><WalletSignIn /></div>
    </main>
  )
}

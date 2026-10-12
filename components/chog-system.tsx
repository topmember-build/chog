import Link from 'next/link'
import { ArrowUpRight, FileSearch, Fingerprint } from 'lucide-react'

import type { Chog } from '@/lib/chog-types'
import type { Chog as LegacyChog } from '@/lib/chog-data'
import { IdPhoto } from '@/components/id-photo'
import { RandomChogLink } from '@/components/random-chog-link'
import { WalletSignIn } from '@/components/wallet-sign-in'

export function PrimaryButton({ children, href = '#lookup', variant = 'primary' }: { children: React.ReactNode; href?: string; variant?: 'primary' | 'paper' }) { return <Link href={href} className={`primary-button ${variant}`}><span>{children}</span><ArrowUpRight size={16} aria-hidden="true" /></Link> }
export function EmptyState({ message = 'NO FILE ON RECORD' }: { message?: string }) { return <div className="empty-state"><Fingerprint size={28} /><strong>{message}</strong><span>Archive search returned no usable evidence.</span></div> }
export function ChogCard({ chog }: { chog: Chog | LegacyChog }) {
  const traitSummary = 'traits' in chog
    ? chog.traits.slice(0, 2).map((trait) => `${trait.trait_type}: ${trait.value}`).join(' / ')
    : chog.quirk

  return <Link href={`/chog/${chog.tokenId}`} className="chog-card"><div className="card-photo"><IdPhoto image={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} /><span className="card-file">FILE No. {chog.tokenId}</span></div><div className="card-copy"><div><h3>{chog.name}</h3><p>{traitSummary || 'NO TRAITS LISTED'}</p></div><ArrowUpRight size={18} aria-hidden="true" /></div></Link>
}
export function Header() { return <header className="site-header"><Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link><nav><Link href="/#archive">Chog files</Link><Link href="/#how-it-works">How it works</Link><Link href="/about">About the project</Link><WalletSignIn /></nav></header> }
export function LedgerStrip() { return <div className="ledger-strip"><div className="ledger-label">CHOG CHRONICLES / <span>HOW IT WORKS</span></div><div className="ledger-track"><span>LIVE NFT DETAILS ARE READ FROM MONAD</span><span>OWNER-VERIFIED STORIES / ONE PER CHOG / UTC DAILY</span></div></div> }
export function LookupForm({ featuredTokenIds }: { featuredTokenIds: readonly string[] }) {
  return <form className="lookup-box" action="/chog"><label htmlFor="tokenId"><FileSearch size={16} /> PULL A FILE BY NUMBER</label><div className="lookup-row"><input id="tokenId" name="tokenId" placeholder="e.g. 1889" inputMode="numeric" pattern="[0-9]+" required /><button type="submit" aria-label="Open file"><ArrowUpRight size={18} /></button></div><div className="lookup-actions"><RandomChogLink featuredTokenIds={featuredTokenIds} /><span>{featuredTokenIds.length} live featured files indexed</span></div></form>
}
 

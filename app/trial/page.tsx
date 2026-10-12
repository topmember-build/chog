import Link from 'next/link'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { PrimaryButton } from '@/components/chog-system'

export default function TrialPage() {
  return <main className="site-shell route-shell"><header className="route-header"><Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link><Link href="/judges" className="mono">JUDGE&apos;S GUIDE</Link></header><div className="route-inner"><Link href="/" className="back-link">← Back to the archive</Link><section className="proof-hero"><p className="eyebrow">TRIAL FILE / SANDBOX ONLY</p><h1>Meet the Trial Chog.</h1><p>This is a safe sandbox for trying the one-minute story loop. Its entries are not saved to any real Chog and never appear in the public ledger.</p></section><section className="proof-grid"><article className="proof-card proof-live"><div className="proof-card-head"><span className="mono">FILE No. TRIAL</span><span className="stamp stamp-blue">SANDBOX</span></div><div className="proof-void"><strong>TRIAL CHOG READY</strong><span>Start a story to make your first entry.</span></div><div className="proof-check"><ArrowUpRight size={15} aria-hidden="true" /> Private practice file</div></article><article className="proof-card"><div className="proof-card-head"><span className="mono">DAILY REPORT</span><span className="stamp stamp-green">ONE MINUTE</span></div><h2 className="section-heading" style={{fontSize:'30px', margin:'30px 0 15px'}}>A tiny choice.<br /><em>A real chapter.</em></h2><p className="about-copy">The Trial Chog uses the same story shape as a real file. Choose a path, read the outcome, and watch an entry get stamped.</p><PrimaryButton href="/demo">Start the trial</PrimaryButton></article></section><section className="proof-note"><RotateCcw size={26} aria-hidden="true" /><div><strong>Sandbox note</strong><br /><span>Every trial choice is temporary. It cannot change an on-chain Chog or the public ledger.</span></div></section></div></main>
}

export const metadata = { title: 'Trial Chog | Chog Chronicles', description: 'Try the Chog Chronicles story loop in a labeled sandbox.' }

// Trial data is intentionally isolated from the real ledger.
void 0

function _unused() { return null }

export { _unused }

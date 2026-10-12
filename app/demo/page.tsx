import Link from 'next/link'
import PlayFlow from '@/components/play-flow'
import { chogs } from '@/lib/chog-data'

export default function DemoPage() {
  const chog = chogs[0]
  return <><PlayFlow tokenId={chog.tokenId} chog={chog} demoMode /><aside className="demo-guide"><strong>DEMO MODE</strong><p>Try a chapter without signing in. Demo choices are temporary and never enter the public ledger.</p><Link href="/">Back to archive</Link></aside></>
}

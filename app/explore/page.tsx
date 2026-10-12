import Link from 'next/link'
import { ArrowLeft, Flame, Radio } from 'lucide-react'
import { getExploreEvents, normalizeFilter } from '@/lib/retention-server'

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams
  const filter = normalizeFilter(params.filter || null)
  let events: Awaited<ReturnType<typeof getExploreEvents>> = []
  let unavailable = false
  try {
    events = await getExploreEvents(filter)
  } catch (error) {
    console.error('Could not render the Chog public ledger.', error)
    unavailable = true
  }
  return <main className="site-shell route-shell"><header className="route-header"><Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link><span className="mono">LIVE LEDGER</span></header><div className="route-inner explore-page"><Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link><section className="explore-hero"><div><p className="eyebrow"><Radio size={14} /> LIVE LEDGER / PUBLIC RECORD</p><h1>Notable incidents.</h1><p>A live feed of the moments Chogs would prefer to keep private.</p></div><div className="streak-badge"><Flame size={18} /><span>PLAY DAILY</span></div></section><nav className="filter-nav" aria-label="Ledger filters">{[['newest','Newest'],['titles','Titles'],['rivalries','Rivalries']].map(([value,label]) => <Link key={value} className={filter === value ? 'filter-active' : ''} href={value === 'newest' ? '/explore' : `/explore?filter=${value}`}>{label}</Link>)}</nav>{unavailable ? <div className="timeline-empty"><strong>LEDGER TEMPORARILY UNAVAILABLE</strong><span>Please try again shortly.</span></div> : events.length === 0 ? <div className="timeline-empty"><strong>NO INCIDENTS ON RECORD</strong><span>The ledger is quiet. Suspiciously quiet.</span></div> : <div className="explore-feed">{events.map((event) => <article className="explore-card" key={`${event.token_id}-${event.day}-${event.text}`}><div className="timeline-meta"><span className="mono">{event.day}</span><span className={`event-chip chip-${event.color}`}>{event.stamp}</span></div><p>{event.text}</p><Link href={`/chog/${event.token_id}#entries`}>Read Chog #{event.token_id}&apos;s file <span>↗</span></Link></article>)}</div>}</div><div className="mobile-nav"><Link href="/">Archive</Link><Link className="nav-active" href="/explore">Explore</Link><Link href="/demo">Demo</Link></div></main>
}

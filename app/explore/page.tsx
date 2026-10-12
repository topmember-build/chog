import Link from 'next/link'
import { ArrowLeft, Flame, Radio } from 'lucide-react'
import { getExploreEvents, normalizeFilter } from '@/lib/retention-server'
import { getPublicStoryFeed } from '@/lib/story-store'

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams
  const filter = normalizeFilter(params.filter || null)
  let events: Awaited<ReturnType<typeof getExploreEvents>> = []
  let stories: Awaited<ReturnType<typeof getPublicStoryFeed>> = []
  let ledgerUnavailable = false
  let storiesUnavailable = false

  try {
    events = await getExploreEvents(filter)
  } catch (error) {
    console.error('Could not render the Chog public ledger.', error)
    ledgerUnavailable = true
  }

  try {
    stories = await getPublicStoryFeed()
  } catch (error) {
    console.error('Could not render the public Chog story feed.', error)
    storiesUnavailable = true
  }

  return (
    <main className="site-shell route-shell">
      <header className="route-header">
        <Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG CHRONICLES</span></Link>
        <span className="mono">EXPLORE / PUBLIC STORIES</span>
      </header>
      <div className="route-inner explore-page">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>

        <section className="explore-hero">
          <div>
            <p className="eyebrow"><Radio size={14} /> PUBLIC STORY FEED</p>
            <h1>Stories that stay with their Chog.</h1>
            <p>Read daily adventure outcomes and chapters written by current Chog owners. Only real saved stories appear here.</p>
          </div>
          <div className="streak-badge"><Flame size={18} /><span>PUBLIC ARCHIVE</span></div>
        </section>

        <section className="public-story-feed" aria-labelledby="public-story-heading">
          <div className="entries-header">
            <h2 id="public-story-heading">Latest stories <span>({String(stories.length).padStart(2, '0')})</span></h2>
            <Link className="trial-feed-link" href="/trial">Try the sandbox instead ↗</Link>
          </div>
          {storiesUnavailable ? (
            <div className="timeline-empty"><strong>STORY FEED TEMPORARILY UNAVAILABLE</strong><span>Please try again shortly.</span></div>
          ) : stories.length === 0 ? (
            <div className="timeline-empty"><strong>NO STORIES ON RECORD</strong><span>Real stories will appear here after Chog holders save them.</span></div>
          ) : (
            <div className="public-story-list">
              {stories.map((story) => (
                <article className="public-story-card" key={story.id}>
                  <div className="timeline-meta">
                    <span className="mono">{new Date(story.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC', dateStyle: 'medium' })} / UTC</span>
                    <span className={`event-chip ${story.kind === 'owner-chapter' ? 'chip-purple' : 'chip-green'}`}>
                      {story.kind === 'owner-chapter' ? 'OWNER CHAPTER' : 'DAILY ADVENTURE'}
                    </span>
                  </div>
                  <h3>{story.title}</h3>
                  <p>{story.storyText}</p>
                  <span className="mono public-story-detail">{story.detail}</span>
                  <Link href={`/chog/${encodeURIComponent(story.tokenId)}`}>
                    Read Chog #{story.tokenId}&apos;s file <span>↗</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="public-ledger" aria-labelledby="ledger-heading">
          <div className="explore-hero ledger-heading">
            <div>
              <p className="eyebrow"><Radio size={14} /> LIVE LEDGER / PUBLIC RECORD</p>
              <h2 id="ledger-heading">Notable incidents.</h2>
              <p>A live feed of the moments Chogs would prefer to keep private.</p>
            </div>
            <div className="streak-badge"><Flame size={18} /><span>PLAY DAILY</span></div>
          </div>
          <nav className="filter-nav" aria-label="Ledger filters">
            {[['newest', 'Newest'], ['titles', 'Titles'], ['rivalries', 'Rivalries']].map(([value, label]) => (
              <Link key={value} className={filter === value ? 'filter-active' : ''} href={value === 'newest' ? '/explore' : `/explore?filter=${value}`}>
                {label}
              </Link>
            ))}
          </nav>
          {ledgerUnavailable ? (
            <div className="timeline-empty"><strong>LEDGER TEMPORARILY UNAVAILABLE</strong><span>Please try again shortly.</span></div>
          ) : events.length === 0 ? (
            <div className="timeline-empty"><strong>NO INCIDENTS ON RECORD</strong><span>The ledger is quiet. Suspiciously quiet.</span></div>
          ) : (
            <div className="explore-feed">
              {events.map((event) => (
                <article className="explore-card" key={`${event.token_id}-${event.day}-${event.text}`}>
                  <div className="timeline-meta"><span className="mono">{event.day}</span><span className={`event-chip chip-${event.color}`}>{event.stamp}</span></div>
                  <p>{event.text}</p>
                  <Link href={`/chog/${event.token_id}#entries`}>Read Chog #{event.token_id}&apos;s file <span>↗</span></Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="mobile-nav"><Link href="/">Archive</Link><Link className="nav-active" href="/explore">Explore</Link><Link href="/trial">Trial</Link></div>
    </main>
  )
}

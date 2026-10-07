import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { EventChip, EmptyState } from '@/components/chog-system'
import { chogs } from '@/lib/chog-data'

export default async function ChogPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params
  const chog = chogs.find((item) => item.tokenId === tokenId)

  if (!chog) {
    return (
      <main className="site-shell route-shell">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
        <EmptyState />
      </main>
    )
  }

  return (
    <main className="site-shell route-shell">
      <header className="route-header">
        <Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG WORLD ORDER</span></Link>
        <span className="mono">FILE No. {chog.tokenId}</span>
      </header>
      <div className="route-inner">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
        <section className="file-header">
          <div><p className="eyebrow">DIVISION OF CHAOS RECORDS / ACTIVE FILE</p><h1>{chog.name}</h1><p className="file-summary">Subject: mischievous. Quirk: {chog.quirk}.</p></div>
          <span className="stamp stamp-green">{chog.status}</span>
        </section>
        <div className="file-layout">
          <div className="file-photo"><img src={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} /><span className="mono">IDENTIFICATION PHOTOGRAPH / TAKEN UNDER PROTEST</span></div>
          <div className="field-assessment">
            <p className="eyebrow">FIELD ASSESSMENT</p>
            {([
              ['TOKEN ID', chog.tokenId],
              ['KNOWN QUIRK', chog.quirk],
              ['STATUS', chog.status],
              ['FILE NOTE', 'Subject denies involvement.'],
            ] as const).map(([label, value]) => <div className="field-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            <button className="primary-button"><span>Play today&apos;s adventure</span><ArrowUpRight size={16} /></button>
          </div>
        </div>
        <div className="entries-header"><h2>Life entries <span>({String(chog.events.length).padStart(2, '0')})</span></h2><span className="mono">NEWEST FIRST</span></div>
        <div className="file-entries" id="entries">
          {chog.events.map((event) => (
            <article className="file-entry" key={event.day}>
              <span className="mono">{event.day}</span>
              <div><p>{event.text}</p><span className="mono entry-note">INCIDENT REPORTED / SUBJECT DENIES INVOLVEMENT</span></div>
              <EventChip color={event.color}>{event.stamp}</EventChip>
            </article>
          ))}
        </div>
      </div>
      <div className="mobile-nav"><Link href="/">Archive</Link><a href="#entries">Entries</a><a href="#play">Play</a></div>
    </main>
  )
}

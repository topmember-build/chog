import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, BookOpen, Flag, Heart, Medal, ShieldAlert, Skull, Sparkles } from 'lucide-react'
import { EventChip, EmptyState } from '@/components/chog-system'
import type { LifeEvent } from '@/lib/chog-data'
import { getOnchainChog } from '@/lib/chog-server'

const eventDetails: Record<LifeEvent['stamp'], { icon: typeof Flag; className: string; label: string }> = {
  TITLE: { icon: BookOpen, className: 'timeline-purple', label: 'Origin record' },
  SCAR: { icon: ShieldAlert, className: 'timeline-red', label: 'A scar earned' },
  FRIEND: { icon: Heart, className: 'timeline-blue', label: 'Ally identified' },
  RIVAL: { icon: Skull, className: 'timeline-red', label: 'Rival logged' },
  MILESTONE: { icon: Medal, className: 'timeline-green', label: 'Milestone reached' },
}

function personalityFor(quirk: string) {
  return {
    tone: quirk.includes('paperwork') || quirk.includes('handbook') ? 'Bureaucratic' : 'Suspiciously cheerful',
    quirk,
    fear: quirk.includes('vacuum') ? 'Household appliances' : 'Being perceived',
    catchphrase: quirk.includes('box') ? 'This is my kingdom now.' : 'Subject denies everything.',
  }
}

export default async function ChogPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params
  const chog = await getOnchainChog(tokenId)

  if (!chog) {
    return <main className="site-shell route-shell"><Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link><EmptyState message="NO CHOG ON RECORD" /></main>
  }

  const personality = personalityFor(chog.quirk)
  const dayCount = Math.max(...chog.events.map((event) => Number(event.day.replace(/\D/g, ''))))

  return (
    <main className="site-shell route-shell">
      <header className="route-header"><Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG WORLD ORDER</span></Link><span className="mono">FILE No. {chog.tokenId}</span></header>
      <div className="route-inner">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link>
        <section className="file-header">
          <div><p className="eyebrow"><span className="registration" />DIVISION OF CHAOS RECORDS / ACTIVE FILE</p><h1>{chog.name}</h1><p className="file-summary">A stranger&apos;s Chog, currently writing its own evidence.</p></div>
          <span className="stamp stamp-green">{chog.status}</span>
        </section>

        <section className="file-layout">
          <div className="file-photo"><img src={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} /><span className="mono">IDENTIFICATION PHOTOGRAPH / TAKEN UNDER PROTEST</span></div>
          <div className="personality-card"><div className="personality-heading"><p className="eyebrow">PERSONALITY CARD</p><Sparkles size={17} /></div><div className="personality-grid"><div><span>TONE</span><strong>{personality.tone}</strong></div><div><span>QUIRK</span><strong>{personality.quirk}</strong></div><div><span>FEAR</span><strong>{personality.fear}</strong></div><div><span>CATCHPHRASE</span><strong>&ldquo;{personality.catchphrase}&rdquo;</strong></div></div><div className="day-count"><span className="mono">LIFE RECORDED</span><strong>DAY {String(dayCount).padStart(3, '0')}</strong></div><button className="primary-button adventure-button" disabled title="Only the owner can play today&apos;s adventure"><span>Play today&apos;s adventure</span><ArrowUpRight size={16} /></button><p className="disabled-note">Only the Chog&apos;s keeper can open today&apos;s chapter.</p><button className="share-button" type="button"><ArrowUpRight size={15} /> Share this Chog&apos;s story</button></div>
        </section>

        <section className="timeline-section" id="entries"><div className="entries-header"><div><p className="eyebrow">THE LIFE OF {chog.name.toUpperCase()}</p><h2>Chapters <span>({String(chog.events.length).padStart(2, '0')})</span></h2></div><span className="mono">NEWEST FIRST</span></div>
          {chog.events.length === 0 ? <div className="timeline-empty"><BookOpen size={26} /><strong>No chapters yet.</strong><span>The first incident is still being investigated.</span></div> : <div className="timeline">{chog.events.map((event, index) => { const detail = eventDetails[event.stamp]; const Icon = detail.icon; return <article className={`timeline-event ${detail.className}`} style={{ '--delay': `${index * 90}ms` } as React.CSSProperties} key={`${event.day}-${event.text}`}><div className="timeline-marker"><Icon size={17} /></div><div className="timeline-content"><div className="timeline-meta"><span className="mono">{event.day}</span><EventChip color={event.color}>{event.stamp}</EventChip></div><h3>{event.text}</h3><p className="entry-note mono">{detail.label} / SUBJECT DENIES INVOLVEMENT</p></div></article> })}</div>}
        </section>
      </div>
      <div className="mobile-nav"><Link href="/">Archive</Link><a href="#entries">Chapters</a><a href="#entries">Read</a></div>
    </main>
  )
}

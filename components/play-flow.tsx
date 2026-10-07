'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Volume2, VolumeX, Zap } from 'lucide-react'
import type { Adventure, Chog, LifeEvent } from '@/lib/chog-data'

export default function PlayFlow({ tokenId, chog }: { tokenId: string; chog: (Chog & { traits?: Record<string, string>; owner?: string }) | null }) {
  const [screen, setScreen] = useState(0)
  const [beat, setBeat] = useState(0)
  const [adventure, setAdventure] = useState<{ adventureId: string; title: string; beats: string[]; choices: { id: string; label: string }[] } | null>(null)
  const [result, setResult] = useState<{ outcome: string; events: LifeEvent[] } | null>(null)
  const [sound, setSound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!chog) return <main className="site-shell play-shell"><Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link><div className="play-empty"><strong>NO CHOG ON RECORD</strong><span>This adventure has no subject.</span></div></main>

  async function begin() {
    setLoading(true); setError('')
    try { const response = await fetch('/api/adventure/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tokenId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The archive is unavailable.'); setAdventure(data); setScreen(1) } catch (e) { setError(e instanceof Error ? e.message : 'The archive is unavailable.') } finally { setLoading(false) }
  }

  async function choose(choiceId: string) {
    if (!adventure) return
    setLoading(true); setError('')
    try { const response = await fetch('/api/adventure/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tokenId, adventureId: adventure.adventureId, choiceId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The outcome could not be recorded.'); setResult(data); setScreen(3) } catch (e) { setError(e instanceof Error ? e.message : 'The outcome could not be recorded.') } finally { setLoading(false) }
  }

  return <main className="site-shell play-shell">
    <header className="play-header"><Link href={`/chog/${tokenId}`} className="back-link"><ArrowLeft size={16} /> Exit chapter</Link><button className="sound-toggle" onClick={() => setSound(!sound)} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />} {sound ? 'SOUND ON' : 'SOUND OFF'}</button></header>
    <div className="play-progress"><span style={{ width: `${Math.min(100, ((screen + 1) / 4) * 100)}%` }} /></div>
    {error && <p className="disabled-note" role="alert">{error}</p>}
    <section className={`play-stage stage-${screen}`}>
      {screen === 0 && <div className="play-intro"><img src={chog.image} alt={`${chog.name}, the Chog`} /><p className="eyebrow">DAY {String(chog.events.length + 1).padStart(3, '0')} / WAKE SEQUENCE</p><h1>Waking up.</h1><p className="voice-line">&ldquo;{chog.traits?.catchphrase || 'Subject denies everything.'}&rdquo;</p><p className="play-caption">{chog.name} opens one eye. The day has already started without permission.</p><button className="primary-button play-action" onClick={begin} disabled={loading}><span>{loading ? 'Consulting the archive' : 'Begin today&apos;s chapter'}</span><Zap size={17} /></button></div>}
      {screen === 1 && adventure && <div className="play-narration"><span className="chapter-label">{adventure.title}</span><div className="beat-card"><p>{adventure.beats[beat]}</p></div><p className="beat-count mono">BEAT {beat + 1} / {adventure.beats.length}</p><button className="primary-button play-action" onClick={() => beat < adventure.beats.length - 1 ? setBeat(beat + 1) : setScreen(2)} disabled={loading}><span>{beat < adventure.beats.length - 1 ? 'Continue' : 'Make a choice'}</span><Zap size={17} /></button></div>}
      {screen === 2 && adventure && <div className="play-choice"><p className="eyebrow">THE MOMENT IS YOURS</p><h1>{adventure.title}</h1><p className="play-caption">What does {chog.name} do?</p><div className="choice-list">{adventure.choices.map((item, index) => <button key={item.id} className="choice-button" onClick={() => choose(item.id)} disabled={loading}><span className="choice-number">0{index + 1}</span><strong>{item.label}</strong><span>{loading ? 'Recording...' : 'Choose this path'}</span></button>)}</div></div>}
      {screen === 3 && result && <div className="play-outcome"><span className="stamp stamp-green">OUTCOME RECORDED</span><h1>{result.outcome}</h1>{result.events.map((event) => <div className="earned-event" key={event.text}><span className="mono">CHAPTER EARNED / {event.stamp}</span><p>{event.text}</p></div>)}<p className="play-caption">The archive has made a note. Your Chog has made a mess.</p><Link className="primary-button play-action" href={`/chog/${tokenId}`}><span>See the new chapter</span><Zap size={17} /></Link><button className="share-button play-share" type="button">Share today&apos;s adventure</button></div>}
    </section><footer className="play-footer"><span className="mono">CHOG WORLD ORDER / ADVENTURE ENGINE</span><span className="mono">UNDER 60 SECONDS</span></footer>
  </main>
}

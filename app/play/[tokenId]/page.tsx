'use client'

import Link from 'next/link'
import { use, useMemo, useState } from 'react'
import { ArrowLeft, Volume2, VolumeX, Zap } from 'lucide-react'
import { adventures, chogs } from '@/lib/chog-data'

export default function PlayPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = use(params)
  const chog = chogs.find((item) => item.tokenId === tokenId)
  const adventure = useMemo(() => adventures[Number.parseInt(tokenId, 10) % adventures.length], [tokenId])
  const [screen, setScreen] = useState(0)
  const [beat, setBeat] = useState(0)
  const [choice, setChoice] = useState<typeof adventure.choices[number] | null>(null)
  const [sound, setSound] = useState(false)

  if (!chog) return <main className="site-shell play-shell"><Link href="/" className="back-link"><ArrowLeft size={16} /> Back to archive</Link><div className="play-empty"><strong>NO CHOG ON RECORD</strong><span>This adventure has no subject.</span></div></main>

  const begin = () => setScreen(1)
  const nextBeat = () => beat < adventure.beats.length - 1 ? setBeat(beat + 1) : setScreen(2)
  const choose = (selected: typeof adventure.choices[number]) => { setChoice(selected); setScreen(3) }

  return <main className="site-shell play-shell">
    <header className="play-header"><Link href={`/chog/${chog.tokenId}`} className="back-link"><ArrowLeft size={16} /> Exit chapter</Link><button className="sound-toggle" onClick={() => setSound(!sound)} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />} {sound ? 'SOUND ON' : 'SOUND OFF'}</button></header>
    <div className="play-progress"><span style={{ width: `${Math.min(100, ((screen + 1) / 4) * 100)}%` }} /></div>
    <section className={`play-stage stage-${screen}`}>
      {screen === 0 && <div className="play-intro"><img src={chog.image} alt={`${chog.name}, the Chog`} /><p className="eyebrow">DAY {String(chog.events.length + 1).padStart(3, '0')} / WAKE SEQUENCE</p><h1>Waking up.</h1><p className="voice-line">&ldquo;{chog.quirk.includes('box') ? 'This is my kingdom now.' : 'Subject denies everything.'}&rdquo;</p><p className="play-caption">{chog.name} opens one eye. The day has already started without permission.</p><button className="primary-button play-action" onClick={begin}><span>Begin today&apos;s chapter</span><Zap size={17} /></button></div>}
      {screen === 1 && <div className="play-narration"><span className="chapter-label">{adventure.title}</span><div className="beat-card"><p>{adventure.beats[beat]}</p></div><p className="beat-count mono">BEAT {beat + 1} / {adventure.beats.length}</p><button className="primary-button play-action" onClick={nextBeat}><span>{beat < adventure.beats.length - 1 ? 'Continue' : 'Make a choice'}</span><Zap size={17} /></button></div>}
      {screen === 2 && <div className="play-choice"><p className="eyebrow">THE MOMENT IS YOURS</p><h1>{adventure.title}</h1><p className="play-caption">What does {chog.name} do?</p><div className="choice-list">{adventure.choices.map((item, index) => <button key={item.label} className="choice-button" onClick={() => choose(item)}><span className="choice-number">0{index + 1}</span><strong>{item.label}</strong><span>Choose this path</span></button>)}</div></div>}
      {screen === 3 && choice && <div className="play-outcome"><span className="stamp stamp-green">OUTCOME RECORDED</span><h1>{choice.outcome}</h1><div className="earned-event"><span className="mono">CHAPTER EARNED / {choice.event.stamp}</span><p>{choice.event.text}</p></div><p className="play-caption">The archive has made a note. Your Chog has made a mess.</p><Link className="primary-button play-action" href={`/chog/${chog.tokenId}`}><span>See the new chapter</span><Zap size={17} /></Link><button className="share-button play-share" type="button">Share today&apos;s adventure</button></div>}
    </section>
    <footer className="play-footer"><span className="mono">CHOG WORLD ORDER / ADVENTURE ENGINE</span><span className="mono">UNDER 60 SECONDS</span></footer>
  </main>
}

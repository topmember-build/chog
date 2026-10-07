'use client'

import { useState } from 'react'
import { ArrowRight, Check, ChevronRight, FileText, Volume2, VolumeX } from 'lucide-react'

const entries = [
  { day: 'DAY 014', text: 'Subject escaped the garden. Returned with a leaf in mouth.', stamp: 'MILESTONE', tone: 'green' },
  { day: 'DAY 009', text: 'Declared war on the vacuum cleaner. The vacuum remains undefeated.', stamp: 'SCAR', tone: 'red' },
  { day: 'DAY 003', text: 'First successful nap. Witnesses report suspicious silence.', stamp: 'TITLE', tone: 'purple' },
]

function Stamp({ children, tone = 'green' }: { children: string; tone?: string }) {
  return <span className={`stamp stamp-${tone}`} aria-label={`Status: ${children}`}>{children}</span>
}

function Rule() {
  return <div className="rule" aria-hidden="true"><span /><span /></div>
}

export default function Page() {
  const [fileNumber, setFileNumber] = useState('0267')
  const [soundOn, setSoundOn] = useState(false)
  const [notice, setNotice] = useState('')

  function openFile(event: React.FormEvent) {
    event.preventDefault()
    setNotice(fileNumber === '0267' ? 'File opened.' : 'No file on record. Try FILE No. 0267.')
  }

  return (
    <main className="site-shell">
      <div className="paper-noise" aria-hidden="true" />
      <header className="topbar">
        <a href="#top" className="wordmark"><span className="mark">C</span><span>CHOG WORLD ORDER</span></a>
        <nav aria-label="Primary navigation">
          <a href="#dossier">The archive</a>
          <a href="#adventure">Daily report</a>
          <button className="sound-toggle" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />} <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
          </button>
        </nav>
      </header>

      <div className="ticker" aria-label="Latest archive activity"><span className="ticker-label">LATEST ENTRY</span><span>DAY 014 — SUBJECT ESCAPED THE GARDEN — FILE UPDATED — </span><span aria-hidden="true">DAY 014 — SUBJECT ESCAPED THE GARDEN — FILE UPDATED —</span></div>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="registration" /> DIVISION OF CHAOS RECORDS / EST. 2024</p>
          <h1>The official<br /><em>file system</em><br />of Chog.</h1>
          <p className="hero-lede">Every Chog has a story. We keep the evidence, the incidents, and the very questionable decisions.</p>
          <a href="#dossier" className="paper-button primary">Open the archive <ArrowRight size={17} /></a>
        </div>
        <div className="folder-wrap" aria-label="Featured Chog dossier">
          <div className="folder-tab">CONFIDENTIAL / 0267</div>
          <div className="folder">
            <div className="folder-header"><span>CHOG WORLD ORDER</span><span>FILE No. 0267</span></div>
            <div className="portrait"><div className="portrait-ear left" /><div className="portrait-ear right" /><div className="chog-face"><span className="eye one" /><span className="eye two" /><span className="snout" /><span className="mouth" /></div><div className="portrait-caption">SUBJECT PHOTOGRAPH<br /><strong>TAKEN UNDER PROTEST</strong></div></div>
            <div className="folder-name">MARMALADE<br /><small>Known aliases: Marm, The Orange One</small></div>
            <div className="folder-footer"><Stamp tone="green">TITLE HOLDER</Stamp><span>ACTIVE FILE</span></div>
          </div>
          <div className="folder-note">Handle with care.<br />Or don&apos;t. It&apos;s a Chog.</div>
        </div>
      </section>

      <section className="lookup-section" id="dossier">
        <div><p className="eyebrow">ARCHIVE ACCESS</p><h2>Pull a file<br /><em>by number.</em></h2></div>
        <form className="lookup-form" onSubmit={openFile}><label htmlFor="file-number">FILE NUMBER</label><div className="input-row"><FileText size={18} /><input id="file-number" value={fileNumber} onChange={(e) => setFileNumber(e.target.value)} inputMode="numeric" aria-describedby="lookup-notice" /><button type="submit" aria-label="Open file"><ChevronRight size={20} /></button></div><p id="lookup-notice" className="form-note">Try 0267. It&apos;s the one everyone is talking about.</p>{notice && <p className="notice" role="status">{notice}</p>}</form>
      </section>

      <Rule />

      <section className="feature-dossier">
        <div className="section-heading"><div><p className="eyebrow">FILE No. 0267 / ACTIVE</p><h2>Meet <em>Marmalade.</em></h2></div><Stamp tone="red">HIGHLY SUSPECT</Stamp></div>
        <div className="dossier-grid">
          <div className="id-card"><div className="id-card-top"><span>IDENTIFICATION CARD</span><span>0267-A</span></div><div className="mini-portrait"><div className="mini-face"><span className="eye one" /><span className="eye two" /><span className="snout" /></div></div><div className="id-name">MARMALADE</div><div className="id-meta">ORIGIN: UNDER THE SOFA<br />STATUS: UNRELIABLE</div><Stamp tone="purple">CHOG VERIFIED</Stamp></div>
          <div className="assessment"><div className="assessment-head"><h3>Field assessment</h3><span>LAST UPDATED / DAY 014</span></div><div className="fields"><div className="field"><label>TONE</label><strong>mischievous</strong></div><div className="field"><label>QUIRK</label><strong>collects forbidden socks</strong></div><div className="field"><label>FEAR</label><strong>the blue mop</strong></div><div className="field"><label>CATCHPHRASE</label><strong>&quot;Wasn&apos;t me.&quot;</strong></div></div><p className="assessment-note">Assessment made by an unlicensed professional. Accuracy not guaranteed.</p></div>
        </div>
        <div className="entries-head"><h3>Entries <span>(03)</span></h3><span>NEWEST FIRST <ChevronRight size={14} /></span></div>
        <div className="entries">{entries.map((entry) => <article className="entry" key={entry.day}><div className="entry-day">{entry.day}<br /><span>2024</span></div><div className="entry-body"><p>{entry.text}</p><span className="entry-annotation">INCIDENT REPORTED / SUBJECT DENIES INVOLVEMENT</span></div><Stamp tone={entry.tone}>{entry.stamp}</Stamp></article>)}</div>
      </section>

      <section className="adventure" id="adventure"><div><p className="eyebrow">DAILY REPORT / DAY 015</p><h2>Today&apos;s adventure<br /><em>is pending.</em></h2><p>Make a decision. Accept the consequences. Add it to the record.</p></div><a href="#adventure" className="paper-button primary">Play today&apos;s adventure <ArrowRight size={17} /></a></section>

      <footer><span>CHOG WORLD ORDER. DIVISION OF CHAOS RECORDS.</span><span>ALL INCIDENTS ARE FINAL.</span></footer>
      <div className="mobile-action"><a href="#adventure">Play today&apos;s adventure <ArrowRight size={16} /></a></div>
    </main>
  )
}

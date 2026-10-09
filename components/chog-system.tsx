'use client'

import Link from 'next/link'
import { ArrowUpRight, Dice5, FileSearch, Fingerprint, Menu, Volume2 } from 'lucide-react'

import { chogs, type Chog } from '@/lib/chog-data'

export function PrimaryButton({ children, href = '#lookup', variant = 'primary' }: { children: React.ReactNode; href?: string; variant?: 'primary' | 'paper' }) { return <Link href={href} className={`primary-button ${variant}`}><span>{children}</span><ArrowUpRight size={16} aria-hidden="true" /></Link> }
export function EventChip({ children, color = 'purple' }: { children: React.ReactNode; color?: string }) { return <span className={`event-chip chip-${color}`}>{children}</span> }
export function EmptyState({ message = 'NO FILE ON RECORD' }: { message?: string }) { return <div className="empty-state"><Fingerprint size={28} /><strong>{message}</strong><span>Archive search returned no usable evidence.</span></div> }
export function ChogCard({ chog }: { chog: Chog }) { return <Link href={`/chog/${chog.tokenId}`} className="chog-card"><div className="card-photo"><img src={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} width={640} height={480} loading="lazy" /><span className="card-file">FILE No. {chog.tokenId}</span></div><div className="card-copy"><div><h3>{chog.name}</h3><p>{chog.quirk}</p></div><ArrowUpRight size={18} aria-hidden="true" /></div></Link> }
export function Header() { return <header className="site-header"><Link href="/" className="wordmark"><span className="wordmark-mark">C</span><span>CHOG WORLD ORDER</span></Link><nav><Link href="#archive">Archive</Link><Link href="#events">Recent events</Link><button aria-label="Sound off"><Volume2 size={16} /> <span>Sound off</span></button></nav><button className="menu-button" aria-label="Open menu"><Menu size={20} /></button></header> }
export function LedgerStrip() { const events = chogs.flatMap((c) => c.events.map((e) => ({ ...e, name: c.name }))).slice(0, 6); return <div className="ledger-strip" id="events"><div className="ledger-label">LIVE LEDGER / <span>RECENT</span></div><div className="ledger-track">{events.map((event, index) => <div className="ledger-item" key={`${event.day}-${index}`}><span className="ledger-day">{event.day}</span><span>{event.name}: {event.text}</span><EventChip color={event.color}>{event.stamp}</EventChip></div>)}</div></div> }
export function LookupForm() { return <form className="lookup-box" action="/chog"><label htmlFor="tokenId"><FileSearch size={16} /> PULL A FILE BY NUMBER</label><div className="lookup-row"><input id="tokenId" name="tokenId" placeholder="e.g. 0267" inputMode="numeric" required /><button type="submit" aria-label="Open file"><ArrowUpRight size={18} /></button></div><div className="lookup-actions"><button type="button" onClick={() => { window.location.href = `/chog/${chogs[Math.floor(Math.random() * chogs.length)].tokenId}` }}><Dice5 size={15} /> Random Chog</button><span>8 files indexed / all subjects questionable</span></div></form> }
 

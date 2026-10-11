'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Chog } from '@/lib/chog-types'
import { IdPhoto } from '@/components/id-photo'
import { FEATURED_TOKEN_IDS } from '@/lib/chog-constants'

function isChog(value: unknown): value is Chog {
  if (typeof value !== 'object' || value === null) return false
  if (
    !('tokenId' in value) ||
    typeof value.tokenId !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('image' in value) ||
    (typeof value.image !== 'string' && value.image !== null) ||
    !('owner' in value) ||
    typeof value.owner !== 'string' ||
    !/^0x[0-9a-fA-F]{40}$/.test(value.owner) ||
    !('traits' in value) ||
    !Array.isArray(value.traits)
  ) {
    return false
  }

  return value.traits.every((trait) =>
    typeof trait === 'object' &&
    trait !== null &&
    'trait_type' in trait &&
    typeof trait.trait_type === 'string' &&
    'value' in trait &&
    typeof trait.value === 'string'
  )
}

function FeaturedChogCard({ chog }: { chog: Chog }) {
  const traitSummary = chog.traits.slice(0, 2)
    .map((trait) => `${trait.trait_type}: ${trait.value}`)
    .join(' / ')

  return (
    <Link href={`/chog/${chog.tokenId}`} className="chog-card">
      <div className="card-photo">
        <IdPhoto image={chog.image} alt={`${chog.name}, Chog file ${chog.tokenId}`} />
        <span className="card-file">FILE No. {chog.tokenId}</span>
      </div>
      <div className="card-copy">
        <div><h3>{chog.name}</h3><p>{traitSummary || 'NO TRAITS LISTED'}</p></div>
        <ArrowUpRight size={18} aria-hidden="true" />
      </div>
    </Link>
  )
}

export function FeaturedChogs() {
  const [chogs, setChogs] = useState<Chog[]>([])
  const [unavailableCount, setUnavailableCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFeaturedChogs() {
      const results = await Promise.allSettled(FEATURED_TOKEN_IDS.map(async (tokenId) => {
        const response = await fetch(`/api/chog/${tokenId}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload: unknown = await response.json()
        if (!response.ok) {
          const message = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'This Chog could not be loaded.'
          throw new Error(message)
        }
        if (!isChog(payload)) throw new Error('Chog response had an invalid format.')
        return payload
      }))

      if (controller.signal.aborted) return
      const available = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
      setChogs(available)
      setUnavailableCount(results.length - available.length)
      setLoaded(true)
    }

    void loadFeaturedChogs()
    return () => controller.abort()
  }, [])

  const featuredSubject = chogs[0]

  return (
    <>
      <div className="hero-dossier">
        <div className="dossier-tab">LIVE NFT / FEATURED FILE</div>
        <div className="dossier-card">
          <div className="dossier-meta">
            <span>{featuredSubject ? 'FEATURED FILE' : loaded ? 'CHAIN READ UNAVAILABLE' : 'LOADING FEATURED FILE'}</span>
            <span>{featuredSubject ? `TOKEN ${featuredSubject.tokenId}` : 'MONAD / 143'}</span>
          </div>
          <div className="featured-photo">
            <IdPhoto image={featuredSubject?.image ?? null} alt={featuredSubject ? `${featuredSubject.name}, featured Chog` : 'Featured Chog photo pending'} />
          </div>
          <div className="dossier-caption">
            <div><span className="mono">NFT DISPLAY NAME</span><h2>{featuredSubject?.name ?? (loaded ? 'File unavailable' : 'Loading…')}</h2></div>
            {featuredSubject && <span className="stamp stamp-green">ON CHAIN</span>}
          </div>
          <div className="dossier-footer">
            <span>{featuredSubject ? `${featuredSubject.traits.length} REAL NFT TRAITS` : loaded ? 'TRY AGAIN WHEN THE CHAIN IS AVAILABLE' : 'READING FROM MONAD'}</span>
            <span>{featuredSubject ? 'VERIFIED' : loaded ? 'PENDING' : 'LOADING'}</span>
          </div>
        </div>
        <div className="margin-note">Handle with care.<br />Or don&apos;t.</div>
      </div>

      <section className="archive" id="archive">
        <div className="section-heading">
          <div><p className="eyebrow">LIVE FROM MONAD / CHAIN 143</p><h2>Featured Chogs</h2></div>
          <span className="archive-mark">3 FEATURED / LOOK UP ANY TOKEN</span>
        </div>
        {chogs.length > 0 && <div className="chog-grid">{chogs.map((chog) => <FeaturedChogCard key={chog.tokenId} chog={chog} />)}</div>}
        {!loaded && <p className="archive-notice" role="status">Loading featured Chogs from Monad…</p>}
        {loaded && unavailableCount > 0 && (
          <p className="archive-notice" role="status">
            {chogs.length === 0 ? 'Live Monad data is temporarily unavailable. No sample files are shown.' : `${unavailableCount} featured file${unavailableCount === 1 ? ' is' : 's are'} temporarily unavailable from Monad.`}{' '}
            <button className="story-text-button" type="button" onClick={() => window.location.reload()}>Try again</button>.
          </p>
        )}
      </section>
    </>
  )
}

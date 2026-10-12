'use client'

import { useState, type ComponentType } from 'react'
import { BookOpen } from 'lucide-react'

type StoryExperienceComponent = ComponentType<{ tokenId: string; ownerWallet: string; appId: string | null }>

export function StoryAdventureLoader({
  tokenId,
  ownerWallet,
  appId,
}: {
  tokenId: string
  ownerWallet: string
  appId: string | null
}) {
  const [Experience, setExperience] = useState<StoryExperienceComponent | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openAdventure() {
    setLoading(true)
    setError(null)
    try {
      const module = await import('./story-adventure-session')
      setExperience(() => module.StoryAdventureSession)
    } catch {
      setError('The story experience could not load. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (Experience) return <Experience tokenId={tokenId} ownerWallet={ownerWallet} appId={appId} />

  return (
    <section className="story-launcher">
      <p>Read a Chog&apos;s story and daily adventure. After your wallet is verified as the current owner, you can add your own chapters too.</p>
      <button className="primary-button paper" type="button" disabled={loading} onClick={openAdventure}>
        <BookOpen size={16} aria-hidden="true" />
        {loading ? 'Opening today’s adventure…' : 'Open today’s adventure'}
      </button>
      {error && <p className="story-error" role="alert">{error}</p>}
    </section>
  )
}

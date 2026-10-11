'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookOpen, LockKeyhole } from 'lucide-react'
import { useIdentityToken, useLogin, usePrivy } from '@privy-io/react-auth'
import { PrivySessionProvider } from '@/components/privy-wallet-session'

type AdventureChoice = { id: string; label: string }
type StoryEntry = {
  tokenId: string
  playDate: string
  adventureId: string
  prompt: string
  choiceId: string
  choiceLabel: string
  storyText: string
  createdAt: string
}
type AdventureResponse = {
  adventure: { id: string; date: string; prompt: string; choices: AdventureChoice[] }
  todayEntry: StoryEntry | null
  entries: StoryEntry[]
}

function StoryBoard({ tokenId }: { tokenId: string }) {
  const [data, setData] = useState<AdventureResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingChoice, setPendingChoice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const { ready, authenticated, error: privyError, getAccessToken } = usePrivy()
  const { login } = useLogin({
    onComplete: () => setActionError(null),
    onError: (errorCode) => {
      console.error('Privy wallet login failed.', errorCode)
      setActionError(`Wallet sign-in failed (Privy error: ${errorCode}). Close the wallet prompt and try again. If it keeps failing, share this error code.`)
    },
  })
  const { identityToken } = useIdentityToken()
  const endpoint = `/api/chog/${encodeURIComponent(tokenId)}/story`

  const refresh = useCallback(async () => {
    setLoadError(null)
    try {
      const response = await fetch(endpoint, { cache: 'no-store' })
      const payload = await response.json() as AdventureResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not load this Chog’s stories.')
      setData(payload)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load this Chog’s stories.')
    }
  }, [endpoint])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function playChoice(choice: AdventureChoice) {
    setPendingChoice(choice.id)
    setActionError(null)
    setNotice(null)
    setPlaying(true)
    try {
      const [accessToken, currentIdentityToken] = await Promise.all([
        getAccessToken(),
        Promise.resolve(identityToken),
      ])
      if (!accessToken || !currentIdentityToken) {
        throw new Error('Your wallet sign-in is still loading. Wait a moment and try again.')
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: currentIdentityToken,
          adventureId: data?.adventure.id,
          choiceId: choice.id,
        }),
      })
      const payload = await response.json() as { entry?: StoryEntry; error?: string }
      if (!response.ok) {
        if (response.status === 409) {
          setNotice(payload.error ?? 'This Chog has already played today.')
          await refresh()
          return
        }
        throw new Error(payload.error ?? 'The story could not be saved.')
      }
      if (!payload.entry) throw new Error('The server did not return the saved story.')
      const entry = payload.entry
      setData((current) => current
        ? { ...current, todayEntry: entry, entries: [entry, ...current.entries] }
        : current)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The story could not be saved.')
    } finally {
      setPendingChoice(null)
      setPlaying(false)
    }
  }

  async function connectWallet() {
    setActionError(null)
    try {
      await login({ loginMethods: ['wallet'] })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Wallet sign-in could not start. Please try again.')
    }
  }

  return (
    <div className="story-experience">
      <div className="story-section-label">
        <span className="eyebrow"><BookOpen size={14} aria-hidden="true" /> TODAY&apos;S ADVENTURE</span>
        {data && <span className="mono">{data.adventure.date} / UTC</span>}
      </div>

      {loadError && <p className="story-error" role="alert">{loadError}</p>}
      {!data && !loadError && <p className="archive-notice" role="status">Loading today&apos;s adventure and story file…</p>}
      {loadError && <button className="story-text-button" type="button" onClick={() => void refresh()}>Try loading again</button>}

      {data && (
        <>
          <h3 className="adventure-prompt">{data.adventure.prompt}</h3>
          {data.todayEntry ? (
            <article className="today-story">
              <span className="stamp stamp-green">TODAY&apos;S ENTRY</span>
              <p>{data.todayEntry.storyText}</p>
              <span className="mono">CHOICE: {data.todayEntry.choiceLabel}</span>
            </article>
          ) : (
            <div className="adventure-play">
              {authenticated ? (
                <>
                  <p className="story-ownership-note"><LockKeyhole size={14} aria-hidden="true" /> The server will confirm you own this Chog before saving.</p>
                  <div className="adventure-choices">
                    {data.adventure.choices.map((choice) => (
                      <button
                        className="adventure-choice"
                        key={choice.id}
                        type="button"
                        disabled={playing || !ready || !identityToken}
                        onClick={() => void playChoice(choice)}
                      >
                        {pendingChoice === choice.id ? 'Saving…' : choice.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="story-sign-in">
                  <p>Sign in with the wallet that currently owns this Chog to make a choice.</p>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!ready}
                    onClick={() => void connectWallet()}
                  >
                    <LockKeyhole size={15} aria-hidden="true" />
                    {ready ? 'Connect owner wallet' : 'Preparing wallet sign-in…'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {(privyError || actionError || notice) && (
        <p className={notice ? 'story-notice' : 'story-error'} role={notice ? 'status' : 'alert'}>
          {notice ?? actionError ?? (privyError ? `Wallet sign-in error: ${privyError.message}` : '')}
        </p>
      )}

      {data && (
        <div className="story-history">
          <div className="entries-header">
            <h3>Earlier entries <span>({String(data.entries.length).padStart(2, '0')})</span></h3>
            <span className="mono">TOKEN {tokenId}</span>
          </div>
          {data.entries.length > 0 ? data.entries.map((entry) => (
            <article className="story-entry" key={`${entry.tokenId}-${entry.playDate}`}>
              <span className="mono">{entry.playDate}</span>
              <div><p>{entry.storyText}</p><span className="mono entry-note">{entry.choiceLabel}</span></div>
            </article>
          )) : <p className="archive-notice">No stories have been added to this file yet.</p>}
        </div>
      )}
    </div>
  )
}

function PublicStoryArchive({ tokenId }: { tokenId: string }) {
  const [entries, setEntries] = useState<StoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/chog/${encodeURIComponent(tokenId)}/story`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json() as { entries?: StoryEntry[]; error?: string }
        if (!response.ok) throw new Error(payload.error ?? 'Story entries could not be loaded.')
        if (active) setEntries(payload.entries ?? [])
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Story entries could not be loaded.')
      })
    return () => { active = false }
  }, [tokenId])

  if (error) return <p className="story-error" role="alert">{error}</p>
  if (!entries) return <p className="archive-notice" role="status">Loading this Chog&apos;s story file…</p>
  return (
    <div className="story-history">
      <p className="story-error" role="alert">Wallet sign-in is not configured, so new adventures are unavailable.</p>
      <div className="entries-header">
        <h3>Earlier entries <span>({String(entries.length).padStart(2, '0')})</span></h3>
        <span className="mono">TOKEN {tokenId}</span>
      </div>
      {entries.length > 0 ? entries.map((entry) => (
        <article className="story-entry" key={`${entry.tokenId}-${entry.playDate}`}>
          <span className="mono">{entry.playDate}</span>
          <div><p>{entry.storyText}</p><span className="mono entry-note">{entry.choiceLabel}</span></div>
        </article>
      )) : <p className="archive-notice">No stories have been added to this file yet.</p>}
    </div>
  )
}

export function StoryAdventureSession({
  tokenId,
  appId,
}: {
  tokenId: string
  appId: string | null
}) {
  if (!appId) {
    return (
      <div className="story-experience">
        <PublicStoryArchive tokenId={tokenId} />
      </div>
    )
  }

  return (
    <PrivySessionProvider appId={appId}>
      <StoryBoard tokenId={tokenId} />
    </PrivySessionProvider>
  )
}

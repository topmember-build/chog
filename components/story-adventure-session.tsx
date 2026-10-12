'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { BookOpen, LockKeyhole } from 'lucide-react'
import { useIdentityToken, useLinkAccount, useLogin, usePrivy } from '@privy-io/react-auth'

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
type CustomStoryChapter = {
  id: string
  title: string
  storyText: string
  createdAt: string
}
type AdventureResponse = {
  adventure: { id: string; date: string; prompt: string; choices: AdventureChoice[] }
  todayEntry: StoryEntry | null
  entries: StoryEntry[]
}
type OwnershipStatus =
  | { state: 'checking' }
  | { state: 'verified'; ownerWallet: string; userId: string }
  | { state: 'wallet-required' }
  | { state: 'not-owner' }
  | { state: 'error'; message: string }

function StoryBoard({ tokenId, ownerWallet }: { tokenId: string; ownerWallet: string }) {
  const [data, setData] = useState<AdventureResponse | null>(null)
  const [chapters, setChapters] = useState<CustomStoryChapter[] | null>(null)
  const [chapterLoadError, setChapterLoadError] = useState<string | null>(null)
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterText, setChapterText] = useState('')
  const [savingChapter, setSavingChapter] = useState(false)
  const [chapterError, setChapterError] = useState<string | null>(null)
  const [chapterActionError, setChapterActionError] = useState<string | null>(null)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState('')
  const [editingChapterText, setEditingChapterText] = useState('')
  const [mutatingChapterId, setMutatingChapterId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingChoice, setPendingChoice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [ownership, setOwnership] = useState<OwnershipStatus | null>(null)
  const [ownershipCheckAttempt, setOwnershipCheckAttempt] = useState(0)
  const { ready, authenticated, user, error: privyError, getAccessToken } = usePrivy()
  const { login } = useLogin({
    onComplete: () => setActionError(null),
    onError: (errorCode) => {
      if (errorCode === 'exited_auth_flow') {
        setActionError(null)
        return
      }
      console.error('Privy wallet login failed.', errorCode)
      setActionError(`Wallet sign-in failed (Privy error: ${errorCode}). Close the wallet prompt and try again. If it keeps failing, share this error code.`)
    },
  })
  const { linkWallet } = useLinkAccount({
    onSuccess: () => {
      setOwnership({ state: 'checking' })
      setOwnershipCheckAttempt((attempt) => attempt + 1)
    },
    onError: (errorCode) => {
      if (errorCode === 'exited_auth_flow') return
      setOwnership({ state: 'error', message: `Could not link wallet (Privy error: ${errorCode}).` })
    },
  })
  const { identityToken } = useIdentityToken()
  const endpoint = `/api/chog/${encodeURIComponent(tokenId)}/story`
  const chaptersEndpoint = `/api/chog/${encodeURIComponent(tokenId)}/chapters`
  const userId = user?.id
  const linkedEthereumWallets = user?.linkedAccounts.flatMap((account) => {
    if (account.type === 'wallet' && account.chainType === 'ethereum') return [account.address]
    if (account.type === 'smart_wallet') return [account.address]
    return []
  }) ?? []
  const linkedWalletMatchesOwner = linkedEthereumWallets.some(
    (address) => address.toLowerCase() === ownerWallet.toLowerCase(),
  )
  const shortOwnerWallet = `${ownerWallet.slice(0, 6)}…${ownerWallet.slice(-4)}`
  const ownershipMatchesUser = ownership?.state === 'verified' && ownership.userId === userId
  const canSubmit = ready && authenticated && Boolean(identityToken) && ownershipMatchesUser

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

  const refreshChapters = useCallback(async () => {
    setChapterLoadError(null)
    try {
      const response = await fetch(chaptersEndpoint, { cache: 'no-store' })
      const payload = await response.json() as { chapters?: CustomStoryChapter[]; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Custom chapters could not be loaded.')
      setChapters(payload.chapters ?? [])
    } catch (error) {
      setChapterLoadError(error instanceof Error ? error.message : 'Custom chapters could not be loaded.')
    }
  }, [chaptersEndpoint])

  useEffect(() => {
    void refreshChapters()
  }, [refreshChapters])

  useEffect(() => {
    if (!ready || !authenticated) {
      setOwnership(null)
      return
    }
    if (!identityToken) {
      setOwnership({ state: 'checking' })
      const timeoutId = window.setTimeout(() => {
        setOwnership({
          state: 'error',
          message: 'Privy has not provided an identity token for this session. Refresh your sign-in, then check ownership again.',
        })
      }, 10_000)
      return () => window.clearTimeout(timeoutId)
    }

    if (!userId) {
      setOwnership({ state: 'error', message: 'Privy has not provided an account ID. Sign in again, then check ownership.' })
      return
    }

    let active = true
    const controller = new AbortController()
    let timeoutId: number
    setOwnership({ state: 'checking' })

    async function verifyOwnership() {
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) throw new Error('Privy could not provide a sign-in token. Sign in again and retry.')

        const response = await fetch(`/api/chog/${encodeURIComponent(tokenId)}/ownership`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identityToken }),
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await response.json() as {
          verified?: boolean
          ownerWallet?: string
          code?: string
          error?: string
        }
        if (!active) return

        if (response.ok && payload.verified && payload.ownerWallet && userId) {
          setOwnership({ state: 'verified', ownerWallet: payload.ownerWallet, userId })
        } else if (payload.code === 'WALLET_REQUIRED') {
          setOwnership({ state: 'wallet-required' })
        } else if (payload.code === 'NOT_CURRENT_OWNER') {
          setOwnership({ state: 'not-owner' })
        } else {
          setOwnership({
            state: 'error',
            message: payload.error ?? 'Ownership could not be verified. Please retry.',
          })
        }
      } catch (error) {
        if (active) {
          setOwnership({
            state: 'error',
            message: controller.signal.aborted
              ? 'The owner check timed out. Check your connection, then try again.'
              : error instanceof Error ? error.message : 'Ownership could not be verified. Please retry.',
          })
        }
      }
    }

    timeoutId = window.setTimeout(() => {
      controller.abort()
      if (active) {
        setOwnership({
          state: 'error',
          message: 'The owner check timed out. Check your connection, then try again.',
        })
      }
    }, 20_000)
    void verifyOwnership()
    return () => {
      active = false
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [authenticated, getAccessToken, identityToken, ownershipCheckAttempt, ready, tokenId, userId])

  async function playChoice(choice: AdventureChoice) {
    if (!canSubmit) {
      setActionError('Verify that your signed-in wallet owns this Chog before adding to its story.')
      return
    }

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
      const payload = await response.json() as { entry?: StoryEntry; error?: string; code?: string }
      if (!response.ok) {
        if (response.status === 409) {
          setNotice(payload.error ?? 'This Chog has already played today.')
          await refresh()
          return
        }
        if (payload.code === 'NOT_CURRENT_OWNER') {
          setOwnership({ state: 'not-owner' })
        } else if (payload.code === 'WALLET_REQUIRED') {
          setOwnership({ state: 'wallet-required' })
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

  async function addChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      setChapterError('Verify that your signed-in wallet owns this Chog before adding a chapter.')
      return
    }

    setSavingChapter(true)
    setChapterError(null)
    setNotice(null)
    try {
      const [accessToken, currentIdentityToken] = await Promise.all([
        getAccessToken(),
        Promise.resolve(identityToken),
      ])
      if (!accessToken || !currentIdentityToken) {
        throw new Error('Your wallet sign-in is still loading. Wait a moment and try again.')
      }

      const response = await fetch(chaptersEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: currentIdentityToken,
          title: chapterTitle,
          storyText: chapterText,
        }),
      })
      const payload = await response.json() as {
        chapter?: CustomStoryChapter
        error?: string
        code?: string
      }
      if (!response.ok) {
        if (payload.code === 'NOT_CURRENT_OWNER') setOwnership({ state: 'not-owner' })
        if (payload.code === 'WALLET_REQUIRED') setOwnership({ state: 'wallet-required' })
        throw new Error(payload.error ?? 'The chapter could not be saved.')
      }
      const chapter = payload.chapter
      if (!chapter) throw new Error('The server did not return the saved chapter.')
      setChapters((current) => [...(current ?? []), chapter])
      setChapterTitle('')
      setChapterText('')
    } catch (error) {
      setChapterError(error instanceof Error ? error.message : 'The chapter could not be saved.')
    } finally {
      setSavingChapter(false)
    }
  }

  function startEditingChapter(chapter: CustomStoryChapter) {
    setChapterActionError(null)
    setEditingChapterId(chapter.id)
    setEditingChapterTitle(chapter.title)
    setEditingChapterText(chapter.storyText)
  }

  async function updateChapter(event: FormEvent<HTMLFormElement>, chapterId: string) {
    event.preventDefault()
    if (!canSubmit) {
      setChapterActionError('Verify that your signed-in wallet owns this Chog before editing a chapter.')
      return
    }

    setMutatingChapterId(chapterId)
    setChapterActionError(null)
    try {
      const [accessToken, currentIdentityToken] = await Promise.all([
        getAccessToken(),
        Promise.resolve(identityToken),
      ])
      if (!accessToken || !currentIdentityToken) {
        throw new Error('Your wallet sign-in is still loading. Wait a moment and try again.')
      }

      const response = await fetch(chaptersEndpoint + '/' + encodeURIComponent(chapterId), {
        method: 'PATCH',
        headers: {
          Authorization: 'Bear' + 'er ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: currentIdentityToken,
          title: editingChapterTitle,
          storyText: editingChapterText,
        }),
      })
      const payload = await response.json() as { chapter?: CustomStoryChapter; error?: string; code?: string }
      if (!response.ok) {
        if (payload.code === 'NOT_CURRENT_OWNER') setOwnership({ state: 'not-owner' })
        if (payload.code === 'WALLET_REQUIRED') setOwnership({ state: 'wallet-required' })
        throw new Error(payload.error ?? 'The chapter could not be updated.')
      }
      const updatedChapter = payload.chapter
      if (!updatedChapter) throw new Error('The server did not return the updated chapter.')
      setChapters((current) => current?.map((chapter) => chapter.id === chapterId ? updatedChapter : chapter) ?? [])
      setEditingChapterId(null)
    } catch (error) {
      setChapterActionError(error instanceof Error ? error.message : 'The chapter could not be updated.')
    } finally {
      setMutatingChapterId(null)
    }
  }

  async function deleteChapter(chapter: CustomStoryChapter) {
    if (!window.confirm('Delete "' + chapter.title + '" from this Chog story file? This cannot be undone.')) return
    if (!canSubmit) {
      setChapterActionError('Verify that your signed-in wallet owns this Chog before deleting a chapter.')
      return
    }

    setMutatingChapterId(chapter.id)
    setChapterActionError(null)
    try {
      const [accessToken, currentIdentityToken] = await Promise.all([
        getAccessToken(),
        Promise.resolve(identityToken),
      ])
      if (!accessToken || !currentIdentityToken) {
        throw new Error('Your wallet sign-in is still loading. Wait a moment and try again.')
      }

      const response = await fetch(chaptersEndpoint + '/' + encodeURIComponent(chapter.id), {
        method: 'DELETE',
        headers: {
          Authorization: 'Bear' + 'er ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identityToken: currentIdentityToken }),
      })
      const payload = await response.json() as { deleted?: boolean; error?: string; code?: string }
      if (!response.ok) {
        if (payload.code === 'NOT_CURRENT_OWNER') setOwnership({ state: 'not-owner' })
        if (payload.code === 'WALLET_REQUIRED') setOwnership({ state: 'wallet-required' })
        throw new Error(payload.error ?? 'The chapter could not be deleted.')
      }
      if (!payload.deleted) throw new Error('The server did not confirm that the chapter was deleted.')
      setChapters((current) => current?.filter((item) => item.id !== chapter.id) ?? [])
      if (editingChapterId === chapter.id) setEditingChapterId(null)
    } catch (error) {
      setChapterActionError(error instanceof Error ? error.message : 'The chapter could not be deleted.')
    } finally {
      setMutatingChapterId(null)
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

      <div className={`story-owner-status ${ownershipMatchesUser ? 'story-owner-verified' : ''}`} aria-live="polite">
        {!ready ? (
          <p role="status">Preparing wallet sign-in and owner verification…</p>
        ) : !authenticated ? (
          <div>
            <p><strong>Wallet not signed in.</strong> Anyone can read this Chog&apos;s file, but only its current owner can make a choice or add a chapter.</p>
            <button className="primary-button" type="button" onClick={() => void connectWallet()}>
              <LockKeyhole size={15} aria-hidden="true" />
              Connect owner wallet
            </button>
          </div>
        ) : !ownershipMatchesUser && (!ownership || ownership.state === 'checking' || ownership.state === 'verified') ? (
          <p role="status">{linkedEthereumWallets.length === 0
            ? `No Ethereum wallet is linked to this account. The current Monad owner of Chog #${tokenId} is ${shortOwnerWallet}.`
            : linkedWalletMatchesOwner
              ? `Owner match: linked wallet ${shortOwnerWallet} is the current owner of Chog #${tokenId} on Monad. Confirming your Privy session with the server…`
              : `Not the current owner: none of this account’s linked wallets matches ${shortOwnerWallet}, the Monad owner of Chog #${tokenId}. Confirming with the server…`}</p>
        ) : ownershipMatchesUser && !identityToken ? (
          <p role="status">Ownership is verified. Refreshing your sign-in token before enabling story changes…</p>
        ) : ownership?.state === 'verified' ? (
          <p><LockKeyhole size={14} aria-hidden="true" /> <strong>Owner verified.</strong> Linked wallet {`${ownership.ownerWallet.slice(0, 6)}…${ownership.ownerWallet.slice(-4)}`} is the current owner of Chog #{tokenId} on Monad. You can add, edit, or delete chapters and play today&apos;s adventure.</p>
        ) : ownership?.state === 'wallet-required' ? (
          <div>
            <p><strong>No Ethereum wallet is linked to this account.</strong> Link the wallet that currently owns Chog #{tokenId}; the app will verify it on Monad.</p>
            <button className="primary-button" type="button" onClick={() => linkWallet()}>
              <LockKeyhole size={15} aria-hidden="true" />
              Link owner wallet
            </button>
          </div>
        ) : ownership?.state === 'not-owner' ? (
          <div>
            <p><strong>This account is not the current owner of Chog #{tokenId}.</strong> Its linked Ethereum wallets do not match the owner on Monad. You can still read the file; link the owner wallet to add a chapter or play.</p>
            <button className="primary-button" type="button" onClick={() => linkWallet()}>
              <LockKeyhole size={15} aria-hidden="true" />
              Link another wallet
            </button>
          </div>
        ) : ownership?.state === 'error' ? (
          <div>
            <p className="story-error" role="alert">
              Could not verify current ownership for Chog #{tokenId}: {ownership.message}{' '}
              {linkedEthereumWallets.length === 0
                ? 'This account has no linked Ethereum wallet.'
                : linkedWalletMatchesOwner
                  ? 'A linked wallet matches the current owner shown on the Monad record.'
                  : 'None of this account’s linked wallets matches the current owner shown on the Monad record.'}
            </p>
            <button className="story-text-button" type="button" onClick={() => setOwnershipCheckAttempt((attempt) => attempt + 1)}>
              Check ownership again
            </button>
          </div>
        ) : null}
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
              {canSubmit ? (
                <div className="adventure-choices">
                  {data.adventure.choices.map((choice) => (
                    <button
                      className="adventure-choice"
                      key={choice.id}
                      type="button"
                      disabled={playing}
                      onClick={() => void playChoice(choice)}
                    >
                      {pendingChoice === choice.id ? 'Saving…' : choice.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="archive-notice">Adventure choices unlock after the current owner is verified.</p>
              )}
            </div>
          )}
        </>
      )}

      <section className="custom-chapter">
        <div className="entries-header">
          <h3>Write a chapter <span>({String(chapters?.length ?? 0).padStart(2, '0')})</span></h3>
          <span className="mono">OWNER-ADDED</span>
        </div>
        {canSubmit ? (
          <form className="custom-chapter-form" onSubmit={(event) => void addChapter(event)}>
            <label>
              Chapter title
              <input
                value={chapterTitle}
                onChange={(event) => setChapterTitle(event.target.value)}
                maxLength={80}
                required
              />
            </label>
            <label>
              Your story
              <textarea
                value={chapterText}
                onChange={(event) => setChapterText(event.target.value)}
                maxLength={2000}
                rows={6}
                required
              />
              <span className="mono">{chapterText.length}/2000</span>
            </label>
            <button className="primary-button" type="submit" disabled={savingChapter}>
              {savingChapter ? 'Saving chapter…' : 'Add chapter to this Chog'}
            </button>
            {chapterError && <p className="story-error" role="alert">{chapterError}</p>}
          </form>
        ) : (
          <p className="archive-notice">Chapter writing unlocks after the current owner is verified above.</p>
        )}
        {chapterLoadError && <p className="story-error" role="alert">{chapterLoadError}</p>}
        {chapterActionError && <p className="story-error" role="alert">{chapterActionError}</p>}
        {!chapters && !chapterLoadError && <p className="archive-notice" role="status">Loading owner-written chapters…</p>}
        {chapters && chapters.length > 0 && (
          <div className="custom-chapter-list">
            {chapters.map((chapter, index) => (
              <div className="story-entry" key={chapter.id}>
                <span className="mono">CHAPTER {String(index + 1).padStart(2, '0')}</span>
                {editingChapterId === chapter.id ? (
                  <form className="custom-chapter-form" onSubmit={(event) => void updateChapter(event, chapter.id)}>
                    <label>
                      Chapter title
                      <input
                        value={editingChapterTitle}
                        onChange={(event) => setEditingChapterTitle(event.target.value)}
                        maxLength={80}
                        required
                      />
                    </label>
                    <label>
                      Your story
                      <textarea
                        value={editingChapterText}
                        onChange={(event) => setEditingChapterText(event.target.value)}
                        maxLength={2000}
                        rows={6}
                        required
                      />
                      <span className="mono">{editingChapterText.length}/2000</span>
                    </label>
                    <div className="chapter-actions">
                      <button className="primary-button" type="submit" disabled={mutatingChapterId !== null}>
                        {mutatingChapterId === chapter.id ? 'Saving changes…' : 'Save changes'}
                      </button>
                      <button className="story-text-button" type="button" disabled={mutatingChapterId !== null} onClick={() => setEditingChapterId(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h4>{chapter.title}</h4>
                    <p>{chapter.storyText}</p>
                    <span className="mono entry-note">{new Date(chapter.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC', dateStyle: 'medium' })} / UTC</span>
                    {canSubmit && (
                      <div className="chapter-actions">
                        <button className="story-text-button" type="button" disabled={mutatingChapterId !== null} onClick={() => startEditingChapter(chapter)}>
                          Edit chapter
                        </button>
                        <button className="story-text-button" type="button" disabled={mutatingChapterId !== null} onClick={() => void deleteChapter(chapter)}>
                          {mutatingChapterId === chapter.id ? 'Deleting…' : 'Delete chapter'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {chapters?.length === 0 && !chapterLoadError && <p className="archive-notice">No owner-written chapters yet. The current Chog holder can add the first one.</p>}
      </section>

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
  const [chapters, setChapters] = useState<CustomStoryChapter[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const basePath = `/api/chog/${encodeURIComponent(tokenId)}`
    Promise.all([
      fetch(`${basePath}/story`, { cache: 'no-store' }),
      fetch(`${basePath}/chapters`, { cache: 'no-store' }),
    ])
      .then(async ([storyResponse, chaptersResponse]) => {
        const [storyPayload, chaptersPayload] = await Promise.all([
          storyResponse.json() as Promise<{ entries?: StoryEntry[]; error?: string }>,
          chaptersResponse.json() as Promise<{ chapters?: CustomStoryChapter[]; error?: string }>,
        ])
        if (!storyResponse.ok) throw new Error(storyPayload.error ?? 'Story entries could not be loaded.')
        if (!chaptersResponse.ok) throw new Error(chaptersPayload.error ?? 'Custom chapters could not be loaded.')
        if (active) {
          setEntries(storyPayload.entries ?? [])
          setChapters(chaptersPayload.chapters ?? [])
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Story entries could not be loaded.')
      })
    return () => { active = false }
  }, [tokenId])

  if (error) return <p className="story-error" role="alert">{error}</p>
  if (!entries || !chapters) return <p className="archive-notice" role="status">Loading this Chog&apos;s story file…</p>
  return (
    <div className="story-history">
      <p className="story-error" role="alert">Wallet sign-in is not configured, so adding chapters is unavailable.</p>
      <div className="entries-header">
        <h3>Owner-written chapters <span>({String(chapters.length).padStart(2, '0')})</span></h3>
        <span className="mono">TOKEN {tokenId}</span>
      </div>
      {chapters.length > 0 ? chapters.map((chapter, index) => (
        <article className="story-entry" key={chapter.id}>
          <span className="mono">CHAPTER {String(index + 1).padStart(2, '0')}</span>
          <div>
            <h4>{chapter.title}</h4>
            <p>{chapter.storyText}</p>
            <span className="mono entry-note">{new Date(chapter.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC', dateStyle: 'medium' })} / UTC</span>
          </div>
        </article>
      )) : <p className="archive-notice">No owner-written chapters yet.</p>}
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
  ownerWallet,
  appId,
}: {
  tokenId: string
  ownerWallet: string
  appId: string | null
}) {
  if (!appId) {
    return (
      <div className="story-experience">
        <PublicStoryArchive tokenId={tokenId} />
      </div>
    )
  }

  return <StoryBoard tokenId={tokenId} ownerWallet={ownerWallet} />
}

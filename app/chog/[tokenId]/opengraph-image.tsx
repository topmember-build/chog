import { ImageResponse } from 'next/og'
import { getOnchainChog } from '@/lib/chog-server'

export default async function Image({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params
  const chog = await getOnchainChog(tokenId)
  const name = chog?.name || `Chog #${tokenId}`
  const event = chog?.events[0]?.text || 'The story is just beginning.'
  return new ImageResponse(
    <div
      style={{
        background: '#f5eddf',
        color: '#171513',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '70px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', color: '#e75239', fontSize: 22, letterSpacing: 4 }}>
        CHOG CHRONICLES / OFFICIAL FILE
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 80 }}>
        <div style={{ display: 'flex', fontSize: 82, fontWeight: 800 }}>{name}</div>
        <div
          style={{
            display: 'flex',
            background: '#e75239',
            color: 'white',
            borderRadius: 999,
            padding: '12px 22px',
            fontSize: 18,
          }}
        >
          FILE {tokenId}
        </div>
      </div>
      <div style={{ display: 'flex', fontSize: 34, marginTop: 42, maxWidth: 900 }}>{event}</div>
      <div style={{ display: 'flex', marginTop: 'auto', fontSize: 24 }}>
        Your Chog has a life. Every day adds a chapter.
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}

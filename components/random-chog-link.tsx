'use client'

import { Dice5 } from 'lucide-react'

export function RandomChogLink({ featuredTokenIds }: { featuredTokenIds: readonly string[] }) {
  return (
    <button
      type="button"
      onClick={() => {
        const tokenId = featuredTokenIds[Math.floor(Math.random() * featuredTokenIds.length)]
        window.location.href = `/chog/${tokenId}`
      }}
    >
      <Dice5 size={15} aria-hidden="true" /> Random Chog
    </button>
  )
}

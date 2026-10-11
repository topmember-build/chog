'use client'

import { useState } from 'react'

export function IdPhoto({ image, alt }: { image: string | null; alt: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null)

  if (!image || failedImage === image) {
    return <div className="photo-pending" role="img" aria-label="Photo pending"><span>PHOTO PENDING</span></div>
  }

  return <img src={image} alt={alt} onError={() => setFailedImage(image)} />
}

import { redirect } from 'next/navigation'

export default async function ChogLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ tokenId?: string | string[] }>
}) {
  const { tokenId } = await searchParams
  if (typeof tokenId !== 'string' || !/^\d{1,78}$/.test(tokenId)) redirect('/')
  redirect(`/chog/${encodeURIComponent(tokenId)}`)
}

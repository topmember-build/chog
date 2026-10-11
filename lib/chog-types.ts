export type ChogAddress = `0x${string}`

export type ChogTrait = {
  trait_type: string
  value: string
}

export type Chog = {
  tokenId: string
  name: string
  image: string | null
  owner: ChogAddress
  traits: ChogTrait[]
}

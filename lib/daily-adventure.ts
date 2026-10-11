export type DailyAdventureChoice = {
  id: string
  label: string
  storyText: string
}

export type DailyAdventure = {
  id: string
  prompt: string
  choices: DailyAdventureChoice[]
}

const adventures: DailyAdventure[] = [
  {
    id: 'midnight-mail',
    prompt: 'A tiny envelope lands at the Chog’s feet after midnight. It is addressed to “whoever needs a little courage.”',
    choices: [
      { id: 'deliver', label: 'Deliver it before sunrise', storyText: 'Before sunrise, the Chog delivered the little envelope. Someone woke up feeling remembered, and the Chog carried a bit more courage home.' },
      { id: 'open', label: 'Read it together under a lamp', storyText: 'The Chog opened the little envelope beneath a warm lamp. Its kind words turned a quiet night into a promise to keep going.' },
      { id: 'keep-safe', label: 'Keep it safe until the right moment', storyText: 'The Chog tucked the envelope somewhere safe. Some messages need a patient heart, and the Chog was happy to wait.' },
    ],
  },
  {
    id: 'cloud-parade',
    prompt: 'A wandering cloud has lost its way home and is following the Chog down the street.',
    choices: [
      { id: 'lead', label: 'Lead a parade to the hilltop', storyText: 'The Chog led a tiny parade up the hill. At the top, the cloud found its friends and sent a silver patch of shade as thanks.' },
      { id: 'map', label: 'Draw a map in the dust', storyText: 'The Chog drew a map in the dust, with a star where the cloud belonged. The cloud drifted home, leaving one soft raindrop like a signed postcard.' },
      { id: 'picnic', label: 'Share a snack and hear its story', storyText: 'The Chog shared a snack with the lost cloud. By the time the story was done, the wind had remembered the way home.' },
    ],
  },
  {
    id: 'garden-light',
    prompt: 'A small light is glowing beneath a cracked flowerpot in the old courtyard.',
    choices: [
      { id: 'lift', label: 'Lift the pot carefully', storyText: 'The Chog lifted the pot carefully and found a seed glowing in the dark. It planted the seed, and the courtyard gained a new little star.' },
      { id: 'call', label: 'Invite a neighbor to help', storyText: 'The Chog invited a neighbor to help. Together they found a sleepy firefly and returned it to the garden, where it blinked a grateful hello.' },
      { id: 'wait', label: 'Sit quietly and watch', storyText: 'The Chog sat quietly beside the light. A flower slowly opened around it, proving that some wonders arrive when nobody rushes them.' },
    ],
  },
]

export function getDailyAdventure(date = new Date()): DailyAdventure & { date: string } {
  const utcDate = date.toISOString().slice(0, 10)
  const dayNumber = Math.floor(Date.parse(`${utcDate}T00:00:00.000Z`) / 86_400_000)
  const adventure = adventures[((dayNumber % adventures.length) + adventures.length) % adventures.length]
  return { ...adventure, date: utcDate }
}

export function getDailyAdventureChoice(
  adventureId: string,
  choiceId: string,
): DailyAdventureChoice | undefined {
  const adventure = adventures.find((item) => item.id === adventureId)
  return adventure?.choices.find((choice) => choice.id === choiceId)
}

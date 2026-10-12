import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Fingerprint, Heart, Repeat2, ShieldCheck } from 'lucide-react'
import { Header, PrimaryButton } from '@/components/chog-system'

export const metadata: Metadata = {
  title: 'About Chog Chronicles',
  description: 'What Chog Chronicles is, why stories belong to Chogs, and how live NFT files and owner-verified daily stories work.',
}

const principles = [
  {
    icon: Fingerprint,
    title: 'The file belongs to the token',
    text: 'A wallet can change. The Chog token has its own on-chain number. Chog Chronicles attaches its story to that number, so ownership can change without making the story start over.',
  },
  {
    icon: BookOpen,
    title: 'A little story, one day at a time',
    text: 'The daily adventure is short: read a few lines, make one choice, and see what gets added to the file. It is meant to be a small daily ritual, not a long game to learn.',
  },
  {
    icon: Repeat2,
    title: 'The next owner can pick up the story',
    text: 'If a Chog gets a new owner, its token number stays the same. A token-keyed story can stay with that Chog instead of being left behind in someone else’s account.',
  },
]

const roadmap = [
  {
    status: 'LIVE',
    title: 'Read real Chog NFT files',
    text: 'Look up a token number to load its current owner, metadata name, image, and traits from the Monad contract and NFT metadata. You do not need to sign in to read.',
  },
  {
    status: 'LIVE',
    title: 'Prove ownership before adding a story',
    text: 'The server verifies Privy sign-in and checks its linked Ethereum wallet against the token’s current owner on Monad before saving. A wallet address typed into a page is never enough proof.',
  },
  {
    status: 'LIVE',
    title: 'Play, save, and revisit',
    text: 'The current owner can choose one server-defined outcome per Chog per UTC day. The result is saved in PostgreSQL under the token ID and shown in that Chog’s public story file. Streaks and trial play are not implemented.',
  },
  {
    status: 'PLANNED',
    title: 'Explore and try a clearly marked trial',
    text: 'A public feed will show real stories, while a separate Trial Chog will let people try the experience without changing a real Chog’s file.',
  },
]

const questions = [
  {
    question: 'Why are there only three Chogs on the homepage?',
    answer: 'Those are featured examples, not the whole collection. Use “Look up a Chog” to request any token number; the app checks that number against the live collection contract. The homepage is not yet a complete browsable catalog of every token.',
  },
  {
    question: 'Why can a Chog’s name number differ from its file number?',
    answer: 'The NFT has an on-chain token ID, and its metadata has a display name. They are not guaranteed to match. For example, token ID 1889 has the metadata name “CHOG #1381”. The file is keyed by 1889, because that is the actual token ID.',
  },
  {
    question: 'Do I need a wallet to read a file?',
    answer: 'No. File lookup and saved stories are public. A wallet is required only to add a daily story, and the server checks its current on-chain ownership.',
  },
  {
    question: 'Does signing in send a transaction?',
    answer: 'No. Signing in is an identity step; it does not write to the blockchain. Reading NFT details and saving a daily story do not require a transaction.',
  },
  {
    question: 'Are stories saved?',
    answer: 'Yes. The owner’s choice is saved as a token-keyed PostgreSQL entry, limited to one per UTC day, and stays with that Chog if its owner changes. The server resolves the story outcome and verifies current ownership before saving.',
  },
]

export default function AboutPage() {
  return (
    <main className="site-shell about-shell">
      <div className="paper-noise" aria-hidden="true" />
      <Header />
      <div className="about-wrap">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Chog files</Link>

        <section className="about-hero">
          <p className="eyebrow"><span className="registration" /> THE IDEA / A FILE THAT FOLLOWS ITS CHOG</p>
          <h1>Your Chog has a life.<br /><em>Its story should travel with it.</em></h1>
          <p className="about-lede">Chog Chronicles is a daily story game for Chog holders. Each Chog gets a file of its own. The current owner plays a tiny adventure, makes one choice, and the result becomes part of that Chog’s story.</p>
          <p className="about-caveat"><strong>What works today:</strong> live Chog NFT file lookup, owner-verified daily adventures, and public token-keyed story files.</p>
        </section>

        <section className="about-principles">
          <div className="about-section-title">
            <p className="eyebrow">WHY THIS IS DIFFERENT / 01</p>
            <h2>A story about the Chog<br /><em>should stay with the Chog.</em></h2>
          </div>
          <p className="about-section-intro">Most games attach progress to a player account. Chog Chronicles attaches the story to the NFT itself. The Chog is the main character; the current owner is the person who gets to add the next chapter.</p>
          <div className="principle-list">
            {principles.map(({ icon: Icon, title, text }, index) => (
              <article className="principle-row" key={title}>
                <span className="principle-index">0{index + 1}</span>
                <Icon size={23} aria-hidden="true" />
                <div><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
          <div className="about-callout">
            <Heart size={20} aria-hidden="true" />
            <p><strong>The simple version:</strong> your Chog is the character. The wallet is just how the app checks who may play as its current owner.</p>
          </div>
        </section>

        <section className="about-loop">
          <div className="about-section-title">
            <p className="eyebrow">THE DAILY LOOP / 02</p>
            <h2>One minute.<br /><em>One little decision.</em></h2>
          </div>
          <ol className="about-loop-list">
            <li><span>01</span><div><h3>Open the file</h3><p>Look at the Chog’s name, traits, and the chapters already recorded.</p></div></li>
            <li><span>02</span><div><h3>Play today’s adventure</h3><p>The owner reads a short, playful situation and chooses what the Chog does.</p></div></li>
            <li><span>03</span><div><h3>Add a chapter</h3><p>The choice gets turned into a short entry in that token’s file. Come back tomorrow for the next one.</p></div></li>
            <li><span>04</span><div><h3>Pass the story forward</h3><p>If the token gets a new owner, the new owner can read the same file and continue from there.</p></div></li>
          </ol>
          <p className="about-caveat">A Chog can receive one entry per UTC day. The owner check and story save happen on the server.</p>
        </section>

        <section className="about-status">
          <div className="about-section-title">
            <p className="eyebrow">WHAT IS REAL RIGHT NOW / 03</p>
            <h2>What you can do<br /><em>in this version.</em></h2>
          </div>
          <div className="roadmap-list">
            {roadmap.map((item) => (
              <article className="roadmap-item" key={item.title}>
                <span className={`roadmap-status ${item.status === 'LIVE' ? 'roadmap-live' : ''}`}>{item.status}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </article>
            ))}
          </div>
          <div className="about-proof">
            <ShieldCheck size={21} aria-hidden="true" />
            <p><strong>Live means live:</strong> token existence and current owner are checked on Monad. Name, image, and traits come from the token’s metadata. The display name is never used as a substitute for its token ID.</p>
          </div>
        </section>

        <section className="about-faq">
          <div className="about-section-title">
            <p className="eyebrow">GOOD QUESTIONS / 04</p>
            <h2>Before you open<br /><em>a file.</em></h2>
          </div>
          <div className="faq-list">
            {questions.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <div>
            <p className="eyebrow">START WITH A REAL CHOG</p>
            <h2>Curious? Open a file.</h2>
            <p>Read a Chog’s live NFT details. No wallet or special knowledge required.</p>
          </div>
          <PrimaryButton href="/#lookup">Look up a Chog</PrimaryButton>
          <Link href="/#how-it-works" className="about-secondary-link">Back to the short explanation <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
      <footer className="about-footer"><span>Built for Chogathon 2026. Fan-made, not official.</span><Link href="/">CHOG CHRONICLES / DIVISION OF CHAOS RECORDS</Link></footer>
    </main>
  )
}

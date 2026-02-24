/**
 * Full-deck poker card. Props: card = { rank, suit } (rank 2-14, suit 's'|'h'|'d'|'c'), or faceDown.
 */
const RANK_LABEL = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}
const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_RED = { h: true, d: true }

export default function PokerCard({ card, faceDown = false, size = 'md' }) {
  const sizes = { sm: 'w-12 h-16 text-lg', md: 'w-16 h-20 text-xl', lg: 'w-20 h-28 text-2xl' }
  const sizeCls = sizes[size] || sizes.md

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeCls} rounded-lg bg-gradient-to-br from-[#1a3645] to-[#0f2229] border border-white/10 flex items-center justify-center flex-shrink-0`}
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.2)' }}
      >
        <div className="w-2/3 h-2/3 rounded border border-[var(--color-gold)]/20 opacity-50" />
      </div>
    )
  }

  const rank = card.rank ?? 2
  const suit = (card.suit || 's').toLowerCase()
  const isRed = SUIT_RED[suit]
  const label = RANK_LABEL[rank] ?? '?'
  const symbol = SUIT_SYMBOL[suit] ?? '♠'

  return (
    <div
      className={`${sizeCls} rounded-lg bg-[var(--color-cream)] flex flex-col items-center justify-center border border-white/20 font-display font-semibold flex-shrink-0`}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        color: isRed ? '#b91c1c' : '#0c2d1a',
      }}
    >
      <span className="leading-none">{label}</span>
      <span className="text-[0.65em] mt-0.5" style={{ color: isRed ? '#b91c1c' : '#0c2d1a' }}>{symbol}</span>
    </div>
  )
}

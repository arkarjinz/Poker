import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PokerCard from '../components/PokerCard'
import ChipStack from '../components/ChipStack'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function parseApiError(r, data) {
  const detail = data?.detail
  if (Array.isArray(detail)) return detail[0]?.msg || detail[0] || r.statusText
  return detail || r.statusText
}

const DEFAULT_SESSION = {
  hands_played: 0,
  player_wins: 0,
  ai_wins: 0,
  ties: 0,
  points: 0,
  level: 0,
  win_streak: 0,
  achievements: [],
  opponent_stats: { bet_pct: 0, call_pct: 0, total_actions: 0 },
  challenge_target: 0,
  challenge_max_hands: 0,
  challenge_met: null,
}

const ACHIEVEMENT_NAMES = {
  first_win: 'First blood',
  streak_3: 'Hot streak (3)',
  streak_5: 'On fire (5)',
  bluff_win: 'Bluff master',
  hands_10: 'Veteran (10 hands)',
  hands_25: 'Grinder (25 hands)',
  double_stack: 'Double up',
  comeback: 'Comeback',
  shutout: 'Shutout',
  flush_win: 'Flush',
  straight_win: 'Straight',
}

export default function Game() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aiStyle, setAiStyle] = useState('balanced')
  const [difficulty, setDifficulty] = useState('medium')
  const [challengeMode, setChallengeMode] = useState(false)
  const [yourCards, setYourCards] = useState([])
  const [aiCards, setAiCards] = useState([])
  const [communityCards, setCommunityCards] = useState([])
  const [street, setStreet] = useState('')
  const [handNamePlayer, setHandNamePlayer] = useState('')
  const [handNameAi, setHandNameAi] = useState('')
  const [pot, setPot] = useState(0)
  const [yourStack, setYourStack] = useState(100)
  const [aiStack, setAiStack] = useState(100)
  const [toCall, setToCall] = useState(0)
  const [yourBetThisHand, setYourBetThisHand] = useState(0)
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [legalActions, setLegalActions] = useState([])
  const [handFinished, setHandFinished] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [session, setSession] = useState(DEFAULT_SESSION)
  const [showTheory, setShowTheory] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showGtoHint, setShowGtoHint] = useState(true)
  const [hint, setHint] = useState(null)
  const [config, setConfig] = useState({ starting_stack: 100, small_blind: 1, big_blind: 2, difficulty: 'medium' })
  // Table stakes (real poker: chosen when you sit / start new game)
  const [startingStack, setStartingStack] = useState(100)
  const [smallBlind, setSmallBlind] = useState(1)
  const [bigBlind, setBigBlind] = useState(2)
  const [equity, setEquity] = useState({ win_pct: 0, tie_pct: 0, lose_pct: 0 })
  const [handStrengthPct, setHandStrengthPct] = useState(0)
  const [theory, setTheory] = useState({ break_even_equity_pct: 0, to_call: 0, pot: 0, gto_note: '' })
  const [potAnimating, setPotAnimating] = useState(false)

  // Show the opponent's most recent action (so it stays visible on your turn)
  const lastOpponentAction = history.length > 0
    ? [...history].reverse().find((a) => a.player === 1)
    : null
  const actionLabel = lastOpponentAction
    ? `Opponent ${lastOpponentAction.action}s`
    : null

  // Trigger pot pulse when pot value changes
  useEffect(() => {
    if (pot === 0) return
    setPotAnimating(true)
    const t = setTimeout(() => setPotAnimating(false), 500)
    return () => clearTimeout(t)
  }, [pot])

  const applyState = useCallback((data) => {
    setYourCards(data.your_cards || [])
    setAiCards(data.ai_cards || [])
    setCommunityCards(data.community_cards || [])
    setStreet(data.street || '')
    setHandNamePlayer(data.hand_name_player || '')
    setHandNameAi(data.hand_name_ai || '')
    setPot(data.pot)
    setYourStack(typeof data.your_stack === 'number' ? data.your_stack : Number(data.your_stack) || 0)
    setAiStack(typeof data.ai_stack === 'number' ? data.ai_stack : Number(data.ai_stack) || 0)
    setToCall(data.to_call ?? 0)
    setYourBetThisHand(data.your_bet_this_hand ?? 0)
    setCurrentPlayer(data.current_player)
    setLegalActions(data.legal_actions || [])
    setHandFinished(data.hand_finished)
    setWinner(data.winner)
    setMessage(data.message || '')
    setHistory(data.actions_history || [])
    setSession(data.session ?? DEFAULT_SESSION)
    setEquity(data.equity || { win_pct: 0, tie_pct: 0, lose_pct: 0 })
    setHandStrengthPct(data.hand_strength_pct ?? 0)
    setTheory(data.theory || { break_even_equity_pct: 0, to_call: 0, pot: 0, gto_note: '' })
    if (data.config) {
      setConfig(data.config)
      setStartingStack(data.config.starting_stack ?? 100)
      setSmallBlind(data.config.small_blind ?? 1)
      setBigBlind(data.config.big_blind ?? 2)
    }
  }, [])

  async function newHand(resetStacks = false, startChallenge = false) {
    setError(null)
    setLoading(true)
    setHint(null)
    try {
      const q = new URLSearchParams({ ai_style: aiStyle, difficulty, starting_stack: String(startingStack), small_blind: String(smallBlind), big_blind: String(bigBlind) })
      if (resetStacks) q.set('reset_stacks', 'true')
      if (startChallenge) {
        q.set('challenge_target', '200')
        q.set('challenge_max_hands', '25')
      }
      const r = await fetch(`${API}/poker/new-hand?${q}`, { method: 'POST' })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(parseApiError(r, data))
      }
      const data = await r.json()
      applyState(data)
      if (startChallenge) setChallengeMode(true)
    } catch (e) {
      setError(e.message || 'Failed to start hand. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  async function act(action) {
    setError(null)
    setLoading(true)
    setHint(null)
    try {
      const r = await fetch(`${API}/poker/act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        throw new Error(parseApiError(r, data))
      }
      const data = await r.json()
      applyState(data)
    } catch (e) {
      setError(e.message || 'Action failed. Check connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    newHand()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (handFinished || currentPlayer !== 0 || loading) {
      setHint(null)
      return
    }
    let cancelled = false
    fetch(`${API}/poker/hint`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setHint(d.hint) })
      .catch(() => { if (!cancelled) setHint(null) })
    return () => { cancelled = true }
  }, [yourCards, legalActions, toCall, handFinished, currentPlayer, loading])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (handFinished) {
        if (e.key === 'n' || e.key === 'N') newHand()
        return
      }
      if (currentPlayer !== 0) return
      const key = e.key.toLowerCase()
      if (key === 'c' && legalActions.includes('check')) { e.preventDefault(); act('check') }
      else if (key === 'b' && legalActions.includes('bet')) { e.preventDefault(); act('bet') }
      else if (key === 'f' && legalActions.includes('fold')) { e.preventDefault(); act('fold') }
      else if (key === 'c' && legalActions.includes('call')) { e.preventDefault(); act('call') }
      else if (key === 'r' && legalActions.includes('raise')) { e.preventDefault(); act('raise') }
      else if (key === 'n') { e.preventDefault(); newHand(true) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handFinished, currentPlayer, legalActions])

  const winRate = session.hands_played > 0
    ? Math.round((session.player_wins / session.hands_played) * 100)
    : 0

  const resultText = handFinished && winner !== null
    ? (winner === -1 ? 'Split pot' : winner === 0 ? 'You win' : 'Opponent wins')
    : null

  const potOdds = toCall > 0 && pot >= 0 ? (pot + toCall > 0 ? ((toCall / (pot + toCall)) * 100).toFixed(0) : null) : null

  const opp = session.opponent_stats || { bet_pct: 0, call_pct: 0, total_actions: 0 }
  const inChallenge = session.challenge_max_hands > 0

  return (
    <div className="game-fullscreen bg-[#051a12] flex flex-col">
      <header className="flex-shrink-0 flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 bg-[#0a2419]/90 border-b border-white/5 flex-wrap gap-1.5 md:gap-2">
        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/" className="text-[var(--color-cream)]/90 text-xs md:text-sm font-medium hover:text-[var(--color-gold)] transition">
            ← Home
          </Link>
          <Link to="/how-to-play" className="text-[var(--color-cream)]/70 text-xs md:text-sm font-medium hover:text-[var(--color-gold)] transition">
            Rules
          </Link>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
          <label
            className={`flex items-center gap-1.5 text-xs ${difficulty === 'medium' ? 'text-[var(--color-cream)]/70' : 'text-[var(--color-cream)]/40 cursor-not-allowed'}`}
            title={difficulty === 'medium' ? 'Opponent style: Tight = selective, Balanced = middle, Aggressive = bets/calls more' : 'AI style only applies when Difficulty is Medium'}
          >
            <span>AI</span>
            <select
              value={aiStyle}
              onChange={(e) => setAiStyle(e.target.value)}
              disabled={difficulty !== 'medium'}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[var(--color-cream)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="AI opponent style: Tight, Balanced, or Aggressive"
              aria-disabled={difficulty !== 'medium'}
            >
              <option value="tight">Tight</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[var(--color-cream)]/70 text-xs">
            <span>Diff</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[var(--color-cream)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="legend">Legend</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[var(--color-cream)]/70 text-xs" title="Starting stack (applies on New game)">
            <span>Stack</span>
            <select
              value={startingStack}
              onChange={(e) => setStartingStack(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[var(--color-cream)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[var(--color-cream)]/70 text-xs" title="Blinds (apply on New game). Small blind / Big blind. Who pays which rotates each hand: dealer pays SB, other pays BB.">
            <span>Blinds</span>
            <select
              value={`${smallBlind}/${bigBlind}`}
              onChange={(e) => {
                const [sb, bb] = e.target.value.split('/').map(Number)
                setSmallBlind(sb)
                setBigBlind(bb)
              }}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[var(--color-cream)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]/50"
            >
              <option value="1/2">1/2</option>
              <option value="2/4">2/4</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => newHand(true)}
            className="px-2 py-1 rounded text-xs font-medium text-[var(--color-gold)] border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 transition"
          >
            New game
          </button>
          {!inChallenge && (
            <button
              type="button"
              onClick={() => newHand(true, true)}
              className="px-2 py-1 rounded text-xs font-medium text-amber-400 border border-amber-400/40 hover:bg-amber-400/10 transition"
            >
              Challenge
            </button>
          )}
        </div>
      </header>

      <div className="game-content flex flex-col lg:flex-row gap-2 md:gap-3 p-2 md:p-3 max-w-6xl w-full mx-auto">
        <main className="flex-1 flex flex-col items-center justify-center min-h-0 min-w-0 py-1 md:py-2 overflow-hidden">
          {session.challenge_met === true && (
            <div className="flex-shrink-0 mb-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[var(--color-gold)]/30 text-[var(--color-gold)]">
              Challenge complete!
            </div>
          )}
          {session.challenge_met === false && (
            <div className="flex-shrink-0 mb-1 px-2 py-1 rounded-full text-[10px] bg-red-500/20 text-red-300">
              Challenge failed
            </div>
          )}
          {error && (
            <div className="flex-shrink-0 mb-1 px-2 py-1 rounded-lg bg-red-500/15 text-red-300 text-[10px] text-center max-w-md flex flex-col items-center gap-1" role="alert" aria-live="assertive">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => { setError(null); newHand(true) }}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/20 text-red-200 hover:bg-red-500/30 transition"
              >
                Retry / New game
              </button>
            </div>
          )}
          {/* Loading overlay: show when waiting for AI */}
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#051a12]/80" aria-busy="true" aria-live="polite">
              <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-xl border-2 border-[var(--color-gold)]/50 bg-[#0a2419] shadow-lg">
                <span className="inline-block w-10 h-10 border-2 border-[var(--color-gold)]/50 border-t-[var(--color-gold)] rounded-full animate-spin" />
                <span className="text-base font-semibold text-[var(--color-cream)]">AI is thinking…</span>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-3 md:gap-4 w-full max-w-3xl">
          {/* Left strip on dark green: opponent action + GTO hint (outside table) */}
          <div className="flex flex-col gap-3 w-32 flex-shrink-0 md:mt-12 order-2 md:order-1">
            {!handFinished && actionLabel && (
              <div
                key={actionLabel}
                className="animate-action-announce px-2.5 py-2 rounded-lg border border-[var(--color-gold)]/60 bg-[var(--color-gold)]/15 text-left"
                role="status"
                aria-live="polite"
              >
                <p className="text-[10px] text-[var(--color-cream)]/70 uppercase tracking-wider">Opponent</p>
                <p className="text-sm font-semibold text-[var(--color-gold)]">{actionLabel}</p>
              </div>
            )}
            {!handFinished && (
              <div className="px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 text-left">
                <p className="text-[10px] text-[var(--color-cream)]/60 uppercase tracking-wider mb-1">GTO hint</p>
                {hint && showGtoHint ? (
                  <p className="text-xs text-[var(--color-gold)]/90">
                    {hint}
                    <button
                      type="button"
                      onClick={() => setShowGtoHint(false)}
                      className="ml-1 text-[var(--color-cream)]/50 hover:text-[var(--color-cream)]/80 underline"
                    >
                      Hide
                    </button>
                  </p>
                ) : hint ? (
                  <button
                    type="button"
                    onClick={() => setShowGtoHint(true)}
                    className="text-xs text-[var(--color-cream)]/50 hover:text-[var(--color-gold)]/80 text-left"
                  >
                    Show GTO hint
                  </button>
                ) : (
                  <p className="text-xs text-[var(--color-cream)]/40">—</p>
                )}
              </div>
            )}
          </div>

          <div
            className="w-full max-w-md rounded-xl py-2 md:py-3 px-3 md:px-4 flex-shrink-0 pb-3 order-1 md:order-2"
            style={{
              background: 'linear-gradient(165deg, #0d2d1e 0%, #082218 100%)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Result banner: inside table so always visible */}
            {resultText && (
              <div
                className={`animate-result-pop flex-shrink-0 mb-2 px-4 py-2 rounded-lg text-center text-sm font-semibold ${
                  winner === 0 ? 'bg-[var(--color-gold)]/25 text-[var(--color-gold)]' : winner === -1 ? 'bg-white/15 text-[var(--color-cream)]' : 'bg-red-500/20 text-red-200'
                }`}
                role="status"
                aria-live="polite"
              >
                {resultText}
              </div>
            )}
            {/* Opponent: cards and chips only */}
            <div className="flex flex-col items-center gap-1 pb-2 border-b border-white/10">
              <span className="text-[var(--color-cream)] text-[10px] font-semibold uppercase tracking-widest">Opponent</span>
              <div className="flex flex-row justify-center items-center gap-1.5">
                {handFinished && aiCards.length >= 2
                  ? aiCards.map((c, i) => (
                      <div key={i} className="animate-card-appear" style={{ animationDelay: `${i * 80}ms` }}>
                        <PokerCard card={c} faceDown={false} size="sm" />
                      </div>
                    ))
                  : [0, 1].map((i) => (
                      <div key={i} className="animate-card-appear" style={{ animationDelay: `${i * 80}ms` }}>
                        <PokerCard faceDown={true} size="sm" />
                      </div>
                    ))}
              </div>
              {handFinished && handNameAi && (
                <p className="text-[10px] text-[var(--color-cream)]/70">{handNameAi}</p>
              )}
              <ChipStack amount={aiStack} color="red" />
              <p className="text-[9px] text-[var(--color-cream)]/50">chips left</p>
            </div>

            {/* Board: five community cards in one horizontal row */}
            <div className="flex flex-col items-center justify-center py-1.5 gap-0.5">
              <span className="text-[var(--color-cream)] text-xs font-semibold uppercase tracking-widest">{street || 'Board'}</span>
              <div className="flex flex-row justify-center items-center gap-1 flex-nowrap">
                {[0, 1, 2, 3, 4].map((i) => {
                  const c = communityCards[i]
                  const cardKey = c ? `${i}-${c.rank}-${c.suit}` : `empty-${i}`
                  return (
                    <div key={cardKey} className="animate-card-appear" style={{ animationDelay: `${i * 70}ms` }}>
                      <PokerCard card={c} faceDown={!c} size="sm" />
                    </div>
                  )
                })}
              </div>
              <p className={`text-[var(--color-cream)]/60 text-xs ${potAnimating ? 'animate-pot-pulse' : ''}`}>
                Pot <span className="text-[var(--color-gold)] font-semibold tabular-nums">{pot}</span>
              </p>
            </div>

            {/* You: cards, chips, hand strength, actions */}
            <div className="flex flex-col items-center gap-1 pt-2 border-t border-white/10">
              <span className="text-[var(--color-cream)] text-xs font-semibold uppercase tracking-widest">You</span>
              <div className="flex flex-row justify-center items-center gap-1.5">
                {yourCards.length >= 2
                  ? yourCards.map((c, i) => (
                      <div key={i} className="animate-card-appear" style={{ animationDelay: `${i * 80}ms` }}>
                        <PokerCard card={c} faceDown={false} size="md" />
                      </div>
                    ))
                  : [0, 1].map((i) => (
                      <div key={i} className="w-16 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 animate-card-appear" style={{ animationDelay: `${i * 80}ms` }}>
                        <span className="text-[var(--color-cream)]/30 text-xs">—</span>
                      </div>
                    ))}
              </div>
                {handFinished && handNamePlayer && (
                  <p className="text-[10px] text-[var(--color-gold)]/90">{handNamePlayer}</p>
                )}
                <ChipStack amount={yourStack} />
                <p className="text-[9px] text-[var(--color-cream)]/50">chips left</p>
                <p className="text-xs text-[var(--color-cream)]/70">
                  In: <span className="font-semibold text-[var(--color-gold)] tabular-nums">{yourBetThisHand}</span>
                  {toCall > 0 && (
                    <span className="ml-2">To call: <span className="font-semibold text-[var(--color-gold)] tabular-nums">{toCall}</span></span>
                  )}
                </p>
                <p className="text-[9px] text-[var(--color-cream)]/40 italic">Stack updates after you bet, call, raise, or win.</p>

                {!handFinished && message && resultText === null && (
                  <p className="text-[10px] text-[var(--color-cream)]/60">{message}</p>
                )}
                {!handFinished && yourCards.length >= 2 && (
                  <div className="w-full max-w-[140px] mt-0.5">
                    <div className="flex justify-between text-[9px] text-[var(--color-cream)]/50 mb-0.5">
                      <span>Hand strength</span>
                      <span className="tabular-nums text-[var(--color-gold)]/90">{handStrengthPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)]/60 to-[var(--color-gold)] transition-all duration-300"
                        style={{ width: `${Math.min(100, handStrengthPct)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div
                className={`flex flex-wrap justify-center gap-1.5 mt-1 rounded-lg p-1.5 transition-shadow ${!handFinished && currentPlayer === 0 && !loading ? 'animate-your-turn' : ''}`}
                role="group"
                aria-label="Actions"
              >
                {handFinished ? (
                  <button
                    type="button"
                    onClick={() => newHand()}
                    disabled={loading}
                    aria-label="Deal new hand"
                    className="btn-action px-4 py-2 rounded-lg bg-[var(--color-gold)] text-[#0a2419] text-xs font-semibold hover:bg-[var(--color-gold-dim)] disabled:opacity-50 transition"
                  >
                    Deal new hand <span className="opacity-60">(N)</span>
                  </button>
                ) : (
                  legalActions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => act(a)}
                      disabled={loading || currentPlayer !== 0}
                      aria-label={a}
                      className="btn-action px-3 py-1.5 rounded-lg bg-[var(--color-gold)]/90 text-[#0a2419] text-xs font-semibold hover:bg-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed transition capitalize"
                    >
                      {a}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>
        </main>

        <aside className="flex flex-col gap-1.5 md:gap-2 lg:w-60 flex-shrink-0 min-h-0">
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2 md:p-3 flex-shrink-0">
            <h3 className="text-[var(--color-cream)]/50 text-[10px] font-medium uppercase tracking-wider mb-1.5">Rewards</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Points</p><p className="font-medium tabular-nums text-[var(--color-gold)]">{session.points ?? 0}</p></div>
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Level</p><p className="font-medium tabular-nums">{session.level ?? 0}</p></div>
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Streak</p><p className="font-medium tabular-nums">{session.win_streak ?? 0}</p></div>
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Win rate</p><p className="font-medium tabular-nums">{winRate}%</p></div>
            </div>
          </div>

          {inChallenge && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex-shrink-0">
              <h3 className="text-amber-400/90 text-[10px] font-medium uppercase tracking-wider mb-1">Challenge</h3>
              <p className="text-xs text-[var(--color-cream)]/80">
                Reach {session.challenge_target} chips in {session.challenge_max_hands} hands
              </p>
              <p className="text-xs text-[var(--color-cream)]/70 mt-0.5">
                {session.hands_played}/{session.challenge_max_hands} · {yourStack} chips
                {session.challenge_met === true && ' · Done!'}
                {session.challenge_met === false && ' · Failed'}
              </p>
            </div>
          )}

          {!handFinished && yourCards.length >= 2 && (
            <div className="rounded-lg bg-gradient-to-b from-[var(--color-gold)]/5 to-transparent border border-[var(--color-gold)]/20 p-3 flex-shrink-0">
              <h3 className="text-[var(--color-gold)]/90 text-[10px] font-medium uppercase tracking-wider mb-1.5">Equity (vs random)</h3>
              <div className="flex gap-3 text-xs">
                <span className="text-emerald-400/90 font-medium tabular-nums">Win {equity.win_pct}%</span>
                <span className="text-[var(--color-cream)]/70 tabular-nums">Tie {equity.tie_pct}%</span>
                <span className="text-red-400/80 tabular-nums">Lose {equity.lose_pct}%</span>
              </div>
              <p className="text-[10px] text-[var(--color-cream)]/50 mt-1">Monte Carlo (400 runouts)</p>
            </div>
          )}

          {!handFinished && (theory.break_even_equity_pct > 0 || theory.gto_note) && (
            <div className="rounded-lg bg-white/[0.06] border border-[var(--color-gold)]/15 p-3 flex-shrink-0">
              <h3 className="text-[var(--color-gold)]/90 text-[10px] font-medium uppercase tracking-wider mb-1.5">Game theory</h3>
              <p className="text-xs text-[var(--color-cream)]/85">{theory.gto_note}</p>
              <p className="text-[10px] text-[var(--color-cream)]/50 mt-1">Break-even equity: <span className="text-[var(--color-gold)] font-medium">{theory.break_even_equity_pct}%</span></p>
            </div>
          )}

          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 flex-shrink-0">
            <h3 className="text-[var(--color-cream)]/50 text-[10px] font-medium uppercase tracking-wider mb-1">Opponent stats</h3>
            <p className="text-xs text-[var(--color-cream)]/80">
              Bet {opp.bet_pct}% · Call {opp.call_pct}% <span className="text-[var(--color-cream)]/50">({opp.total_actions} actions)</span>
            </p>
          </div>

          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 flex-shrink-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAchievements(!showAchievements)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-[var(--color-cream)]/50 text-[10px] font-medium uppercase tracking-wider">Achievements</h3>
              <span className="text-[var(--color-cream)]/50 text-xs">{(session.achievements || []).length}</span>
            </button>
            {showAchievements && (
              <ul className="mt-2 space-y-1 text-[10px] text-[var(--color-cream)]/80 border-t border-white/[0.06] pt-2">
                {(session.achievements || []).length === 0 && <li className="text-[var(--color-cream)]/40">None yet. Win hands to unlock.</li>}
                {(session.achievements || []).map((id) => (
                  <li key={id} className="text-[var(--color-gold)]/90">★ {ACHIEVEMENT_NAMES[id] || id}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 flex-shrink-0">
            <h3 className="text-[var(--color-cream)]/50 text-[10px] font-medium uppercase tracking-wider mb-2">Session</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Hands</p><p className="font-medium tabular-nums">{session.hands_played}</p></div>
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Wins</p><p className="text-[var(--color-gold)] font-medium tabular-nums">{session.player_wins}</p></div>
              <div><p className="text-[var(--color-cream)]/50 text-[10px]">Losses</p><p className="font-medium tabular-nums">{session.ai_wins}</p></div>
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 min-h-0 flex flex-col flex-1">
            <h3 className="text-[var(--color-cream)]/50 text-[10px] font-medium uppercase tracking-wider mb-2">This hand</h3>
            <ul className="space-y-0.5 text-xs text-[var(--color-cream)]/70 overflow-hidden min-h-0">
              {history.length === 0 && <li className="text-[var(--color-cream)]/40">No actions yet.</li>}
              {history.map((h, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className={h.player === 0 ? 'text-[var(--color-gold)]' : 'text-[var(--color-cream)]/50'}>{h.player === 0 ? 'You' : 'AI'}</span>
                  <span className="capitalize">{h.action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTheory(!showTheory)}
              className="w-full flex items-center justify-between px-3 py-2 text-left"
            >
              <h3 className="text-[var(--color-gold)]/80 text-[10px] font-medium uppercase tracking-wider">Strategy & keys</h3>
              <span className="text-[var(--color-cream)]/50 text-xs">{showTheory ? '−' : '+'}</span>
            </button>
            {showTheory && (
              <div className="px-3 pb-3 pt-0 space-y-2 text-[10px] text-[var(--color-cream)]/70 border-t border-white/[0.06]">
                <p><strong className="text-[var(--color-cream)]/90">Game theory:</strong> Call when your equity &gt; break-even %. GTO = unexploitable mixed strategy (Nash).</p>
                <p>Difficulty: Easy · Medium · Hard · Legend. Challenge: 200 chips in 25 hands. Keys: C=check/call, B=bet, F=fold, R=raise, N=new game.</p>
                <p className="text-[10px] text-[var(--color-cream)]/40 mt-1">AI style (Medium only): <strong className="text-[var(--color-cream)]/60">Tight</strong> = selective, <strong className="text-[var(--color-cream)]/60">Balanced</strong> = middle, <strong className="text-[var(--color-cream)]/60">Aggressive</strong> = bets and calls more.</p>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[var(--color-cream)]/40 flex-shrink-0">Keys: C B F R N · Diff: {config.difficulty ? config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1) : '—'}</p>
        </aside>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function HowToPlay() {
  return (
    <div className="min-h-screen bg-[#051a12] text-[var(--color-cream)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="text-[var(--color-gold)] font-medium hover:underline">← Home</Link>
          <Link
            to="/play"
            className="px-5 py-2.5 rounded-xl bg-[var(--color-gold)] text-[#0a2419] font-semibold hover:bg-[var(--color-gold-dim)] transition"
          >
            Start playing →
          </Link>
        </div>

        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-cream)] mb-2">
          How to play
        </h1>
        <p className="text-[var(--color-cream)]/70 text-lg mb-12">
          Texas Hold'em · Chips, rules, and strategy
        </p>

        {/* 1. What is Texas Hold'em */}
        <section className="mb-12">
          <h2 className="text-[var(--color-gold)] font-display text-2xl font-bold mb-3">
            1. What is Texas Hold'em?
          </h2>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-3">
            Texas Hold'em is the most popular form of poker. You get <strong className="text-[var(--color-cream)]">two private cards</strong> (hole cards) and share <strong className="text-[var(--color-cream)]">five community cards</strong> with the opponent. You make the best <strong className="text-[var(--color-gold)]">five-card hand</strong> using any combination of your two and the five on the board. Highest hand wins the pot.
          </p>
          <p className="text-[var(--color-cream)]/75 text-sm">
            The game has four betting rounds: <strong>Preflop</strong> (after hole cards), <strong>Flop</strong> (three board cards), <strong>Turn</strong> (fourth card), and <strong>River</strong> (fifth card). You can fold, check, bet, call, or raise each round.
          </p>
        </section>

        {/* 2. How chips work */}
        <section className="mb-12">
          <h2 className="text-[var(--color-gold)] font-display text-2xl font-bold mb-3">
            2. How chips work
          </h2>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-4">
            You and the AI each start with <strong className="text-[var(--color-cream)]">100 chips</strong> (default; you can start a new game to reset). Every hand uses <strong className="text-[var(--color-gold)]">blinds</strong>: the dealer posts the small blind (1 chip), the other player posts the big blind (2 chips). Those go into the pot before any cards are dealt.
          </p>
          <ul className="space-y-2 text-[var(--color-cream)]/85 mb-4">
            <li><strong className="text-[var(--color-gold)]">Your stack</strong> — Chips you have left. It goes down when you put chips in and up when you win the pot.</li>
            <li><strong className="text-[var(--color-gold)]">Pot</strong> — Chips in the middle. The winner of the hand takes the whole pot.</li>
            <li><strong className="text-[var(--color-gold)]">You put in this hand</strong> — Total chips you've added this hand (blinds + any bet, call, or raise). If you lose, you don't get that back.</li>
            <li><strong className="text-[var(--color-gold)]">To call</strong> — If the AI has bet or raised, "To call" is how many chips you must add to match. You can also <strong>fold</strong> (give up) or <strong>raise</strong> (match and add more).</li>
          </ul>
          <div className="rounded-xl bg-white/5 border border-[var(--color-gold)]/20 p-4 text-sm text-[var(--color-cream)]/80">
            <strong className="text-[var(--color-gold)]">Bet sizes:</strong> A bet is 2 chips. A raise is 2 chips on top of the current bet (so you can put 2 or 4 in a round). Each betting round allows one bet and one raise per player.
          </div>
        </section>

        {/* 3. Rules */}
        <section className="mb-12">
          <h2 className="text-[var(--color-gold)] font-display text-2xl font-bold mb-3">
            3. Rules of the game (in detail)
          </h2>

          <h3 className="text-[var(--color-cream)] font-display text-lg font-semibold mt-6 mb-2">Flow of a hand</h3>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-4">
            Each hand follows: <strong className="text-[var(--color-gold)]">Deal → Preflop → Flop → Turn → River → Showdown</strong>. The dealer posts the <strong className="text-[var(--color-cream)]">small blind</strong> (e.g. 1 chip), the other player the <strong className="text-[var(--color-cream)]">big blind</strong> (e.g. 2 chips). These go into the pot before any cards are dealt. Who is dealer (and thus who pays SB vs BB) <strong className="text-[var(--color-gold)]">rotates every hand</strong>: one hand you pay the small blind and the AI the big blind; the next hand you pay the big blind and the AI the small blind. You can't reverse it mid-hand—it's fixed by who has the dealer button that hand.
          </p>

          <ul className="space-y-3 text-[var(--color-cream)]/85 mb-6">
            <li><strong className="text-[var(--color-gold)]">Deal</strong> — Each player gets two private hole cards, face down. Only you see your cards; the AI's cards are hidden until showdown. Blinds are already in the pot.</li>
            <li><strong className="text-[var(--color-gold)]">Preflop</strong> — First betting round. In heads-up the big blind acts first (check, fold, call, or raise). Then the small blind acts. Limit: one bet (2 chips) and one raise (2 chips more) per player per round. Max in preflop for the big blind: e.g. 2 + 2 + 2 = 6 chips if there is a bet and a raise.</li>
            <li><strong className="text-[var(--color-gold)]">Flop</strong> — Three community cards dealt face up. Second betting round. First to act can check or bet. Same: one bet and one raise per player; bet = 2 chips, raise = 2 chips on top.</li>
            <li><strong className="text-[var(--color-gold)]">Turn</strong> — Fourth community card. Third betting round: check, bet (2), call, raise (2 more), or fold. One bet and one raise per player.</li>
            <li><strong className="text-[var(--color-gold)]">River</strong> — Fifth community card. Final betting round. Same action options and limits.</li>
            <li><strong className="text-[var(--color-gold)]">Showdown</strong> — If no one folded, both reveal hole cards. Each makes the best five-card hand from their two hole cards plus the five board cards (you can use 0, 1, or 2 hole cards). Higher hand wins the pot. If hands tie, the pot is split. If someone folded, that player's cards are not shown and the other wins without showing.</li>
          </ul>

          <h3 className="text-[var(--color-cream)] font-display text-lg font-semibold mt-6 mb-2">Actions (what you can do)</h3>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-3">On your turn, depending on the situation:</p>
          <ul className="space-y-2 text-[var(--color-cream)]/85 mb-4">
            <li><strong className="text-[var(--color-gold)]">Check</strong> — Put no more chips in. Only allowed when no one has bet this round. If the opponent has bet, you must call, raise, or fold.</li>
            <li><strong className="text-[var(--color-gold)]">Bet</strong> — Add 2 chips to the pot. Only when no one has bet this round. After you bet, the opponent must call, raise, or fold.</li>
            <li><strong className="text-[var(--color-gold)]">Call</strong> — Match the current bet for this round. "To call" is how many more chips you need. Otherwise you must raise or fold.</li>
            <li><strong className="text-[var(--color-gold)]">Raise</strong> — Match the current bet and add 2 more chips. If the opponent bet 2, a raise = 4 total from you this round. One raise per player per round; after a raise the other can only call or fold.</li>
            <li><strong className="text-[var(--color-gold)]">Fold</strong> — Give up the hand. You lose chips already put in and the opponent wins the pot without showing.</li>
          </ul>
          <div className="rounded-xl bg-white/5 border border-[var(--color-gold)]/20 p-4 text-sm text-[var(--color-cream)]/80">
            <strong className="text-[var(--color-gold)]">Summary:</strong> Check only when there is no bet. Bet 2 when no one has bet. Raise 2 on top of the current bet, once per player per round. You can always call or fold.
          </div>
        </section>

        {/* 4. Hand rankings */}
        <section className="mb-12">
          <h2 className="text-[var(--color-gold)] font-display text-2xl font-bold mb-3">
            4. Hand rankings (high to low)
          </h2>
          <p className="text-[var(--color-cream)]/80 text-sm mb-3">
            You use exactly five cards (from your two hole cards + five board cards). Between two hands of the same type, higher ranks win; if ranks tie, <strong className="text-[var(--color-cream)]">kickers</strong> (remaining cards) break the tie. Ace can be high (14) or low (1), e.g. A-2-3-4-5 is a straight (wheel).
          </p>
          <ol className="space-y-1 text-[var(--color-cream)]/85 list-decimal list-inside">
            <li><strong className="text-[var(--color-gold)]">Straight flush</strong> — Five consecutive cards of the same suit (e.g. 9♠8♠7♠6♠5♠).</li>
            <li><strong className="text-[var(--color-gold)]">Four of a kind</strong> — Four cards of the same rank.</li>
            <li><strong className="text-[var(--color-gold)]">Full house</strong> — Three of a kind + a pair.</li>
            <li><strong className="text-[var(--color-gold)]">Flush</strong> — Five cards of the same suit (not in order).</li>
            <li><strong className="text-[var(--color-gold)]">Straight</strong> — Five consecutive ranks (A can count as 1 or 14, e.g. A-2-3-4-5 or 10-J-Q-K-A).</li>
            <li><strong className="text-[var(--color-gold)]">Three of a kind</strong> — Three cards of the same rank.</li>
            <li><strong className="text-[var(--color-gold)]">Two pair</strong> — Two different pairs.</li>
            <li><strong className="text-[var(--color-gold)]">One pair</strong> — Two cards of the same rank.</li>
            <li><strong className="text-[var(--color-gold)]">High card</strong> — No pair; highest card wins, then next highest if tied.</li>
          </ol>
        </section>

        {/* 5. Strategy and game theory */}
        <section className="mb-12">
          <h2 className="text-[var(--color-gold)] font-display text-2xl font-bold mb-3">
            5. Strategy and game theory (CS-8211)
          </h2>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-3">
            Poker is a game of <strong className="text-[var(--color-cream)]">imperfect information</strong>: you don't see the opponent's cards. In game theory (e.g. Mathematical Theory of Games), such games are studied via <strong className="text-[var(--color-gold)]">Nash equilibrium</strong> — a strategy profile where no player can improve their outcome by unilaterally changing strategy. <strong className="text-[var(--color-cream)]">GTO (game-theory optimal)</strong> play is unexploitable: it uses <strong className="text-[var(--color-gold)]">mixed strategies</strong> (randomising between actions with certain probabilities) so the opponent cannot profit by adapting.
          </p>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-3">
            <strong className="text-[var(--color-cream)]">Equity</strong> is your chance to win the hand (vs a random hand). The game estimates it with a <strong className="text-[var(--color-gold)]">Monte Carlo algorithm</strong> (many random runouts). <strong className="text-[var(--color-cream)]">Break-even equity</strong>: when facing a bet, you need to win at least X% of the time for calling to be profitable (X = to_call / (pot + to_call)). If your equity &gt; X%, calling has positive expected value.
          </p>
          <p className="text-[var(--color-cream)]/85 leading-relaxed mb-3">
            <strong className="text-[var(--color-cream)]">In-game tools</strong>: <strong className="text-[var(--color-gold)]">Hand strength</strong> (0–100%) and <strong className="text-[var(--color-gold)]">Equity (Win / Tie / Lose %)</strong> help you decide. The <strong className="text-[var(--color-gold)]">GTO hint</strong> suggests an equilibrium-style action. Use <strong className="text-[var(--color-cream)]">Game theory</strong> panel (break-even %, call rule) and opponent stats to play better.
          </p>
        </section>

        {/* Start playing */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/10">
          <Link
            to="/play"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-gold)] text-[#0a2419] font-semibold hover:bg-[var(--color-gold-dim)] transition"
          >
            Start playing
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <Link to="/" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-[var(--color-gold)]/50 text-[var(--color-gold)] font-medium hover:bg-[var(--color-gold)]/10 transition">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[var(--color-felt)] z-10" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-gold),transparent_50%)]" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4a853\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80 z-0" />
        <div className="relative z-20 max-w-6xl mx-auto px-6 pt-16 pb-32 md:pt-24 md:pb-40">
          <nav className="flex items-center justify-between mb-20 md:mb-28">
            <span className="font-display text-xl md:text-2xl font-semibold text-[var(--color-gold)] tracking-wide">
              Royal Poker
            </span>
            <Link
              to="/how-to-play"
              className="px-6 py-3 rounded-xl bg-[var(--color-gold)] text-[var(--color-felt)] font-semibold hover:bg-[var(--color-gold-dim)] transition shadow-lg shadow-[var(--color-gold)]/20"
            >
              Play Now
            </Link>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--color-cream)] max-w-4xl leading-[1.05] drop-shadow-lg">
            Play Smart.
            <br />
            <span className="text-[var(--color-gold)] italic">Bluff Better.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-[var(--color-cream)]/85 max-w-xl font-light">
            Texas Hold'em with game-theory tools: equity algorithm, GTO-style hints, break-even odds, and adaptive AI. Built for strategy.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/how-to-play"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-gold)] text-[var(--color-felt)] font-semibold text-lg hover:bg-[var(--color-gold-dim)] transition shadow-lg"
            >
              Join the table
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-[var(--color-gold)]/60 text-[var(--color-gold)] font-medium hover:bg-[var(--color-gold)]/10 transition"
            >
              See features
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-[var(--color-cream)] mb-4">
            Built like a real game
          </h2>
          <p className="text-[var(--color-cream)]/80 text-lg max-w-2xl mb-16">
            Full Texas Hold'em with algorithms and game theory: Monte Carlo equity, hand strength meter, break-even odds, GTO hints, and Nash-style strategy. Hole cards, flop, turn, river, and hand rankings.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Realistic table</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Felt layout, pot in the center, you vs AI. Cards and chips where they belong.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Chip stacks & pot</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Your stack and the AI’s. Pot grows with bets. See exactly what you’re playing for.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Hand history</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Full log of checks, bets, folds, and calls so you can review and learn.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Smart AI</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Choose AI style: tight, aggressive, or balanced. Adapt your strategy to beat it.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Session stats</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Hands played, wins, and win rate so you can see how you’re doing.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--color-felt-light)]/90 border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/40 transition">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-gold)]/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[var(--color-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-[var(--color-gold)] font-display text-xl font-bold mb-2">Game theory & algorithms</h3>
              <p className="text-[var(--color-cream)]/75 text-sm">
                Monte Carlo equity, hand strength meter, break-even odds, and GTO-style hints. Aligned with Nash equilibrium and mixed strategies (CS-8211).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-cream)] mb-4">
            Take a seat
          </h2>
          <p className="text-[var(--color-cream)]/80 mb-10">
            Two hole cards, flop, turn, river. Check, bet, call, raise, or fold. Use equity and GTO hints to play with the odds—and the theory.
          </p>
          <Link
            to="/how-to-play"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-[var(--color-gold)] text-[var(--color-felt)] font-semibold text-lg hover:bg-[var(--color-gold-dim)] transition shadow-lg"
          >
            Start playing
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-[var(--color-gold)]/20">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[var(--color-cream)]/60 text-sm">
            Royal Poker
          </span>
          <span className="text-[var(--color-cream)]/60 text-sm">
            Built with React, Tailwind & FastAPI
          </span>
        </div>
      </footer>
    </div>
  )
}

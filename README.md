# Royal Poker — Texas Hold'em & Game Theory

A web-based **Texas Hold'em** heads-up game with a React + Tailwind frontend and FastAPI backend. Play against an adaptive AI with real hand rankings, blinds, and four betting rounds.

## Features

- **Texas Hold'em**: Full 52-card deck, two hole cards, five community cards (flop, turn, river), and standard hand rankings (high card through straight flush).
- **Real table feel**: Blinds (SB/BB), pot, check / bet / call / raise / fold, and “you put in this hand” + “to call” so chip flow is clear.
- **How to play**: Pre-play screen explains rules, chips, and strategy; “Rules” link from the game table.
- **Rewards & difficulty**: Points, level, win streak, achievements, opponent stats (bet % / call %), and difficulty (Easy / Medium / Hard). Challenge mode: reach a chip target in a set number of hands.
- **Algorithms**: Monte Carlo equity (win/tie/lose %), hand strength (0–100%), and game-theory stats (break-even %, GTO note). Aligned with CS-8211.
- **Game theory**: Nash equilibrium, GTO, mixed strategies. In-game GTO hint, Game theory panel, and Equity panel. Call when equity > break-even % for positive EV.
- **Backend API**: FastAPI with CORS; hand evaluation, equity module, Hold'em state, and theory stats in Python.

## Tech Stack

| Part      | Stack                          |
|----------|---------------------------------|
| Frontend | React 19, Vite, Tailwind CSS 4  |
| Backend  | Python 3.11+, FastAPI           |
| Fonts    | Playfair Display, Outfit        |

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+

## Quick Start

### 1. Backend

```cmd
cd c:\Users\User\Desktop\Poker\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

API: [http://localhost:8000](http://localhost:8000) — docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend

In a **new** terminal:

```cmd
cd c:\Users\User\Desktop\Poker\frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173).

**Optional (production / different host):** Set `VITE_API_URL` in the frontend (e.g. in `.env`: `VITE_API_URL=https://your-api.example.com`) so the app calls your backend. For the backend, set `CORS_ORIGINS` to a comma-separated list of allowed origins (e.g. `CORS_ORIGINS=https://your-app.example.com,https://www.example.com`).

### 3. Play

Open [http://localhost:5173](http://localhost:5173). A detailed **project report** (algorithms, game theory, architecture) is in [REPORT.md](REPORT.md). Use **Play Now** or **Join the table** to open the **How to play** screen, then **Start playing** to go to the game. The backend must be running for the game to work.

## Project Structure

```
Poker/
├── backend/
│   ├── main.py         # FastAPI app: /poker/new-hand, /poker/act, /poker/state, /poker/hint
│   ├── holdem.py       # Texas Hold'em state, betting, AI, equity/theory
│   ├── hand_eval.py    # 5/7-card hand evaluation and rankings
│   ├── equity.py       # Monte Carlo equity, hand strength 0–100
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── HowToPlay.jsx
│   │   │   └── Game.jsx
│   │   ├── components/
│   │   │   ├── PokerCard.jsx
│   │   │   └── ChipStack.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

## API (Texas Hold'em)

| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| POST   | `/poker/new-hand`    | Start a new hand (optional: reset_stacks, difficulty, challenge_target, challenge_max_hands) |
| GET    | `/poker/state`       | Get current game state |
| POST   | `/poker/act`         | Send action: `check`, `bet`, `call`, `raise`, `fold` |
| GET    | `/poker/config`     | Get config (starting_stack, blinds, difficulty) |
| GET    | `/poker/hint`       | Get suggested action for current turn |

Responses include `your_cards`, `ai_cards` (at showdown), `community_cards`, `street`, `hand_name_player`, `hand_name_ai`, pot, stacks, `to_call`, `your_bet_this_hand`, **`equity`** (win_pct, tie_pct, lose_pct), **`hand_strength_pct`** (0–100), **`theory`** (break_even_equity_pct, gto_note), and session stats.

## Algorithms & game theory

- **Equity**: On the **river** (5 board cards), equity is **exact** (all C(45,2) opponent hands). On preflop/flop/turn, **Monte Carlo** (500 simulations) estimates win/tie/lose %. Used to decide whether calling is profitable vs break-even equity.
- **Hand strength**: Scalar 0–100 from hole cards and board (preflop: high cards, pairs, suited; postflop: best-hand category + kickers).
- **Break-even equity**: When facing a bet, `to_call / (pot + to_call)`; call when your equity > this for positive expected value (EV). GTO note in UI explains the rule.
- **GTO hint**: When facing a bet, uses your **equity** vs break-even % to suggest call/raise/fold; otherwise uses hand strength. Equilibrium-style and aligned with Nash/EV (CS-8211).
- **AI (Hard)**: Uses pot-odds logic: calls when hand strength (proxy for equity) is at or above break-even %, for EV-aware play.

## References

- [Texas Hold'em rules](https://en.wikipedia.org/wiki/Texas_hold_%27em) — Rules and hand rankings.
- [GTO poker](https://poker.academy/blog/post/what-is-gto-in-poker/) — Nash equilibrium and game-theory optimal play.
- [PokerKit](https://github.com/uoftcprg/pokerkit) — Python poker library (optional extension).
- CS-8211 Mathematical Theory of Games: Nash equilibrium, mixed strategies, imperfect information, and pot odds.

## License

MIT.

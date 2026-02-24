# Royal Poker — Project Report

**Texas Hold'em with Game Theory (CS-8211)**  
A web-based heads-up poker game combining real poker rules, algorithmic tools, and mathematical game theory.

---

## 1. Summary

Royal Poker is a full-stack application that lets users play Texas Hold'em against an AI opponent. It emphasises **game-theory alignment** (Nash equilibrium, GTO, pot odds, expected value) and provides **algorithmic aids**: Monte Carlo and exact equity, hand strength, break-even odds, and GTO-style hints. The project is suitable as a course project for **Mathematical Theory of Games (e.g. CS-8211)** and as a portfolio piece demonstrating algorithms, API design, and modern front-end development.

---

## 2. Objectives

- **Implement real poker:** Full Texas Hold'em (52-card deck, hole cards, flop/turn/river, standard hand rankings).
- **Align with game theory:** Expose pot odds, break-even equity, and EV-based decision rules; explain Nash equilibrium and mixed strategies in the UI.
- **Provide algorithmic support:** Equity (win/tie/lose %), hand strength (0–100%), and a hint that uses equity when available.
- **Deliver a polished UX:** Clear chip flow, rules and strategy explanation before play, rewards/achievements, difficulty levels, and accessibility considerations.

---

## 3. Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend  | Python 3.11+, FastAPI |
| Fonts    | Playfair Display, Outfit |

The frontend uses environment variable `VITE_API_URL` for the API base URL; the backend uses `CORS_ORIGINS` for allowed origins, supporting different dev ports and production deployment.

---

## 4. System Architecture

- **Backend (FastAPI):** Single global game state (one table). Endpoints: `POST /poker/new-hand`, `POST /poker/act`, `GET /poker/state`, `GET /poker/config`, `GET /poker/hint`. All game logic and algorithms run server-side.
- **Frontend (React):** SPA with routes `/` (Landing), `/how-to-play` (rules and game theory), `/play` (game table). The game page calls the API for new hands and actions, and displays cards, pot, stacks, equity, hand strength, theory panel, and GTO hint.
- **Data flow:** Each action (check, bet, call, raise, fold) is sent to the backend; the backend updates state, runs AI turn if needed, and returns the full state (cards, pot, legal actions, equity, theory, session stats).

---

## 5. Algorithms

### 5.1 Hand evaluation (`hand_eval.py`)

- **Representation:** Cards as `(rank, suit)` with rank 2–14 (Ace high) and suit 0–3.
- **Method:** For up to 7 cards, enumerate all 5-card combinations and choose the best hand. Hands are compared by `(category, tiebreak_list)`.
- **Categories (high to low):** Straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card. Ace-low straight (wheel) is supported.
- **Edge case:** `hand_name(0, …)` returns `"—"` for invalid or unknown category.

### 5.2 Equity (`equity.py`)

- **Monte Carlo (preflop / flop / turn):** Sample many random opponent hole cards and random board runouts; count how often the player wins, ties, or loses. Default 500 simulations. Returns (win%, tie%, lose%).
- **Exact enumeration (river):** When the board is complete (5 cards), iterate over all C(45,2) possible opponent hole cards and compute win/tie/lose counts. This gives **exact** equity on the river with no sampling error.
- **Usage:** The backend uses exact equity on the river and Monte Carlo otherwise. Equity is shown in the UI and used by the GTO hint when facing a bet.

### 5.3 Hand strength (`equity.py`)

- **Preflop:** Scalar 0–100 from pocket pairs, high cards, suitedness, and connectedness (gap between ranks for straight potential).
- **Postflop:** Based on the best 5-card hand category and top tiebreak rank. Used for the in-game “hand strength” bar and by the AI as a proxy for equity when full equity is not computed.

### 5.4 Game-theory stats (`holdem.py`)

- **Break-even equity:** When facing a bet, `to_call / (pot + to_call)` as a percentage. Calling is profitable in expectation when the player’s equity (win% + half of tie%) is greater than this.
- **GTO note:** Short text shown in the UI (e.g. “Call if your equity > 25% (break-even).”).

### 5.5 GTO hint (`holdem.py`)

- When **no bet to call:** Suggests bet or check from hand strength.
- When **facing a bet:** If equity is available, uses **effective equity** (win% + tie%/2). Suggests raise if equity is well above break-even, call if above break-even, fold if below. Falls back to hand-strength-based logic if equity is not used or fails.

### 5.6 AI behaviour (`holdem.py`)

- **Easy:** More random bet/call probabilities.
- **Medium:** Probabilities driven by hand strength and style (tight / balanced / aggressive).
- **Hard:** Uses **pot-odds logic**: when facing a bet, compares hand strength (as a proxy for equity) to break-even %. Call probability is high when strength ≥ break-even (with a small margin), and lower when below. This makes the AI behave in line with “call when EV ≥ 0” in a simplified form.

---

## 6. Game Theory Alignment (CS-8211)

- **Nash equilibrium:** Explained in the How to play page: no player can improve by unilaterally changing strategy. GTO play is described as unexploitable and using mixed strategies.
- **Mixed strategies:** The UI states that optimal play involves randomising between actions with certain probabilities.
- **Imperfect information:** The game is described as such; the AI does not see the player’s cards and vice versa until showdown.
- **Pot odds and EV:** Break-even equity is defined and displayed; the rule “call when equity > break-even %” is stated in the Game theory panel and in the report. The GTO hint implements this when equity is available.
- **In-game tools:** Equity panel (Win / Tie / Lose %), hand strength meter, Game theory panel (break-even %, GTO note), and GTO hint together support decisions consistent with basic game-theory concepts.

---

## 7. Game Features

- **Table:** Two hole cards per player, five community cards (flop, turn, river), pot, stacks, “you put in this hand,” and “to call.”
- **Actions:** Check, bet, call, raise, fold. Fixed bet size (2) and one raise per street (cap 4 per player per street). Blinds: SB=1, BB=2.
- **Rewards:** Points, level (from points), win streak, achievements (first win, streaks, bluff master, comeback, flush/straight, double stack, shutout, etc.).
- **Opponent stats:** Bet % and call % over the session.
- **Challenge mode:** Reach a target number of chips within a maximum number of hands.
- **Difficulty:** Easy, Medium, Hard (Hard uses pot-odds–style calling).
- **How to play:** Dedicated page with rules, hand rankings, chip explanation, and a game-theory section. “Rules” link from the game table.

---

## 8. Project Structure

```
Poker/
├── backend/
│   ├── main.py          # FastAPI app, CORS, /poker/* routes
│   ├── holdem.py        # Texas Hold'em state, betting, AI, equity/theory, achievements
│   ├── hand_eval.py     # 5/7-card hand evaluation and hand names
│   ├── equity.py       # Monte Carlo + exact river equity, hand strength 0–100
│   ├── kuhn_poker.py    # Legacy Kuhn Poker (unused by current UI)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Landing, HowToPlay, Game
│   │   ├── components/ # PokerCard, ChipStack
│   │   ├── App.jsx, main.jsx, index.css
│   └── package.json
├── README.md
└── REPORT.md            # This document
```

---

## 9. How to Run

1. **Backend:** `cd backend`, create venv, `pip install -r requirements.txt`, `uvicorn main:app --reload --host 0.0.0.0`. API at http://localhost:8000.
2. **Frontend:** `cd frontend`, `npm install`, `npm run dev`. App at http://localhost:5173.
3. Open the app, use “Play Now” or “Join the table” to read How to play, then “Start playing” to open the game. The backend must be running for the game to work.

Optional: set `VITE_API_URL` and `CORS_ORIGINS` for production or other hosts (see README).

---

## 10. Possible Future Work

- **Tests:** Unit tests for `hand_eval` (rankings, straights, wheel), `equity` (exact river, Monte Carlo sanity checks), and `holdem` (betting, showdown, achievements). Optional front-end tests for critical flows.
- **Exact equity on turn:** Enumerate all river cards and, for each, exact opponent hands; average. Would give exact turn equity at higher compute cost.
- **Stronger AI:** Integrate precomputed or learned strategies (e.g. simplified CFR or lookup tables) for a more Nash-like opponent.
- **Outs display:** Show “outs” (e.g. 9 for a flush draw) and approximate “hit by river” probability for draws.
- **Hand history export:** Export session or hand history (e.g. JSON or text) for analysis.

---

## 11. References

- Texas Hold'em rules and hand rankings (e.g. Wikipedia).
- GTO poker and Nash equilibrium (e.g. poker.academy, course material).
- CS-8211 Mathematical Theory of Games: Nash equilibrium, mixed strategies, imperfect information, zero-sum games.
- PokerKit (optional): Python poker library for extensions.

---

*Report generated for the Royal Poker project. Algorithms and game-theory features are aligned with CS-8211 and similar courses.*

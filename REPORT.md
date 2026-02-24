# Royal Poker — Full Documentation

**Texas Hold'em with Game Theory (CS-8211)**  
A web-based heads-up poker game combining real poker rules, algorithmic tools, and mathematical game theory.

This document combines the project overview, quick start, API, algorithms, and report in one place.

---

## Table of contents

1. [Summary & objectives](#1-summary--objectives)  
2. [Quick start & prerequisites](#2-quick-start--prerequisites)  
3. [Features](#3-features)  
4. [Tech stack](#4-tech-stack)  
5. [Project structure](#5-project-structure)  
6. [How to run](#6-how-to-run)  
7. [API](#7-api)  
8. [System architecture](#8-system-architecture)  
9. [Algorithms and mathematics](#9-algorithms-and-mathematics)  
10. [Game features (difficulty, AI style, UI)](#10-game-features-difficulty-ai-style-ui)  
11. [Game theory alignment](#11-game-theory-alignment)  
12. [Possible future work](#12-possible-future-work)  
13. [References](#13-references)

---

## 1. Summary & objectives

Royal Poker is a full-stack application that lets users play Texas Hold'em against an AI opponent. It emphasises **game-theory alignment** (Nash equilibrium, GTO, pot odds, expected value) and provides **algorithmic aids**: Monte Carlo and exact equity, hand strength, break-even odds, and GTO-style hints. The project is suitable as a course project for **Mathematical Theory of Games (e.g. CS-8211)** and as a portfolio piece demonstrating algorithms, API design, and modern front-end development.

**Objectives:**

- **Implement real poker:** Full Texas Hold'em (52-card deck, hole cards, flop/turn/river, standard hand rankings).
- **Align with game theory:** Expose pot odds, break-even equity, and EV-based decision rules; explain Nash equilibrium and mixed strategies in the UI.
- **Provide algorithmic support:** Equity (win/tie/lose %), hand strength (0–100%), and a hint that uses equity when available.
- **Deliver a polished UX:** Clear chip flow, rules and strategy explanation before play, rewards/achievements, difficulty levels, optional GTO hint (hideable), and accessibility considerations.

---

## 2. Quick start & prerequisites

**Prerequisites:** Node.js 18+, npm; Python 3.11+.

**Backend:**

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

API: [http://localhost:8000](http://localhost:8000) — docs at [http://localhost:8000/docs](http://localhost:8000/docs).

**Frontend** (in a new terminal):

```cmd
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173).

**Optional (production):** Set `VITE_API_URL` in the frontend and `CORS_ORIGINS` in the backend for your host(s). See README.

---

## 3. Features

- **Texas Hold'em:** Full 52-card deck, two hole cards, five community cards (flop, turn, river), standard hand rankings (high card through straight flush).
- **Real table feel:** Blinds (SB/BB), pot, check / bet / call / raise / fold, “you put in this hand” and “to call.”
- **How to play:** Pre-play screen explains rules, chips, and strategy; “Rules” link from the game table.
- **Rewards & difficulty:** Points, level, win streak, achievements, opponent stats (bet % / call %). Difficulty: **Easy, Medium, Hard, Legend.** Challenge mode: reach a chip target in a set number of hands.
- **Algorithms:** Monte Carlo equity (win/tie/lose %), hand strength (0–100%), game-theory stats (break-even %, GTO note). Exact equity on the river.
- **Game theory:** Nash equilibrium, GTO, mixed strategies. In-game **GTO hint** (optional, hideable), Game theory panel, Equity panel. Call when equity > break-even % for positive EV.
- **Backend API:** FastAPI with CORS; hand evaluation, equity module, Hold'em state, and theory stats in Python.

---

## 4. Tech stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend  | Python 3.11+, FastAPI   |
| Fonts    | Playfair Display, Outfit |

---

## 5. Project structure

```
Poker/
├── backend/
│   ├── main.py          # FastAPI app, CORS, /poker/* routes
│   ├── holdem.py        # Texas Hold'em state, betting, AI, equity/theory, achievements
│   ├── hand_eval.py     # 5/7-card hand evaluation and hand names
│   ├── equity.py        # Monte Carlo + exact river equity, hand strength 0–100
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Landing, HowToPlay, Game
│   │   ├── components/  # PokerCard, ChipStack
│   │   ├── App.jsx, main.jsx, index.css
│   └── package.json
├── README.md
└── REPORT.md            # This document (full documentation)
```

---

## 6. How to run

1. **Backend:** `cd backend`, create venv, `pip install -r requirements.txt`, `uvicorn main:app --reload --host 0.0.0.0`. API at http://localhost:8000.
2. **Frontend:** `cd frontend`, `npm install`, `npm run dev`. App at http://localhost:5173.
3. Open the app; use “Play Now” or “Join the table” to read How to play, then “Start playing” to open the game. The backend must be running for the game to work.

---

## 7. API

| Method | Endpoint             | Description |
|--------|----------------------|-------------|
| POST   | `/poker/new-hand`    | Start a new hand (optional: reset_stacks, difficulty, challenge_target, challenge_max_hands, ai_style) |
| GET    | `/poker/state`       | Get current game state |
| POST   | `/poker/act`         | Send action: `check`, `bet`, `call`, `raise`, `fold` |
| GET    | `/poker/config`      | Get config (starting_stack, blinds, difficulty) |
| GET    | `/poker/hint`        | Get suggested action for current turn |

Responses include `your_cards`, `ai_cards` (at showdown), `community_cards`, `street`, `hand_name_player`, `hand_name_ai`, pot, stacks, `to_call`, `your_bet_this_hand`, **`equity`** (win_pct, tie_pct, lose_pct), **`hand_strength_pct`** (0–100), **`theory`** (break_even_equity_pct, gto_note), and session stats.

---

## 8. System architecture

- **Backend (FastAPI):** Single global game state (one table). Endpoints: `POST /poker/new-hand`, `POST /poker/act`, `GET /poker/state`, `GET /poker/config`, `GET /poker/hint`. All game logic and algorithms run server-side.
- **Frontend (React):** SPA with routes `/` (Landing), `/how-to-play` (rules and game theory), `/play` (game table). The game page calls the API for new hands and actions, and displays cards, pot, stacks, equity, hand strength, theory panel, and optional GTO hint.
- **Data flow:** Each action (check, bet, call, raise, fold) is sent to the backend; the backend updates state, runs AI turn if needed, and returns the full state.

---

## 9. Algorithms and mathematics

Algorithms and math are implemented in `backend/hand_eval.py`, `backend/equity.py`, and `backend/holdem.py`.

### 9.1 Card representation and hand ranking

- **Cards:** `(rank, suit)` with rank 2–14 (Ace high), suit 0–3.
- **Hand categories (high to low):** Straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, one pair, high card. Ace can be high or low (wheel A-2-3-4-5).
- **Best hand from 7 cards:** Enumerate all C(7,5) = 21 five-card subsets; pick the maximum `(category, tiebreak_list)`.

### 9.2 Equity (win / tie / lose %)

- **River (exact):** All five board cards known. Enumerate all C(45,2) = 990 opponent hole-card combinations; count wins/ties/losses. Yields exact win%, tie%, lose%.
- **Preflop / flop / turn (Monte Carlo):** Fix your hole cards and current board; repeat N = 500 times: random opponent hand and random board completion; compare best 5-card hands. Estimate win%, tie%, lose%.
- **Effective equity** (for EV): \(\text{win\%} + \frac{\text{tie\%}}{2}\).

### 9.3 Hand strength (0–100)

Heuristic scalar for UI and AI. Preflop: high cards, pair, suited, connected. Postflop: best-hand category + tiebreak rank, scaled to 0–100.

### 9.4 Pot odds and break-even equity

When facing a bet: **break-even equity** = \(\frac{\text{to\_call}}{\text{pot} + \text{to\_call}}\) (as decimal) or \(100 \times \frac{\text{to\_call}}{\text{pot} + \text{to\_call}}\) as percentage. **Call when effective equity > break-even** for positive EV. EV(call) = \(q(P+C) - C\) where \(q\) is effective equity (decimal).

### 9.5 GTO hint

Suggests check/bet when no bet to call (from hand strength). When facing a bet: uses effective equity vs break-even; suggests raise if equity ≥ break_even + 5%, call if ≥ break_even, fold if &lt; break_even − 5%. The GTO hint is **optional and hideable** in the UI (Show / Hide).

### 9.6 Game theory (Nash, GTO, mixed strategies)

Poker is **imperfect information**. **Nash equilibrium:** no player can improve by unilaterally changing strategy. **GTO:** unexploitable, uses **mixed strategies** (randomising actions). This project: break-even rule and GTO hint implement EV-based call/fold/raise; Legend AI uses actual equity for near-optimal play.

### 9.7 AI behaviour (difficulty levels)

- **Easy:** More random bet/call probabilities.
- **Medium:** Probabilities from hand strength and **AI style** (Tight / Balanced / Aggressive). See §10 for style details.
- **Hard:** Pot-odds logic: call when hand strength (proxy for equity) ≥ break-even % (with margins). EV-aware approximation.
- **Legend:** Uses **actual equity** for the AI (exact on river, Monte Carlo otherwise). EV-based: bet when equity ≥ 55% or strong hand; when facing a bet, raise if equity ≥ break_even + 8%, call if ≥ break_even, fold if &lt; break_even − 3%. Follows this suggested action with 92% probability. Hardest level.

### 9.8 Key formulas

| Concept | Formula |
|--------|--------|
| Effective equity | win% + tie% / 2 |
| Break-even % | 100 × to_call / (pot + to_call) |
| EV(call) | q(P+C) − C (q = effective equity as decimal) |
| Call when | effective equity > break-even % |

### 9.9 Worked example (break-even)

Pot = 6, to_call = 2 → break-even = 2/(6+2) = 25%. If your effective equity is 30%, EV(call) = 0.30×8 − 2 = 0.4 (call). If 20%, EV(call) = −0.4 (fold).

---

## 10. Game features (difficulty, AI style, UI)

- **Table:** Two hole cards per player, five community cards, pot, stacks, “you put in this hand,” “to call.” Actions: check, bet, call, raise, fold. Fixed bet size 2, one raise per street. Blinds SB=1, BB=2.
- **Rewards:** Points, level, win streak, achievements (first win, streaks, bluff master, comeback, flush/straight, double stack, shutout, etc.). Opponent stats: bet % and call %. Challenge mode: reach target chips in max hands.
- **Difficulty:** Easy, Medium, Hard, **Legend** (Legend uses actual equity and is the hardest).
- **AI style (Tight / Balanced / Aggressive):** Applies **only when Difficulty is Medium**. When Easy, Hard, or Legend is selected, the AI uses that difficulty’s own logic and does not use style.
  - **Tight:** Bets and calls less often; selective (bet prob = hand_strength×0.6, call prob = hand_strength×0.5).
  - **Balanced:** Middle ground (bet = 0.25 + strength×0.5, call = 0.3 + strength×0.5).
  - **Aggressive:** Bets and calls more, including with marginal hands (bet = 0.4 + strength×0.4, call = 0.5 + strength×0.3).
- **UI behaviour:** In the game header, the **AI style** dropdown (Tight / Balanced / Aggressive) is **disabled** when any difficulty other than **Medium** is selected. The control is greyed out and shows a tooltip that “AI style only applies when Difficulty is Medium.” This avoids confusion and makes it clear that style is relevant only for Medium difficulty.
- **How to play:** Dedicated page with rules, hand rankings, chips, and game theory. “Rules” link from the game table. **GTO hint** is optional and can be shown or hidden via “Show GTO hint” / “Hide.”

---

## 11. Game theory alignment (CS-8211)

- **Nash equilibrium:** Explained on the How to play page; GTO as unexploitable, mixed strategies.
- **Imperfect information:** Stated in UI; AI does not see player cards until showdown.
- **Pot odds and EV:** Break-even equity defined and displayed; “call when equity > break-even %” in Game theory panel and GTO hint.
- **In-game tools:** Equity panel, hand strength meter, Game theory panel, optional GTO hint support EV-aligned decisions.

---

## 12. Possible future work

- Unit tests for hand_eval, equity, holdem.
- Exact equity on turn (enumerate river cards and opponent hands; higher compute cost).
- Stronger AI (e.g. simplified CFR or lookup tables).
- Outs display and “hit by river” probability for draws.
- Hand history export (JSON or text).

---

## 13. References

- Texas Hold'em rules and hand rankings: [Wikipedia](https://en.wikipedia.org/wiki/Texas_hold_%27em)
- GTO and Nash in poker: [Poker Academy – What is GTO?](https://poker.academy/blog/post/what-is-gto-in-poker/)
- CS-8211 Mathematical Theory of Games: Nash equilibrium, mixed strategies, imperfect information, pot odds
- PokerKit (optional): Python poker library for extensions

---

*Royal Poker — full documentation. Algorithms and game-theory features are aligned with CS-8211 and similar courses.*

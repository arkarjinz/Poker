# Algorithms and Mathematics

This document explains the **algorithms** and **math** used in Royal Poker: hand evaluation, equity (exact and Monte Carlo), hand strength, pot odds, break-even equity, expected value, and game-theory concepts (Nash equilibrium, GTO). It is aligned with the implementation in `backend/hand_eval.py`, `backend/equity.py`, and `backend/holdem.py`.

---

## Table of contents

1. [Card representation and hand ranking](#1-card-representation-and-hand-ranking)  
2. [Equity (win / tie / lose %)](#2-equity-win--tie--lose-)  
3. [Hand strength (0–100 scalar)](#3-hand-strength-0100-scalar)  
4. [Pot odds and break-even equity](#4-pot-odds-and-break-even-equity)  
5. [GTO hint (suggested action)](#5-gto-hint-suggested-action)  
6. [Game theory (Nash, GTO, mixed strategies)](#6-game-theory-nash-gto-mixed-strategies)  
7. [AI behaviour (summary)](#7-ai-behaviour-summary)  
8. [Summary of key formulas](#8-summary-of-key-formulas)  
9. [Worked example: break-even and EV](#9-worked-example-break-even-and-ev)  
10. [Implementation notes](#10-implementation-notes)  
11. [References](#references)

---

## 1. Card representation and hand ranking

### 1.1 Representation

- **Cards** are pairs `(rank, suit)`:
  - **Rank:** integer 2–14 (2 … 10, J=11, Q=12, K=13, A=14).
  - **Suit:** 0–3 (e.g. spades, hearts, diamonds, clubs).
- **Deck:** 52 cards = all pairs from `{2,…,14} × {0,1,2,3}`.

### 1.2 Hand categories (high to low)

Each hand is a **best five-card hand** chosen from up to seven cards (two hole + five board). Hands are compared by **(category, tiebreak list)**. Category is an integer 1–9:

| # | Category        | Description |
|---|-----------------|-------------|
| 9 | Straight flush  | Five consecutive ranks, same suit |
| 8 | Four of a kind | Four cards of one rank |
| 7 | Full house     | Three of a kind + pair |
| 6 | Flush          | Five cards same suit (any order) |
| 5 | Straight       | Five consecutive ranks (A can be 1 or 14) |
| 4 | Three of a kind| Three cards of one rank |
| 3 | Two pair       | Two different pairs |
| 2 | One pair       | Two cards of one rank |
| 1 | High card      | None of the above; compare by ranks |

**Straight rules:**

- **Ace high:** 10–J–Q–K–A (high card 14).
- **Wheel (ace low):** A–2–3–4–5 (high card 5). So Ace is both 1 and 14 for straights only.

**Tiebreaks:** For same category, a **tiebreak list** of ranks (and kickers) is compared lexicographically (e.g. pair of kings then kickers: [13, 12, 7]). Higher list wins.

### 1.3 Best hand from 7 cards (algorithm)

**Input:** 7 cards (two hole + five community).

**Method:** Enumerate all **C(7,5) = 21** subsets of 5 cards. For each subset, evaluate the 5-card hand to get `(category, tiebreak_list)`. The hand with the **maximum** `(category, tiebreak_list)` (under Python tuple comparison) is the best hand.

**Complexity:** 21 evaluations per 7-card hand. Each 5-card evaluation uses rank counts, straight and flush checks, and tiebreak construction — all O(5) or O(1) per combination.

---

## 2. Equity (win / tie / lose %)

**Equity** is the probability that your hand wins (or ties) against a random opponent hand, with the board completed randomly when needed. We report **win%, tie%, lose%** (percentages that sum to 100).

### 2.1 River: exact equity

On the **river**, all five board cards are known. No more cards are dealt. So we can compute **exact** equity by considering every possible opponent hand.

**Setup:**

- Your hole cards: 2 known.
- Board: 5 known.
- **Used:** 7 cards. **Remaining deck:** 45 cards.

**Opponent hands:** Any 2 distinct cards from the 45: **C(45,2) = 990** possibilities. Each is equally likely if we assume the opponent’s hand is “random” from the remaining deck.

**Algorithm:**

1. Build the deck minus your 2 hole cards and the 5 board cards (45 cards).
2. For each of the **990** combinations of 2 opponent cards:
   - Form opponent’s best 5-card hand from those 2 + 5 board cards.
   - Form your best 5-card hand from your 2 + 5 board cards.
   - Compare; increment **wins**, **ties**, or **losses**.
3. Set:
   - `win_pct  = 100 × wins  / 990`
   - `tie_pct  = 100 × ties  / 990`
   - `lose_pct = 100 × losses / 990`

**Effective equity** (for EV calculations) is often defined as:

\[
\text{Effective equity} = \text{win\%} + \frac{\text{tie\%}}{2}.
\]

You “win” half of ties, so this is your share of the pot in a split.

### 2.2 Preflop / flop / turn: Monte Carlo equity

When the board is **not** complete (0, 3, or 4 cards), the rest of the board and the opponent’s cards are unknown. We **estimate** equity by **Monte Carlo simulation**.

**Idea:**

- Fix your 2 hole cards and the current board (0, 3, or 4 cards).
- Repeat **N** times (e.g. N = 500):
  1. From the remaining deck (excluding your hole cards and current board), **randomly** choose 2 cards for the opponent and the remaining board cards (so the board is completed to 5).
  2. Evaluate your best 5-card hand (your 2 + 5 board) and opponent’s best 5-card hand (opponent’s 2 + same 5 board).
  3. Compare and count win / tie / loss.
- Estimate:
  - `win_pct  ≈ 100 × wins  / N`
  - `tie_pct  ≈ 100 × ties  / N`
  - `lose_pct ≈ 100 × losses / N`

**Why Monte Carlo:** The number of possible opponent hands and board runouts is huge (e.g. on flop: many ways to pick 2 opponent cards and 2 board cards). Enumeration is expensive; sampling gives a good estimate with moderate N. **Larger N** → less variance, more accurate estimate.

**Implementation detail:** For each simulation we shuffle the remaining deck and take the first 2 cards as opponent’s hand and the next `5 - len(community)` as the rest of the board.

---

## 3. Hand strength (0–100 scalar)

Hand strength is a **single number from 0 to 100** used in the UI and by the AI. It is **not** the same as equity; it is a heuristic based on hand category and card quality.

### 3.1 Preflop (no or partial board)

Only your two hole cards are used. The formula combines:

- **High cards:** Higher rank of the two cards increases the score (e.g. linear in `(max_rank - 2) / 12`).
- **Pair:** Pocket pair gets a fixed bonus (+28 in the code).
- **Suited:** Same suit gets a bonus (+6).
- **Connectedness:** Small gap between ranks (e.g. 0–2) helps straights and gets a bonus; medium gap gets a smaller bonus.

Result is clipped to **[0, 100]**.

### 3.2 Postflop (5+ cards total)

Your hole cards + all current board cards are used to form your **best 5-card hand** (category + tiebreaks). Then:

- **Base score:** e.g. `25 + (category - 1) × 8` so higher category → higher base.
- **Kicker component:** The top tiebreak rank (e.g. pair rank or high card) is scaled into a small bonus (0–5).
- Final value is clipped to **[0, 100]**.

So hand strength is a **monotonic** proxy for “how good my hand is” for display and for the AI when it doesn’t use full equity.

---

## 4. Pot odds and break-even equity

When the opponent has bet and you must **call** to continue, the **pot odds** and **break-even equity** tell you how often you need to win for a call to be profitable.

### 4.1 Pot and call sizes

- **Pot** = chips already in the middle (including the opponent’s bet).
- **To call** = amount you must put in to match the current bet (so that your total for this street equals the opponent’s).

### 4.2 Break-even equity (math)

Suppose:

- Current pot (after opponent’s bet) = **P**.
- You must put in **C** to call (your “to call” amount).

If you **call**:

- With probability **q** you win the pot (we use effective equity: win% + tie%/2).
- With probability **1 − q** you lose.

Your **expected profit** from calling is:

\[
\text{EV}_{\text{call}} = q \cdot (P + C) - (1 - q) \cdot C = q(P + C) - C + q C = q(P + C) - C.
\]

Here we treat “win” as winning the whole pot **P + C** (pot plus your call), and “lose” as losing your call **C**. Setting \(\text{EV}_{\text{call}} = 0\):

\[
q (P + C) = C \quad \Rightarrow \quad q = \frac{C}{P + C}.
\]

So the **break-even equity** is:

\[
\boxed{\;\text{Break-even equity} = \frac{C}{P + C} = \frac{\text{to call}}{\text{pot} + \text{to call}}\;}.
\]

In the code, this is expressed as a **percentage**:

\[
\text{break\_even\_equity\_pct} = 100 \times \frac{\text{to\_call}}{\text{pot} + \text{to\_call}}.
\]

### 4.3 Decision rule (positive EV)

- If your **effective equity** (win% + tie%/2) is **greater than** the break-even %, then \(\text{EV}_{\text{call}} > 0\) → **calling is profitable in expectation**.
- If it is **below** break-even, calling is unprofitable in expectation (folding is better than calling from an EV perspective).
- **At** break-even, calling and folding have the same expected value.

This is the “GTO note” in the UI: *“Call if your equity > X% (break-even).”*

---

## 5. GTO hint (suggested action)

The **GTO hint** suggests an action (check, bet, call, raise, fold) using equity when you face a bet, and hand strength otherwise.

### 5.1 When there is no bet to call

- If **hand strength** is high (e.g. > 0.6) and **bet** is legal → suggest **bet**.
- If hand strength is low (e.g. < 0.35) and **check** is legal → suggest **check**.
- Otherwise suggest **bet** if legal, else **check**.

### 5.2 When facing a bet (to call > 0)

We use **effective equity** and **break-even %**:

- **Effective equity** = `win_pct + tie_pct / 2`.
- **Break-even** = `100 × to_call / (pot + to_call)`.

Logic:

- If **effective equity ≥ break_even + 5** and **raise** is legal → suggest **raise** (strong hand).
- Else if **effective equity ≥ break_even** and **call** is legal → suggest **call** (profitable call).
- Else if **effective equity < break_even − 5** and **fold** is legal → suggest **fold** (unprofitable call).
- If equity isn’t used (e.g. error), fall back to hand strength thresholds (e.g. > 0.55 → call, > 0.4 → call, else fold).

So the hint is **EV-oriented**: call when your share of the pot (equity) is above the break-even point, fold when it’s below, and raise when it’s well above.

---

## 6. Game theory (Nash, GTO, mixed strategies)

### 6.1 Imperfect information

Poker is a game of **imperfect information**: you don’t see the opponent’s cards. In game theory (e.g. Mathematical Theory of Games), such games are modeled as **games in extensive form** and analyzed via **Nash equilibrium** and related concepts.

### 6.2 Nash equilibrium

A **Nash equilibrium** is a strategy profile (one strategy per player) such that **no player can improve their expected payoff by unilaterally changing their strategy**. In other words, each player’s strategy is a **best response** to the others.

### 6.3 GTO (game-theory optimal)

**GTO** play means playing a strategy that is part of a Nash equilibrium (or close to it). Such a strategy is **unexploitable**: if the opponent plays optimally, they cannot profit by deviating; if the opponent deviates, we don’t need to change our strategy to be safe (though we could exploit them).

### 6.4 Mixed strategies

In poker, **mixed strategies** are essential: you **randomize** between actions (e.g. sometimes bet, sometimes check) with certain probabilities. That way the opponent cannot know exactly what you have and cannot exploit you by always folding or always calling. The break-even / pot-odds rule (call when equity > break-even) is a **pure** decision rule for one decision (call or fold); full GTO would mix over many situations and bet sizes.

### 6.5 How this project uses game theory

- **Break-even equity** and the **call-if-equity-above-break-even** rule implement the **expected-value** condition for a single decision: call when EV(call) ≥ 0.
- The **GTO hint** uses that same EV rule (via equity vs break-even) to suggest call/raise/fold, which is **aligned with** Nash/EV thinking (e.g. as in CS-8211).
- The **AI (Hard)** uses **pot-odds logic**: it treats hand strength as a proxy for equity and calls with high probability when hand strength (as a %) is at or above the break-even % minus a small margin, making its behavior **EV-aware** in a simplified way.

---

## 7. AI behaviour (summary)

- **Easy:** Bet/call probabilities are more random; less use of hand strength and pot odds.
- **Medium:** Probabilities depend on hand strength and style (tight / balanced / aggressive).
- **Hard:** When facing a bet, the AI compares **hand strength (as %)** to **break-even %**:
  - If strength ≥ break_even − 5% → call with high probability (0.85).
  - If strength ≥ break_even − 15% → call with probability 0.5.
  - Otherwise → lower call probability (0.2 + strength × 0.6).

So the Hard AI **approximates** “call when EV ≥ 0” using hand strength as a proxy for equity.

---

## 8. Summary of key formulas

| Concept | Formula |
|--------|--------|
| **Effective equity** | \(\text{win\%} + \frac{\text{tie\%}}{2}\) |
| **Break-even equity** | \(\displaystyle \frac{\text{to\_call}}{\text{pot} + \text{to\_call}}\) |
| **Break-even %** | \(\displaystyle 100 \times \frac{\text{to\_call}}{\text{pot} + \text{to\_call}}\) |
| **EV(call)** | \(q(P+C) - C\), where \(q\) = effective equity (as decimal) |
| **Call when** | effective equity > break-even % |
| **River exact equity** | Enumerate all C(45,2) opponent hands; win%/tie%/lose% |
| **Preflop/Flop/Turn equity** | Monte Carlo (e.g. 500 runs): random opponent hands + board completion |

---

## 9. Worked example: break-even and EV

**Setup:** Pot is **6** chips, opponent has bet **2** chips. You must put in **2** to call (to_call = 2).

- **Pot** (after opponent’s bet, before your call) = 6.  
- **To call** = 2.  
- **Total pot after your call** = 6 + 2 = 8.

**Break-even equity:**

\[
\frac{\text{to\_call}}{\text{pot} + \text{to\_call}} = \frac{2}{6 + 2} = \frac{2}{8} = 0.25 \quad \Rightarrow \quad 25\%.
\]

So you need to win (or tie in a way that gives you at least 25% of the pot) **at least 25% of the time** for calling to be profitable.

**If your effective equity is 30%:**  
\(\text{EV}_{\text{call}} = 0.30 \times 8 - 2 = 2.4 - 2 = 0.4\) chips per call on average → **call** (positive EV).

**If your effective equity is 20%:**  
\(\text{EV}_{\text{call}} = 0.20 \times 8 - 2 = 1.6 - 2 = -0.4\) chips per call on average → **fold** (negative EV).

**If your effective equity is exactly 25%:**  
\(\text{EV}_{\text{call}} = 0.25 \times 8 - 2 = 0\) → indifferent between call and fold in expectation.

---

## 10. Implementation notes

- **Hand evaluation:** Implemented in `hand_eval.py`. Straight detection handles both ace-high (10–J–Q–K–A) and wheel (A–2–3–4–5). Flush uses suit counts; best 5-card hand is chosen by iterating over all C(7,5) combinations.
- **Equity:** In `equity.py`, river uses `itertools.combinations(deck, 2)` for exact enumeration; preflop/flop/turn use `equity_monte_carlo()` with default `n_simulations=500`. The game state calls `get_equity()` only for the human player (player 0).
- **Theory stats:** In `holdem.py`, `get_theory()` returns `break_even_equity_pct`, `to_call`, `pot`, and `gto_note`. The GTO hint in `get_hint()` uses these plus `get_equity()` when facing a bet.
- **Hand strength:** `equity.hand_strength_0_100()` is used for the UI bar and by the AI’s `_hand_strength()` (scaled 0–1) for bet/call probabilities. Hard AI uses the same break-even comparison with hand strength as a proxy for equity.

---

## References

- Texas Hold'em rules and hand rankings: [Wikipedia](https://en.wikipedia.org/wiki/Texas_hold_%27em)
- GTO and Nash in poker: [Poker Academy – What is GTO?](https://poker.academy/blog/post/what-is-gto-in-poker/)
- CS-8211 Mathematical Theory of Games: Nash equilibrium, mixed strategies, imperfect information, pot odds

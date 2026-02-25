# Member 2 – Backend Code Explanation (Slides 4–6)

**Use this as speaker notes and “grand” talking points for System Architecture & Tech Stack.**

---

## Slide 4 – System Architecture Overview

**What to say:**

> “The system is a **client–server architecture**. The frontend is a Single Page Application in React—it never does a full page reload; it just calls our API. All **game state lives on the backend**. The frontend sends actions over HTTP and gets back the full state. That gives us **one source of truth**: the backend is the only place that knows the deck, the cards, and who wins. The UI can’t cheat and the math can’t be faked—every equity number and every hand ranking is computed server-side.”

**Diagram to describe:**

```
[ React + Tailwind SPA ]  ←→  HTTP (JSON)  ←→  [ FastAPI Backend ]
        (UI only)                                    (State + Logic)
                                                           ↓
                                              [ holdem + hand_eval + equity ]
```

**Key phrase:** *“Stateless HTTP, stateful server—the backend is the single source of truth for the game.”*

---

## Slide 5 – Backend Design (Endpoints & Modules)

### The four core endpoints

**1. `POST /poker/new-hand`** — Start or deal a new hand.

- **Why POST?** It changes server state (new deck, new cards, maybe new game object).
- In code we **create or reuse** a global `HoldemGameState`, post blinds, deal two hole cards per player, then **run the AI until it’s the human’s turn** (e.g. if AI is big blind and checks, we stop). So when the response comes back, the human always sees “your turn” with cards and legal actions.

```python
# main.py (simplified flow)
if reset_stacks or holdem_state is None:
    holdem_state = HoldemGameState(ai_style=..., difficulty=..., ...)
holdem_state.deal()
while not holdem_state.hand_finished and holdem_state.current_player == 1:
    ai_action = holdem_state.get_ai_action()
    holdem_state.act(ai_action)
# Now current_player is 0 (human) — return state
```

**2. `POST /poker/act`** — Send one action: check, bet, call, raise, or fold.

- **Why POST?** It’s a state-changing operation.
- We **validate** (game exists, hand not finished, it’s the human’s turn, action is legal). Then we call `holdem_state.act(action)`. After that we **run the AI in a loop** until the hand ends or it’s the human’s turn again. So one HTTP request can represent “I call” and then “AI thinks and responds”—all in one round-trip.

```python
# main.py
err = holdem_state.act(req.action)
if err:
    raise HTTPException(status_code=400, detail=err)
while not holdem_state.hand_finished and holdem_state.current_player == 1:
    ai_action = holdem_state.get_ai_action()
    holdem_state.act(ai_action)
return _state_response(msg)
```

**3. `GET /poker/state`** — Get current game state (read-only).

- **Why GET?** No state change; we just return the current snapshot (cards, pot, legal actions, equity, theory, session).
- Used when the frontend needs to refresh or recover state.

**4. `GET /poker/hint`** — Get a GTO-style suggested action.

- **Why GET?** We’re not changing state; we’re computing a recommendation from the current state.
- Backend calls `holdem_state.get_hint()`, which uses **equity and break-even %** when you’re facing a bet—so the hint is **game-theory aligned** and computed where the real math lives.

```python
# main.py
@app.get("/poker/hint")
def poker_hint():
    if holdem_state is None or holdem_state.hand_finished or holdem_state.current_player != 0:
        return {"hint": None}
    return {"hint": holdem_state.get_hint()}
```

**Why this design is “grand”:**

- **All game logic and algorithms live in one place.** The frontend never evaluates hands or computes equity—it only displays what the backend sends. That keeps the game **correct** and **auditable** for a course on game theory.

---

### The three backend modules

**1. `main.py`** — API layer.

- FastAPI app, CORS, **Pydantic models** for every request/response (so we get validation and automatic OpenAPI docs).
- A **single global** `holdem_state` (one table). Lifespan clears it on shutdown.
- No poker rules in `main.py`—only HTTP, validation, and delegating to `HoldemGameState`.

**2. `holdem.py`** — Game engine and AI.

- **One class, `HoldemGameState`**: deck, hole cards, community cards, pot, stacks, street, current player, legal actions, achievements, opponent stats.
- Methods: `deal()`, `act()`, `get_legal_actions()`, `get_to_call()`, `get_equity()`, `get_theory()`, `get_hint()`, `get_ai_action()`. So the **entire rule set and game flow** are in one object—easy to reason about and test.
- It **imports** `hand_eval` (best hand, hand name) and `equity` (Monte Carlo, exact river, hand strength). So: **holdem = orchestration; hand_eval and equity = pure algorithms.**

**3. `hand_eval.py`** — Hand ranking only.

- Cards as `(rank, suit)`; rank 2–14, suit 0–3.
- **`best_hand(seven_cards)`** → `(category, tiebreak_list)`. We enumerate all **C(7,5) = 21** five-card subsets and take the maximum. Categories from high card (1) up to straight flush (9). Tiebreaks break ties (e.g. pair of kings vs pair of queens).
- **`eval_five(cards)`** does the actual ranking for five cards: straight/flush detection, count of ranks, etc. So the **combinatorics and comparison logic** are isolated here—no HTTP, no game state.

**4. `equity.py`** — Equity and hand strength only.

- **`equity_exact_river(hole_player, community)`**: board has 5 cards; we take the remaining 45, iterate **all C(45,2) = 990** opponent hole-card pairs, compare best 5-card hands each time. Result: **exact** win%, tie%, lose%—no sampling error.
- **`equity_monte_carlo(hole_player, community, n_simulations=500)`**: for preflop/flop/turn we don’t know the full board or opponent cards; we **sample** 500 random opponent hands and random board runouts, then count wins/ties/losses. So we get a **statistical estimate** that’s fast and good enough for UI and hints.
- **`hand_strength_0_100(hole, community)`**: a 0–100 heuristic (pairs, high cards, suited, connected preflop; category + kicker postflop). Used for the **hand strength bar** and for AI when it doesn’t use full equity.

**Why “all algorithms run server-side” matters:**

- Equity and hand ranking are **deterministic and consistent**. No risk of the frontend using a different formula or an old version. For a **game theory course**, we can say: “The break-even % and the GTO hint are computed by the same backend that runs the game.”

---

## Slide 6 – Frontend Design & Data Flow

**What to say:**

> “The frontend has three main pages: **Landing**, **How To Play**, and the **Game Table**. The Game page doesn’t implement any poker rules—it just sends **actions** to the backend and **displays** whatever the API returns. So the data flow is: **User clicks an action → POST /poker/act with that action → Backend updates state and runs AI → Response includes full state (cards, pot, legal_actions, equity, theory, session) → Frontend re-renders.** The UI always reflects the backend’s truth: equity panel, hand strength meter, game theory panel, and GTO hint all come from the same response. That’s why we can trust the numbers we show—they’re not computed in the browser; they’re computed where the game state lives.”

**One line to remember:**

- *“Every number you see on the table—equity, break-even %, hand strength—is computed on the backend and sent in the API response. The frontend is a thin, reactive view over that state.”*

---

## Bonus: One “grand” code snippet to show (Slide 5 or 6)

If you want to put **one piece of code** on a slide, use the **exact river equity** loop—it’s short and shows “we enumerate every possible opponent hand”:

```python
# equity.py – exact river equity
for (c1, c2) in combinations(deck, 2):
    opp_best = best_hand([c1, c2] + community)
    player_best = best_hand(hole_player + community)
    if player_best > opp_best:
        wins += 1
    elif opp_best > player_best:
        losses += 1
    else:
        ties += 1
# Then: win_pct = 100 * wins / 990, etc.
```

**What to say:**

> “On the river, the board is complete—only the opponent’s two cards are unknown. So we iterate over **every possible** pair of cards from the remaining 45—that’s 990 combinations—and we compare our best hand to the opponent’s best hand each time. No sampling, no randomness here; this is **exact** equity. That’s the same math we use for the GTO hint and for the Legend AI, so the game theory is consistent everywhere.”

---

---

## Code snippets for slides (algorithm & theory tagged)

Use these on slides so you can say exactly which **algorithm** or **game-theory concept** each piece of code implements.

---

### 1. Hand ranking — Combinatorics (C(7,5) enumeration)

**Theory/algorithm:** Enumerate all 5-card subsets from 7 cards; pick the best by (category, tiebreak). Standard Texas Hold'em hand ranking.

**File:** `hand_eval.py`

```python
def best_hand(seven_cards: list[tuple[int, int]]) -> tuple[int, list]:
    """From 7 cards, return (category, tiebreaks) of best 5-card hand."""
    if len(seven_cards) < 5:
        return (0, [])
    best = (0, [])
    for combo in combinations(seven_cards, 5):
        cat, tie = eval_five(list(combo))
        if cat > best[0] or (cat == best[0] and tie > best[1]):
            best = (cat, tie)
    return best
```

**What to say:** “We use **combinatorics**: C(7,5) = 21 possible five-card hands. We evaluate each and take the maximum by category and tiebreak list. This is the same ranking used everywhere—showdown, equity, and hints.”

---

### 2. Exact river equity — Full enumeration (no sampling)

**Theory/algorithm:** On the river, all 5 board cards are known. We enumerate **every** possible opponent hand: C(45,2) = 990. Exact probability (win%, tie%, lose%).

**File:** `equity.py`

```python
def equity_exact_river(hole_player, community):
    known = set(hole_player + community)
    deck = [c for c in make_deck() if c not in known]
    wins, ties, losses = 0, 0, 0
    for (c1, c2) in combinations(deck, 2):
        opp_best = best_hand([c1, c2] + community)
        player_best = best_hand(hole_player + community)
        if player_best > opp_best:
            wins += 1
        elif opp_best > player_best:
            losses += 1
        else:
            ties += 1
    return (100 * wins / total, 100 * ties / total, 100 * losses / total)
```

**What to say:** “On the river we use **exact enumeration**—no randomness. We loop over all 990 possible opponent hole cards and compare best hands. So the equity we show is **exact**, not estimated.”

---

### 3. Monte Carlo equity — Statistical estimation (preflop / flop / turn)

**Theory/algorithm:** When the board isn’t complete, we **sample** 500 random opponent hands and random board runouts; count wins/ties/losses. Standard Monte Carlo for estimating probabilities.

**File:** `equity.py`

```python
def equity_monte_carlo(hole_player, community, n_simulations=500):
    known = set(hole_player + community)
    deck = [c for c in make_deck() if c not in known]
    need_board = 5 - len(community)
    for _ in range(n_simulations):
        random.shuffle(deck)
        opp_cards = [deck[0], deck[1]]
        board_extra = deck[2 : 2 + need_board]
        full_board = community + board_extra
        player_best = best_hand(hole_player + full_board)
        opp_best = best_hand(opp_cards + full_board)
        if player_best > opp_best:
            wins += 1
        elif opp_best > player_best:
            losses += 1
        else:
            ties += 1
    return (100 * wins / total, 100 * ties / total, 100 * losses / total)
```

**What to say:** “For preflop, flop, and turn we use **Monte Carlo simulation**: 500 random runouts. We don’t know the opponent’s cards or the rest of the board, so we sample and estimate win/tie/lose %. It’s fast and accurate enough for the UI and the GTO hint.”

---

### 4. Break-even equity — Pot odds & expected value (EV)

**Theory/algorithm:** **Game theory (CS-8211):** Call is profitable when your equity > break-even. Break-even = to_call / (pot + to_call). So we compute the threshold and expose it to the UI.

**File:** `holdem.py`

```python
def get_theory(self) -> dict:
    """Game-theory stats: break-even equity, pot odds, GTO note."""
    to_call = self.get_to_call()
    pot = self.pot
    if to_call <= 0 or pot < 0:
        break_even = 0
    else:
        total = pot + to_call
        break_even = round(100 * to_call / total, 0) if total else 0
    if to_call > 0:
        gto_note = f"Call if your equity > {int(break_even)}% (break-even)."
    else:
        gto_note = "Check or bet with your range."
    return {
        "break_even_equity_pct": int(break_even),
        "to_call": to_call,
        "pot": pot,
        "gto_note": gto_note,
    }
```

**What to say:** “This is **pot odds** from game theory. Break-even equity is to_call divided by (pot + to_call). If your equity is above that, calling has **positive expected value**. We send this to the frontend so the player sees the exact threshold and the rule: call when equity > break-even %.”

---

### 5. GTO hint — EV-based decision rule (rational play)

**Theory/algorithm:** **Expected value / GTO-style logic:** Use effective equity (win% + tie%/2) and compare to break-even. Suggest raise if equity >> break-even, call if above, fold if below.

**File:** `holdem.py`

```python
# When facing a bet (to_call > 0):
eq = self.get_equity()
break_even = self.get_theory().get("break_even_equity_pct", 0)
effective_equity = eq["win_pct"] + eq["tie_pct"] / 2.0
if break_even > 0:
    if effective_equity >= break_even + 5 and "raise" in legal:
        return "raise"
    if effective_equity >= break_even and "call" in legal:
        return "call"
    if effective_equity < break_even - 5 and "fold" in legal:
        return "fold"
```

**What to say:** “The GTO hint implements an **EV-based decision rule**: we compute effective equity—win% plus half of tie%—and compare it to break-even. If you’re well above, we suggest raise; above, call; below, fold. So the hint is aligned with **rational, game-theory style** play.”

---

### 6. AI mixed strategy — Randomisation (Nash / mixed strategies)

**Theory/algorithm:** **Mixed strategies (CS-8211):** The AI doesn’t always play the same action; it randomises with probabilities derived from hand strength or equity. So the opponent can’t exploit a fixed pattern.

**File:** `holdem.py`

```python
def get_ai_action(self) -> str:
    legal = self.get_legal_actions()
    if not legal:
        return "check"
    if "check" in legal and "bet" in legal:
        return "bet" if random.random() < self._ai_bet_probability() else "check"
    if "fold" in legal and "call" in legal:
        if "raise" in legal and random.random() < 0.3:
            return "raise"
        return "call" if random.random() < self._ai_call_probability() else "fold"
    return random.choice(legal)
```

**What to say:** “The AI uses **randomisation**—it doesn’t always bet or always fold. The probability of bet or call depends on hand strength or, at Legend difficulty, on actual equity. So we’re implementing a simple form of **mixed strategy**: the opponent can’t predict our action with certainty, which connects to **Nash equilibrium** and unexploitable play.”

---

### Quick reference: Algorithm / theory → code location

| Algorithm or theory           | Where in code                          |
|------------------------------|----------------------------------------|
| Hand ranking (combinatorics) | `hand_eval.py`: `best_hand`, `eval_five` |
| Exact river equity           | `equity.py`: `equity_exact_river`      |
| Monte Carlo equity           | `equity.py`: `equity_monte_carlo`      |
| Pot odds / break-even (EV)   | `holdem.py`: `get_theory()`            |
| GTO hint (EV decision rule)  | `holdem.py`: `get_hint()` (when to_call > 0) |
| Mixed strategy (AI)         | `holdem.py`: `get_ai_action()`, `_ai_bet_probability`, `_ai_call_probability` |

---

## Short checklist for your part

- [ ] Describe architecture: SPA ↔ API ↔ Backend; state only on server.
- [ ] Name the four endpoints and say *why* POST vs GET.
- [ ] Say that **all algorithms** (hand eval, equity, break-even, hint) run in the backend.
- [ ] Name the three modules: **main** (API), **holdem** (engine + AI), **hand_eval** + **equity** (algorithms).
- [ ] Explain data flow: action → API → updated state → UI refresh; UI is a view over backend state.
- [ ] Show at least one code block and name the **algorithm or theory** it implements (use the table above).
- [ ] Optionally show the exact river equity loop and say “990 opponent hands, exact equity, no sampling.”



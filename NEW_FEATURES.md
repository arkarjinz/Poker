# New Features (UI & Game Options)

This document describes features added to **Royal Poker** for improved UX, real-poker behaviour, and visibility of game state.

---

## Table stakes (real poker)

- **Configurable when starting a new game**
  - **Starting stack:** 100, 200, or 500 chips (dropdown in header).
  - **Blinds:** 1/2 or 2/4 (small blind / big blind; dropdown in header).
- **Backend:** `POST /poker/new-hand` accepts `starting_stack`, `small_blind`, `big_blind`; used when creating a new session (e.g. “New game” or first hand).
- **Blinds rotation:** Dealer posts the small blind, the other player the big blind. Who is dealer (and thus who pays SB vs BB) **rotates every hand**; you cannot reverse it mid-hand.
- **Docs:** Tooltip on Blinds dropdown; “How to play” explains who pays what and that roles alternate each hand.

---

## Layout & responsiveness

- **No full-page scroll:** Game area is constrained to the viewport; only the **right-hand sidebar** scrolls when its content is tall.
- **Main game column:** Can scroll internally only when needed so the table and action buttons stay usable.
- **Responsive:** Header, table, and sidebar use responsive padding and gaps (`p-2`/`md:p-3`, `gap-2`/`md:gap-3`). On narrow viewports the sidebar stacks below the table with a max height so the table remains visible.
- **Sizing:** Table and cards use a middle ground so the layout fits without a scrollbar while remaining readable (e.g. player cards in `md` size, clear labels).

---

## Left strip (outside the table)

A narrow column on the **darker green** area to the **left of the table** (outside the table card):

1. **Opponent action**
   - Shows the last opponent action: e.g. “Opponent bets”, “Opponent calls”, “Opponent raises”, “Opponent checks”, “Opponent folds”.
   - Styled as a small card with gold border/background; always visible when the opponent has acted.

2. **GTO hint**
   - Shows the current GTO hint (e.g. “raise”, “call”, “bet”) with a “Hide” / “Show GTO hint” control.
   - Placed in a separate card below the opponent action so it stays visible and outside the table.

On small screens the left strip can appear below the table (table first, then strip).

---

## Result & hand outcome

- **Result text** (“You win”, “Opponent wins”, “Split pot”) is shown **inside the table**, at the **top of the table card**, so it is never cut off.
- **Styling:** “You win” in gold; “Split pot” in cream; “Opponent wins” with a red tint so the outcome is easy to see.

---

## Loading state: “AI is thinking…”

- While waiting for the server (e.g. after you act or when dealing a new hand), a **full-screen overlay** is shown instead of a small “Loading…” line.
- **Message:** “AI is thinking…” with a spinner, so it is clear the game is waiting for the AI’s move.
- Overlay is centered and uses a semi-transparent background so it is visible on all screen sizes.

---

## Labels & visibility

- **Section labels** (“Opponent”, “You”, “Board”) use full cream colour and semibold so they stand out on the dark green.
- **Opponent action** and **GTO hint** are on the left strip (see above) so they are easy to find and not hidden by the table.

---

## Summary

| Feature              | Description |
|----------------------|-------------|
| Table stakes         | Starting stack (100/200/500) and blinds (1/2, 2/4) when starting a new game; SB/BB rotate each hand. |
| Left strip           | Opponent action and GTO hint shown on the dark green left of the table. |
| Result banner        | “You win” / “Opponent wins” / “Split pot” inside the table, top of card, always visible. |
| AI is thinking       | Full-screen overlay with “AI is thinking…” and spinner while waiting for the AI. |
| Layout & responsive  | No page scroll; sidebar scrolls; responsive padding; optional main scroll for buttons. |
| Labels               | Clear “Opponent”, “You”, “Board” labels and visible action/hint panels. |

For full project documentation (API, algorithms, difficulty, AI style), see [REPORT.md](REPORT.md).

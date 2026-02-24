"""
Equity and hand-strength algorithms for Texas Hold'em.
- Monte Carlo: random opponent hands + runout for preflop/flop/turn.
- Exact enumeration on river: all C(45,2) opponent hands for exact win/tie/lose %.
"""
import random
from itertools import combinations
from hand_eval import best_hand

def make_deck() -> list[tuple[int, int]]:
    return [(r, s) for r in range(2, 15) for s in range(4)]


def equity_exact_river(hole_player: list[tuple[int, int]], community: list[tuple[int, int]]) -> tuple[float, float, float]:
    """
    Exact equity on river (5 board cards). Enumerates all C(45,2) opponent hole cards.
    Returns (win%, tie%, lose%).
    """
    if len(community) != 5 or len(hole_player) != 2:
        return (0.0, 0.0, 0.0)
    known = set(hole_player + community)
    deck = [c for c in make_deck() if c not in known]
    n = len(deck)
    if n < 2:
        return (0.0, 0.0, 0.0)
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
    total = wins + ties + losses
    return (
        round(100 * wins / total, 1) if total else 0,
        round(100 * ties / total, 1) if total else 0,
        round(100 * losses / total, 1) if total else 0,
    )


def equity_monte_carlo(
    hole_player: list[tuple[int, int]],
    community: list[tuple[int, int]],
    n_simulations: int = 500,
) -> tuple[float, float, float]:
    """
    Returns (win%, tie%, lose%) for the player.
    Opponent gets random two cards; board is completed randomly from remaining deck.
    """
    known = set(hole_player + community)
    deck = [c for c in make_deck() if c not in known]
    wins, ties, losses = 0, 0, 0
    n = len(community)
    need_board = 5 - n
    for _ in range(n_simulations):
        random.shuffle(deck)
        opp_cards = [deck[0], deck[1]]
        board_extra = deck[2 : 2 + need_board]
        full_board = community + board_extra
        player_seven = hole_player + full_board
        opp_seven = opp_cards + full_board
        player_best = best_hand(player_seven)
        opp_best = best_hand(opp_seven)
        if player_best > opp_best:
            wins += 1
        elif opp_best > player_best:
            losses += 1
        else:
            ties += 1
    total = wins + ties + losses
    return (
        round(100 * wins / total, 1) if total else 0,
        round(100 * ties / total, 1) if total else 0,
        round(100 * losses / total, 1) if total else 0,
    )


def hand_strength_0_100(hole: list[tuple[int, int]], community: list[tuple[int, int]]) -> int:
    """
    Scalar hand strength 0-100 for display.
    Preflop: pair bonus, high cards, suited, connected (gap) for straight potential.
    Postflop: best-hand category + top tiebreak rank.
    """
    cards = hole + community
    if len(cards) < 5:
        r0, r1 = hole[0][0], hole[1][0]
        lo, hi = min(r0, r1), max(r0, r1)
        pair = 28 if r0 == r1 else 0
        high = int((hi - 2) / 12.0 * 32)
        suited = 6 if hole[0][1] == hole[1][1] else 0
        # Connectedness: 0-2 gap helps straights
        gap = hi - lo
        if gap <= 2 and not pair:
            connected = 4
        elif gap <= 4:
            connected = 2
        else:
            connected = 0
        return min(100, 12 + high + pair + suited + connected)
    cat, tie = best_hand(cards)
    base = 25 + (cat - 1) * 8
    kicker = min(5, int((tie[0] if tie else 2) / 14.0 * 5))
    return min(100, base + kicker)

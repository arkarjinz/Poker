"""
Texas Hold'em hand evaluation.
Cards: (rank, suit) with rank 2-14 (2..10, J=11, Q=12, K=13, A=14), suit 0-3 (spades, hearts, diamonds, clubs).
Returns comparable (category, tiebreaks) for best 5-card hand from up to 7 cards.
"""
from itertools import combinations

# Hand categories (higher = better)
HIGH_CARD, ONE_PAIR, TWO_PAIR, THREE_KIND, STRAIGHT, FLUSH, FULL_HOUSE, FOUR_KIND, STRAIGHT_FLUSH = range(1, 10)


def rank_str(r: int) -> str:
    if r == 14:
        return "A"
    if r == 13:
        return "K"
    if r == 12:
        return "Q"
    if r == 11:
        return "J"
    return str(r)


def suit_str(s: int) -> str:
    return "shdc"[s] if s in (0, 1, 2, 3) else "?"


def card_to_dict(rank: int, suit: int) -> dict:
    return {"rank": rank, "suit": suit_str(suit)}


def parse_card(card: str | tuple | dict) -> tuple[int, int]:
    """Parse 'As', (14, 0), or {'rank':14,'suit':'s'} -> (rank, suit)."""
    if isinstance(card, (list, tuple)) and len(card) >= 2:
        r, s = card[0], card[1]
        if isinstance(s, str):
            s = "shdc".index(s) if s in "shdc" else 0
        return (int(r), int(s))
    if isinstance(card, dict):
        r = card.get("rank", 0)
        s = card.get("suit", "s")
        if isinstance(s, str):
            s = "shdc".index(s) if s in "shdc" else 0
        return (int(r), int(s))
    if isinstance(card, str) and len(card) >= 2:
        rank_part, suit_part = card[0:-1].upper(), card[-1].lower()
        rank_map = {"A": 14, "K": 13, "Q": 12, "J": 11}
        r = rank_map.get(rank_part) or (int(rank_part) if rank_part.isdigit() else 2)
        s = "shdc".index(suit_part) if suit_part in "shdc" else 0
        return (r, s)
    return (2, 0)


def _ranks(cards: list[tuple[int, int]]) -> list[int]:
    return [c[0] for c in cards]


def _suits(cards: list[tuple[int, int]]) -> list[int]:
    return [c[1] for c in cards]


def _is_straight(ranks: list[int]) -> tuple[bool, int]:
    """Sorted descending. Returns (is_straight, high_rank). Ace-low straight = 5-high."""
    r = sorted(set(ranks), reverse=True)
    if len(r) < 5:
        return (False, 0)
    # Check for A-2-3-4-5
    if 14 in r and 5 in r and 4 in r and 3 in r and 2 in r:
        return (True, 5)
    for i in range(len(r) - 4):
        if r[i] - r[i + 4] == 4:
            return (True, r[i])
    return (False, 0)


def _is_flush(suits: list[int]) -> bool:
    for s in (0, 1, 2, 3):
        if sum(1 for x in suits if x == s) >= 5:
            return True
    return False


def _flush_suit(suits: list[int]) -> int | None:
    for s in (0, 1, 2, 3):
        if sum(1 for x in suits if x == s) >= 5:
            return s
    return None


def _counts(ranks: list[int]) -> list[tuple[int, int]]:
    """List of (rank, count) sorted by count desc then rank desc."""
    from collections import Counter
    c = Counter(ranks)
    return sorted(c.items(), key=lambda x: (-x[1], -x[0]))


def eval_five(cards: list[tuple[int, int]]) -> tuple[int, list]:
    """Evaluate exactly 5 cards. Return (category, tiebreak list)."""
    if len(cards) != 5:
        return (0, [])
    ranks = _ranks(cards)
    suits = _suits(cards)
    counts = _counts(ranks)
    is_flush = _is_flush(suits)
    is_straight, straight_high = _is_straight(ranks)

    # Straight flush (same 5 cards are flush and straight)
    if is_flush and is_straight:
        return (STRAIGHT_FLUSH, [straight_high])
    if is_flush:
        fs = _flush_suit(suits)
        kickers = sorted([c[0] for c in cards if c[1] == fs], reverse=True)[:5]
        return (FLUSH, kickers)
    if is_straight:
        return (STRAIGHT, [straight_high])

    # Four of a kind
    if counts[0][1] == 4:
        quad_rank = counts[0][0]
        kicker = next(c[0] for c in cards if c[0] != quad_rank)
        return (FOUR_KIND, [quad_rank, kicker])
    # Full house
    if counts[0][1] == 3 and counts[1][1] >= 2:
        return (FULL_HOUSE, [counts[0][0], counts[1][0]])
    # Three of a kind
    if counts[0][1] == 3:
        trip = counts[0][0]
        kickers = sorted([c[0] for c in cards if c[0] != trip], reverse=True)[:2]
        return (THREE_KIND, [trip] + kickers)
    # Two pair
    if counts[0][1] == 2 and counts[1][1] == 2:
        p1, p2 = counts[0][0], counts[1][0]
        if p1 < p2:
            p1, p2 = p2, p1
        kicker = next(c[0] for c in cards if c[0] not in (p1, p2))
        return (TWO_PAIR, [p1, p2, kicker])
    # One pair
    if counts[0][1] == 2:
        pair_rank = counts[0][0]
        kickers = sorted([c[0] for c in cards if c[0] != pair_rank], reverse=True)[:3]
        return (ONE_PAIR, [pair_rank] + kickers)
    # High card
    return (HIGH_CARD, sorted(ranks, reverse=True)[:5])


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


def hand_name(category: int, tiebreaks: list) -> str:
    if category == 0:
        return "—"
    names = {
        HIGH_CARD: "High card",
        ONE_PAIR: "One pair",
        TWO_PAIR: "Two pair",
        THREE_KIND: "Three of a kind",
        STRAIGHT: "Straight",
        FLUSH: "Flush",
        FULL_HOUSE: "Full house",
        FOUR_KIND: "Four of a kind",
        STRAIGHT_FLUSH: "Straight flush",
    }
    name = names.get(category, "High card")
    if tiebreaks:
        r0 = tiebreaks[0]
        r0s = rank_str(r0)
        if category == ONE_PAIR:
            return f"{name} of {r0s}s"
        if category == TWO_PAIR:
            r1s = rank_str(tiebreaks[1]) if len(tiebreaks) > 1 else ""
            return f"{name}, {r0s}s and {r1s}s"
        if category in (THREE_KIND, FULL_HOUSE, FOUR_KIND):
            return f"{name}, {r0s}s"
    return name

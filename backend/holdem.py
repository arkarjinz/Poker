"""
Texas Hold'em - Heads-up, fixed limit style.
Blinds and bet size are configurable (real poker: table stakes). Default SB=1, BB=2, bet=2.
One raise per round (max = 2× bet per player per street).
Cards: (rank, suit) rank 2-14, suit 0-3 (s,h,d,c).
"""
import random
from typing import Optional

from hand_eval import best_hand, hand_name, card_to_dict, parse_card
from equity import equity_monte_carlo, equity_exact_river, hand_strength_0_100

DEFAULT_STARTING_STACK = 100
DEFAULT_SB, DEFAULT_BB, DEFAULT_BET = 1, 2, 2
STREET_NAMES = ["Preflop", "Flop", "Turn", "River"]

ACHIEVEMENTS_DEF = {
    "first_win": "First blood",
    "streak_3": "Hot streak (3)",
    "streak_5": "On fire (5)",
    "bluff_win": "Bluff master",
    "hands_10": "Veteran (10 hands)",
    "hands_25": "Grinder (25 hands)",
    "double_stack": "Double up",
    "comeback": "Comeback",
    "shutout": "Shutout (5 wins, 0 loss)",
    "flush_win": "Flush",
    "straight_win": "Straight",
}


def make_deck() -> list[tuple[int, int]]:
    return [(r, s) for r in range(2, 15) for s in range(4)]


class HoldemGameState:
    def __init__(
        self,
        ai_style: str = "balanced",
        starting_stack: int = DEFAULT_STARTING_STACK,
        difficulty: str = "medium",
        challenge_target: int = 0,
        challenge_max_hands: int = 0,
        small_blind: int = DEFAULT_SB,
        big_blind: int = DEFAULT_BB,
        bet_size: int | None = None,
    ):
        self.deck: list[tuple[int, int]] = []
        self.hole: list[list[tuple[int, int]]] = [[], []]  # [player, ai]
        self.community: list[tuple[int, int]] = []
        self.pot = 0
        self.bets_this_round = [0, 0]
        self.current_player = 0
        self.last_bet = 0
        self.hand_finished = False
        self.winner: Optional[int] = None
        self.folded: Optional[int] = None  # who folded
        self.actions_history: list[tuple[int, str]] = []
        self.street = 0  # 0 preflop, 1 flop, 2 turn, 3 river
        self.dealer = 0  # 0 = human is dealer (SB), 1 = AI is dealer (SB)
        self.sb = max(1, min(small_blind, 10))
        self.bb = max(self.sb, min(big_blind, 20))
        if self.bb < self.sb:
            self.bb = self.sb * 2
        self.bet_size = bet_size if bet_size is not None and 1 <= bet_size <= 20 else self.bb
        stack = max(20, min(starting_stack, 5000))
        self.stacks = [stack, stack]
        self.starting_stack = stack
        self._min_stack_seen = stack
        self.ai_style = ai_style
        self.difficulty = difficulty if difficulty in ("easy", "medium", "hard", "legend") else "medium"
        self.challenge_target = max(0, challenge_target)
        self.challenge_max_hands = max(0, challenge_max_hands)
        self.challenge_met: Optional[bool] = None
        self.hands_played = 0
        self.player_wins = 0
        self.ai_wins = 0
        self.ties = 0
        self.points = 0
        self.win_streak = 0
        self.achievements: set[str] = set()
        self.opponent_stats = {"bet": 0, "check": 0, "call": 0, "fold": 0, "raise": 0}
        self._player_contribution_this_hand = 0
        self._hand_rank_player: Optional[tuple] = None
        self._hand_rank_ai: Optional[tuple] = None
        self._hand_name_player: str = ""
        self._hand_name_ai: str = ""
        self._min_stack_seen: int = 0  # track for comeback achievement

    def get_to_call(self) -> int:
        if self.hand_finished:
            return 0
        return max(0, self.last_bet - self.bets_this_round[self.current_player])

    def get_player_contribution_this_hand(self) -> int:
        return self._player_contribution_this_hand

    def _post_blinds(self) -> None:
        # dealer = SB, other = BB (real poker)
        sb_player, bb_player = self.dealer, 1 - self.dealer
        self.stacks[sb_player] -= self.sb
        self.stacks[bb_player] -= self.bb
        self.bets_this_round[sb_player] = self.sb
        self.bets_this_round[bb_player] = self.bb
        self.pot = self.sb + self.bb
        self.last_bet = self.bb
        if sb_player == 0:
            self._player_contribution_this_hand = self.sb
        else:
            self._player_contribution_this_hand = 0
        # Preflop: BB acts first (real poker)
        self.current_player = bb_player

    def deal(self) -> None:
        if self.stacks[0] < self.bb or self.stacks[1] < self.bb:
            self.stacks = [self.starting_stack, self.starting_stack]
        self.deck = make_deck()
        random.shuffle(self.deck)
        self.hole = [[self.deck.pop(), self.deck.pop()], [self.deck.pop(), self.deck.pop()]]
        self.community = []
        self.street = 0
        self.bets_this_round = [0, 0]
        self.last_bet = 0
        self.folded = None
        self.actions_history = []
        self._hand_rank_player = None
        self._hand_rank_ai = None
        self._hand_name_player = ""
        self._hand_name_ai = ""
        self._post_blinds()
        self.hand_finished = False
        self.winner = None

    def _advance_street(self) -> None:
        if self.street == 0:
            # Flop
            self.community.extend([self.deck.pop(), self.deck.pop(), self.deck.pop()])
            self.street = 1
        elif self.street == 1:
            self.community.append(self.deck.pop())
            self.street = 2
        elif self.street == 2:
            self.community.append(self.deck.pop())
            self.street = 3
        else:
            self._showdown()
            return
        self.bets_this_round = [0, 0]
        self.last_bet = 0
        # Postflop: button (dealer) acts first
        self.current_player = self.dealer
        # If it's AI's turn, we'll let the API drive AI action
        return

    def _showdown(self) -> None:
        self.hand_finished = True
        if self.folded is not None:
            self.winner = 1 - self.folded
            self.stacks[self.winner] += self.pot
            self._hand_name_player = "Fold" if self.folded == 0 else ""
            self._hand_name_ai = "Fold" if self.folded == 1 else ""
            self._resolve_showdown()
            return
        # Compare best 5-card hands
        p_cards = self.hole[0] + self.community
        a_cards = self.hole[1] + self.community
        self._hand_rank_player = best_hand(p_cards)
        self._hand_rank_ai = best_hand(a_cards)
        self._hand_name_player = hand_name(self._hand_rank_player[0], self._hand_rank_player[1])
        self._hand_name_ai = hand_name(self._hand_rank_ai[0], self._hand_rank_ai[1])
        c0, t0 = self._hand_rank_player
        c1, t1 = self._hand_rank_ai
        if (c0, t0) > (c1, t1):
            self.winner = 0
        elif (c1, t1) > (c0, t0):
            self.winner = 1
        else:
            self.winner = -1
        if self.winner == -1:
            self.stacks[0] += self.pot // 2
            self.stacks[1] += self.pot - (self.pot // 2)
        else:
            self.stacks[self.winner] += self.pot
        self._resolve_showdown()

    def _resolve_showdown(self) -> None:
        self.hands_played += 1
        self._min_stack_seen = min(self._min_stack_seen, self.stacks[0])
        if self.winner == -1:
            self.ties += 1
            self.win_streak = 0
        elif self.winner == 0:
            self.player_wins += 1
            self.points += self.pot
            self.win_streak += 1
            if self.player_wins == 1:
                self.achievements.add("first_win")
            if self.win_streak >= 3:
                self.achievements.add("streak_3")
            if self.win_streak >= 5:
                self.achievements.add("streak_5")
            if self.hands_played >= 10:
                self.achievements.add("hands_10")
            if self.hands_played >= 25:
                self.achievements.add("hands_25")
            if self.stacks[0] >= 2 * self.starting_stack:
                self.achievements.add("double_stack")
            if self.player_wins >= 5 and self.ai_wins == 0:
                self.achievements.add("shutout")
            if self._hand_rank_player and self._hand_rank_player[0] >= 6:  # flush or better
                self.achievements.add("flush_win")
            if self._hand_rank_player and self._hand_rank_player[0] == 5:
                self.achievements.add("straight_win")
            # Bluff master: won when opponent folded and we had bet or raised
            if self.folded == 1 and any(
                (p, a) == (0, "bet") or (p, a) == (0, "raise") for p, a in self.actions_history
            ):
                self.achievements.add("bluff_win")
            # Comeback: stack was below half of starting, now at or above starting
            if self._min_stack_seen < self.starting_stack // 2 and self.stacks[0] >= self.starting_stack:
                self.achievements.add("comeback")
        else:
            self.ai_wins += 1
            self.points -= self._player_contribution_this_hand
            self.win_streak = 0
        if self.challenge_max_hands > 0:
            if self.stacks[0] >= self.challenge_target:
                self.challenge_met = True
            elif self.hands_played >= self.challenge_max_hands:
                self.challenge_met = False
        # Rotate dealer for next hand
        self.dealer = 1 - self.dealer

    def get_legal_actions(self) -> list[str]:
        if self.hand_finished:
            return []
        to_call = self.get_to_call()
        if to_call == 0:
            return ["check", "bet"]
        # Can call or raise (one raise per round: last_bet can go to 4 if it was 2)
        actions = ["fold", "call"]
        max_bet_this_round = 2 * self.bet_size
        if self.last_bet < max_bet_this_round and self.stacks[self.current_player] >= to_call + self.bet_size:
            actions.append("raise")
        return actions

    def _record_opponent_action(self, action: str) -> None:
        if action in self.opponent_stats:
            self.opponent_stats[action] += 1

    def _put_money(self, amount: int) -> None:
        amount = min(amount, self.stacks[self.current_player])
        self.stacks[self.current_player] -= amount
        self.pot += amount
        self.bets_this_round[self.current_player] += amount
        if self.current_player == 0:
            self._player_contribution_this_hand += amount

    def act(self, action: str) -> Optional[str]:
        action = action.lower()
        legal = self.get_legal_actions()
        if action not in legal:
            return f"Invalid action. Legal: {legal}"

        if self.current_player == 1:
            self._record_opponent_action(action)

        if action == "fold":
            self.folded = self.current_player
            self.hand_finished = True
            self.winner = 1 - self.current_player
            self.stacks[self.winner] += self.pot
            self.actions_history.append((self.current_player, "fold"))
            self._resolve_showdown()
            return None

        if action == "check":
            self.actions_history.append((self.current_player, "check"))
            self.current_player = 1 - self.current_player
            # Advance if other player had already checked this round (check-check)
            if len(self.actions_history) >= 2 and self.actions_history[-2][1] == "check":
                self._advance_street()
            return None

        if action == "call":
            add = self.get_to_call()
            self._put_money(add)
            self.actions_history.append((self.current_player, "call"))
            self.current_player = 1 - self.current_player
            self._advance_street()
            return None

        if action == "bet":
            self._put_money(self.bet_size)
            self.last_bet = self.bets_this_round[self.current_player]
            self.actions_history.append((self.current_player, "bet"))
            self.current_player = 1 - self.current_player
            return None

        if action == "raise":
            to_call = self.get_to_call()
            add = to_call + self.bet_size
            self._put_money(add)
            self.last_bet = self.bets_this_round[self.current_player]
            self.actions_history.append((self.current_player, "raise"))
            self.current_player = 1 - self.current_player
            return None

        return "Unknown action"

    def get_street_name(self) -> str:
        return STREET_NAMES[self.street] if self.street < len(STREET_NAMES) else "Showdown"

    def _hand_strength(self, player: int) -> float:
        """Crude hand strength 0-1 for AI (hole cards + board)."""
        cards = self.hole[player] + self.community
        if len(cards) < 5:
            # Preflop: use hole cards only
            r0, r1 = self.hole[player][0][0], self.hole[player][1][0]
            pair_bonus = 0.3 if r0 == r1 else 0
            high = (max(r0, r1) - 2) / 12.0
            suited = 0.05 if self.hole[player][0][1] == self.hole[player][1][1] else 0
            return min(1.0, 0.2 + high * 0.5 + pair_bonus + suited)
        cat, tie = best_hand(cards)
        return min(1.0, 0.2 + (cat - 1) * 0.1 + (tie[0] / 14.0) * 0.2 if tie else 0.2)

    def _get_ai_equity(self) -> dict:
        """Win/tie/lose % for AI (player 1). Exact on river, Monte Carlo otherwise."""
        if self.hand_finished or len(self.hole[1]) != 2:
            return {"win_pct": 0.0, "tie_pct": 0.0, "lose_pct": 0.0}
        try:
            if len(self.community) == 5:
                w, t, l = equity_exact_river(self.hole[1], self.community)
            else:
                w, t, l = equity_monte_carlo(self.hole[1], self.community, n_simulations=500)
            return {"win_pct": w, "tie_pct": t, "lose_pct": l}
        except Exception:
            return {"win_pct": 0.0, "tie_pct": 0.0, "lose_pct": 0.0}

    def _legend_suggested_action(self) -> Optional[str]:
        """EV-optimal suggested action for Legend AI (player 1). Uses actual equity."""
        legal = self.get_legal_actions()
        if not legal:
            return None
        to_call = self.get_to_call()
        if to_call == 0:
            # Check or bet: use equity when available, else hand strength
            eq = self._get_ai_equity()
            effective = eq["win_pct"] + eq["tie_pct"] / 2.0
            strength = self._hand_strength(1)
            # Bet when we have a real edge (equity > 55% or strong hand)
            should_bet = effective >= 55.0 if (eq["win_pct"] + eq["tie_pct"] + eq["lose_pct"]) > 0 else strength >= 0.6
            if "bet" in legal and should_bet:
                return "bet"
            if "check" in legal:
                return "check"
            return "bet" if "bet" in legal else legal[0]
        # Facing a bet: use break-even vs effective equity
        eq = self._get_ai_equity()
        effective = eq["win_pct"] + eq["tie_pct"] / 2.0
        theory = self.get_theory()
        break_even = theory.get("break_even_equity_pct", 0)
        if break_even <= 0:
            return "call" if "call" in legal else "fold"
        if effective >= break_even + 8 and "raise" in legal:
            return "raise"
        if effective >= break_even:
            return "call" if "call" in legal else "fold"
        return "fold" if "fold" in legal else "call"

    def _ai_bet_probability(self) -> float:
        strength = self._hand_strength(1)
        if self.difficulty == "legend":
            # Legend: bet only with strong equity or hand
            suggested = self._legend_suggested_action()
            if suggested == "bet":
                return 0.92
            if suggested == "check":
                return 0.08
            return 0.35 + strength * 0.4
        if self.difficulty == "hard":
            return 0.3 + strength * 0.5
        if self.difficulty == "easy":
            return 0.3 + random.random() * 0.4
        if self.ai_style == "tight":
            return strength * 0.6
        if self.ai_style == "aggressive":
            return 0.4 + strength * 0.4
        return 0.25 + strength * 0.5

    def _ai_call_probability(self) -> float:
        strength = self._hand_strength(1)
        if self.difficulty == "legend":
            # Legend: use actual equity vs break-even (EV-based)
            eq = self._get_ai_equity()
            effective = eq["win_pct"] + eq["tie_pct"] / 2.0
            to_call = self.get_to_call()
            if to_call > 0 and self.pot + to_call > 0:
                break_even = 100 * to_call / (self.pot + to_call)
                if effective >= break_even + 3:
                    return 0.95
                if effective >= break_even:
                    return 0.88
                if effective < break_even - 3:
                    return 0.12
                return 0.5
            return 0.3 + strength * 0.5
        if self.difficulty == "hard":
            # Use pot-odds logic: call when hand strength (proxy for equity) >= break-even
            to_call = self.get_to_call()
            if to_call > 0 and self.pot + to_call > 0:
                break_even_pct = 100 * to_call / (self.pot + to_call)
                if strength * 100 >= break_even_pct - 5:
                    return 0.85
                if strength * 100 >= break_even_pct - 15:
                    return 0.5
            return 0.2 + strength * 0.6
        if self.difficulty == "easy":
            return 0.4 + random.random() * 0.4
        if self.ai_style == "tight":
            return strength * 0.5
        if self.ai_style == "aggressive":
            return 0.5 + strength * 0.3
        return 0.3 + strength * 0.5

    def get_ai_action(self) -> str:
        legal = self.get_legal_actions()
        if not legal:
            return "check"
        # Legend: follow EV-optimal action with high probability (92%), else randomise slightly
        if self.difficulty == "legend":
            suggested = self._legend_suggested_action()
            if suggested and suggested in legal:
                if random.random() < 0.92:
                    return suggested
            return random.choice(legal)
        if "check" in legal and "bet" in legal:
            return "bet" if random.random() < self._ai_bet_probability() else "check"
        if "fold" in legal and "call" in legal:
            if "raise" in legal and random.random() < 0.3:
                return "raise"
            return "call" if random.random() < self._ai_call_probability() else "fold"
        return random.choice(legal)

    def get_hint(self) -> Optional[str]:
        if self.hand_finished or self.current_player != 0:
            return None
        legal = self.get_legal_actions()
        if not legal:
            return None
        strength = self._hand_strength(0)
        to_call = self.get_to_call()
        if to_call == 0:
            if strength > 0.6 and "bet" in legal:
                return "bet"
            if strength < 0.35 and "check" in legal:
                return "check"
            return "bet" if "bet" in legal else "check"
        if to_call > 0:
            # Use equity when available for EV-based hint
            try:
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
            except Exception:
                pass
            if strength > 0.55:
                return "call" if "call" in legal else "raise"
            if strength > 0.4:
                return "call" if "call" in legal else "fold"
            return "fold" if "fold" in legal else None
        return legal[0]

    def get_equity(self) -> dict:
        """Win/tie/lose % vs random opponent. Exact on river, Monte Carlo otherwise. Only for player 0."""
        if self.hand_finished or len(self.hole[0]) != 2:
            return {"win_pct": 0, "tie_pct": 0, "lose_pct": 0}
        try:
            if len(self.community) == 5:
                w, t, l = equity_exact_river(self.hole[0], self.community)
            else:
                w, t, l = equity_monte_carlo(self.hole[0], self.community, n_simulations=500)
            return {"win_pct": w, "tie_pct": t, "lose_pct": l}
        except Exception:
            return {"win_pct": 0, "tie_pct": 0, "lose_pct": 0}

    def get_hand_strength_pct(self) -> int:
        """0-100 hand strength for player 0."""
        if len(self.hole[0]) != 2:
            return 0
        return hand_strength_0_100(self.hole[0], self.community)

    def get_theory(self) -> dict:
        """Game-theory stats: break-even equity, pot odds, GTO note."""
        to_call = self.get_to_call()
        pot = self.pot
        if to_call <= 0 or pot < 0:
            break_even = 0
        else:
            total = pot + to_call
            break_even = round(100 * to_call / total, 0) if total else 0
        # GTO note: call when equity > break_even
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

    def get_opponent_summary(self) -> dict:
        total = sum(self.opponent_stats.values())
        if total == 0:
            return {"bet_pct": 0, "call_pct": 0, "total_actions": 0}
        call_fold = self.opponent_stats["call"] + self.opponent_stats["fold"]
        return {
            "bet_pct": round(100 * (self.opponent_stats["bet"] + self.opponent_stats["raise"]) / max(1, total)),
            "call_pct": round(100 * self.opponent_stats["call"] / max(1, call_fold)) if call_fold else 0,
            "total_actions": total,
        }

    def your_cards_dict(self) -> list[dict]:
        return [card_to_dict(c[0], c[1]) for c in self.hole[0]]

    def ai_cards_dict(self) -> list[dict]:
        return [card_to_dict(c[0], c[1]) for c in self.hole[1]]

    def community_dict(self) -> list[dict]:
        return [card_to_dict(c[0], c[1]) for c in self.community]

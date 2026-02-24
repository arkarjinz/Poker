"""
Kuhn Poker - Gameplay, rewards, achievements, opponent modeling, difficulty.
"""
import random
from typing import Optional

DEFAULT_STARTING_STACK = 20
DEFAULT_ANTE = 1

ACHIEVEMENTS_DEF = {
    "first_win": "First blood",
    "streak_3": "Hot streak (3)",
    "streak_5": "On fire (5)",
    "bluff_win": "Bluff master",
    "call_win_2": "Gutsy call",
    "hands_10": "Veteran (10 hands)",
    "hands_25": "Grinder (25 hands)",
    "double_stack": "Double up",
    "comeback": "Comeback",
    "shutout": "Shutout (5 wins, 0 loss)",
}


class KuhnGameState:
    """Kuhn Poker with points, achievements, opponent stats, difficulty, challenge."""

    def __init__(
        self,
        ai_style: str = "balanced",
        starting_stack: int = DEFAULT_STARTING_STACK,
        ante: int = DEFAULT_ANTE,
        difficulty: str = "medium",
        challenge_target: int = 0,
        challenge_max_hands: int = 0,
    ):
        self.deck = [1, 2, 3]
        self.player_cards: list[Optional[int]] = [None, None]
        self.pot = 0
        self.bets_this_round = [0, 0]
        self.ante = max(1, min(ante, 5))
        self.current_player = 0
        self.last_bet = 0
        self.hand_finished = False
        self.winner: Optional[int] = None
        self.actions_history: list[tuple[int, str]] = []
        stack = max(2, min(starting_stack, 100))
        self.stacks = [stack, stack]
        self.starting_stack = stack
        self.ai_style = ai_style
        self.difficulty = difficulty if difficulty in ("easy", "medium", "hard") else "medium"
        self.challenge_target = max(0, challenge_target)
        self.challenge_max_hands = max(0, challenge_max_hands)
        self.challenge_met: Optional[bool] = None  # None = not started or in progress, True/False when decided

        self.hands_played = 0
        self.player_wins = 0
        self.ai_wins = 0
        self.ties = 0
        self.points = 0
        self.win_streak = 0
        self.achievements: set[str] = set()
        self.opponent_stats = {"bet": 0, "check": 0, "call": 0, "fold": 0}
        self._player_contribution_this_hand = 0

    def get_to_call(self) -> int:
        if self.hand_finished:
            return 0
        return max(0, self.last_bet - self.bets_this_round[self.current_player])

    def get_player_contribution_this_hand(self) -> int:
        """Total chips you have put in the current hand (ante + any bet/call)."""
        return self._player_contribution_this_hand

    def deal(self) -> None:
        if self.stacks[0] < self.ante or self.stacks[1] < self.ante:
            self.stacks = [self.starting_stack, self.starting_stack]
        random.shuffle(self.deck)
        self.player_cards[0] = self.deck[0]
        self.player_cards[1] = self.deck[1]
        self.pot = 2 * self.ante
        self.bets_this_round = [self.ante, self.ante]
        self.stacks[0] -= self.ante
        self.stacks[1] -= self.ante
        self._player_contribution_this_hand = self.ante
        self.current_player = 0
        self.last_bet = self.ante
        self.hand_finished = False
        self.winner = None
        self.actions_history = []

    def get_legal_actions(self) -> list[str]:
        if self.hand_finished:
            return []
        to_call = self.get_to_call()
        if to_call == 0:
            return ["check", "bet"]
        return ["fold", "call"]

    def _record_opponent_action(self, action: str) -> None:
        if action in self.opponent_stats:
            self.opponent_stats[action] += 1

    def _resolve_showdown(self) -> None:
        self.hands_played += 1

        if self.winner == -1:
            self.stacks[0] += self.pot // 2
            self.stacks[1] += self.pot - (self.pot // 2)
            self.ties += 1
            self.win_streak = 0
            self.points += 0
        else:
            self.stacks[self.winner] += self.pot
            if self.winner == 0:
                self.player_wins += 1
                self.points += self.pot
                self.win_streak += 1
                if self.player_wins == 1:
                    self.achievements.add("first_win")
                if self.player_cards[0] == 1:
                    self.achievements.add("bluff_win")
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
                if self.player_cards[0] == 2 and any(a[0] == 0 and a[1] == "call" for a in self.actions_history):
                    self.achievements.add("call_win_2")
                if self.stacks[0] < self.starting_stack:
                    self.achievements.add("comeback")
            else:
                self.ai_wins += 1
                self.points -= self._player_contribution_this_hand
                self.win_streak = 0

            if self.winner == 0 and self.stacks[0] < self.starting_stack and self.stacks[0] >= self.starting_stack - 5:
                self.achievements.add("comeback")

        if self.hands_played >= 10:
            self.achievements.add("hands_10")
        if self.hands_played >= 25:
            self.achievements.add("hands_25")

        if self.challenge_max_hands > 0:
            if self.stacks[0] >= self.challenge_target:
                self.challenge_met = True
            elif self.hands_played >= self.challenge_max_hands:
                self.challenge_met = False

    def act(self, action: str) -> Optional[str]:
        action = action.lower()
        legal = self.get_legal_actions()
        if action not in legal:
            return f"Invalid action. Legal: {legal}"

        if self.current_player == 1:
            self._record_opponent_action(action)

        if action == "fold":
            self.hand_finished = True
            self.winner = 1 - self.current_player
            self.actions_history.append((self.current_player, "fold"))
            self._resolve_showdown()
            return None

        if action == "check":
            self.actions_history.append((self.current_player, "check"))
            self.current_player = 1 - self.current_player
            if len(self.actions_history) >= 2 and self.actions_history[-2][1] == "check":
                self._showdown()
            return None

        if action == "call":
            add = self.last_bet - self.bets_this_round[self.current_player]
            if self.current_player == 0:
                self._player_contribution_this_hand += add
            self.stacks[self.current_player] -= add
            self.bets_this_round[self.current_player] = self.last_bet
            self.pot += add
            self.actions_history.append((self.current_player, "call"))
            self.current_player = 1 - self.current_player
            self._showdown()
            return None

        if action == "bet":
            add = 1
            if self.current_player == 0:
                self._player_contribution_this_hand += add
            self.stacks[self.current_player] -= add
            self.bets_this_round[self.current_player] = self.last_bet + add
            self.pot += add
            self.last_bet = self.bets_this_round[self.current_player]
            self.actions_history.append((self.current_player, "bet"))
            self.current_player = 1 - self.current_player
            return None

        return "Unknown action"

    def _showdown(self) -> None:
        self.hand_finished = True
        if self.player_cards[0] > self.player_cards[1]:
            self.winner = 0
        elif self.player_cards[1] > self.player_cards[0]:
            self.winner = 1
        else:
            self.winner = -1
        self._resolve_showdown()

    def _ai_bet_probability(self) -> float:
        card = self.player_cards[1]
        if self.difficulty == "hard":
            return 0.33 * card
        if self.difficulty == "easy":
            return 0.4 + random.random() * 0.3
        if self.ai_style == "tight":
            return (card - 1) / 3
        if self.ai_style == "aggressive":
            return 0.33 + (card / 3)
        return 0.4 + (card - 1) * 0.2

    def _ai_call_probability(self) -> float:
        card = self.player_cards[1]
        if self.difficulty == "hard":
            return 0.2 + 0.4 * (card - 1)
        if self.difficulty == "easy":
            return 0.3 + random.random() * 0.5
        if self.ai_style == "tight":
            return (card - 1) / 2
        if self.ai_style == "aggressive":
            return 0.5 + (card - 1) * 0.25
        return 0.3 + (card - 1) * 0.35

    def get_ai_action(self) -> str:
        legal = self.get_legal_actions()
        if not legal:
            return "check"
        if self.difficulty == "hard" and random.random() < 0.7:
            hint = self._hint_for_ai()
            if hint and hint in legal:
                return hint
        if "check" in legal and "bet" in legal:
            return "bet" if random.random() < self._ai_bet_probability() else "check"
        if "fold" in legal and "call" in legal:
            return "call" if random.random() < self._ai_call_probability() else "fold"
        return random.choice(legal)

    def _hint_for_ai(self) -> Optional[str]:
        card = self.player_cards[1]
        to_call = self.get_to_call()
        if to_call == 0:
            return "bet" if card >= 2 else "check"
        return "call" if card >= 2 else "fold"

    def get_hint(self) -> Optional[str]:
        if self.hand_finished or self.current_player != 0:
            return None
        legal = self.get_legal_actions()
        if not legal:
            return None
        card = self.player_cards[0]
        to_call = self.get_to_call()
        if to_call == 0:
            if card == 3 and "bet" in legal:
                return "bet"
            if card == 1 and "check" in legal:
                return "check"
            return "bet" if "bet" in legal else "check"
        if to_call > 0:
            if card == 3:
                return "call" if "call" in legal else None
            if card == 2:
                return "call" if "call" in legal else "fold"
            return "fold" if "fold" in legal else None
        return legal[0]

    def get_opponent_summary(self) -> dict:
        total = sum(self.opponent_stats.values())
        if total == 0:
            return {"bet_pct": 0, "call_pct": 0, "total_actions": 0}
        return {
            "bet_pct": round(100 * self.opponent_stats["bet"] / total),
            "call_pct": round(100 * self.opponent_stats["call"] / max(1, self.opponent_stats["call"] + self.opponent_stats["fold"])),
            "total_actions": total,
        }

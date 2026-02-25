"""
Poker backend - Texas Hold'em with rewards, achievements, difficulty, challenge mode.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from holdem import HoldemGameState

holdem_state: HoldemGameState | None = None

_CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174",
    ).split(",") if o.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global holdem_state
    holdem_state = None
    yield
    holdem_state = None


app = FastAPI(title="Poker API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ActionRequest(BaseModel):
    action: str


class CardOut(BaseModel):
    rank: int
    suit: str


class OpponentStats(BaseModel):
    bet_pct: int
    call_pct: int
    total_actions: int


class SessionStats(BaseModel):
    hands_played: int
    player_wins: int
    ai_wins: int
    ties: int
    points: int
    level: int
    win_streak: int
    achievements: list[str]
    opponent_stats: OpponentStats
    challenge_target: int
    challenge_max_hands: int
    challenge_met: bool | None


class GameConfig(BaseModel):
    starting_stack: int
    small_blind: int
    big_blind: int
    difficulty: str


class EquityOut(BaseModel):
    win_pct: float
    tie_pct: float
    lose_pct: float


class TheoryOut(BaseModel):
    break_even_equity_pct: int
    to_call: int
    pot: int
    gto_note: str


class NewHandResponse(BaseModel):
    your_cards: list[CardOut]
    ai_cards: list[CardOut]  # only at showdown
    community_cards: list[CardOut]
    street: str
    pot: int
    current_player: int
    legal_actions: list[str]
    hand_finished: bool
    winner: int | None
    hand_name_player: str
    hand_name_ai: str
    message: str
    your_stack: int
    ai_stack: int
    to_call: int
    your_bet_this_hand: int
    equity: EquityOut
    hand_strength_pct: int
    theory: TheoryOut
    session: SessionStats
    config: GameConfig


class ActionRecord(BaseModel):
    player: int
    action: str


class StateResponse(BaseModel):
    your_cards: list[CardOut]
    ai_cards: list[CardOut]
    community_cards: list[CardOut]
    street: str
    pot: int
    current_player: int
    legal_actions: list[str]
    hand_finished: bool
    winner: int | None
    hand_name_player: str
    hand_name_ai: str
    actions_history: list[ActionRecord]
    message: str
    your_stack: int
    ai_stack: int
    to_call: int
    your_bet_this_hand: int
    equity: EquityOut
    hand_strength_pct: int
    theory: TheoryOut
    session: SessionStats
    config: GameConfig


@app.get("/")
def root():
    return {"message": "Poker API (Texas Hold'em)", "docs": "/docs"}


def _config() -> GameConfig:
    if holdem_state is None:
        return GameConfig(starting_stack=100, small_blind=1, big_blind=2, difficulty="medium")
    return GameConfig(
        starting_stack=holdem_state.starting_stack,
        small_blind=holdem_state.sb,
        big_blind=holdem_state.bb,
        difficulty=holdem_state.difficulty,
    )


def _session() -> SessionStats:
    if holdem_state is None:
        return SessionStats(
            hands_played=0,
            player_wins=0,
            ai_wins=0,
            ties=0,
            points=0,
            level=0,
            win_streak=0,
            achievements=[],
            opponent_stats=OpponentStats(bet_pct=0, call_pct=0, total_actions=0),
            challenge_target=0,
            challenge_max_hands=0,
            challenge_met=None,
        )
    summary = holdem_state.get_opponent_summary()
    level = max(0, holdem_state.points // 100)
    return SessionStats(
        hands_played=holdem_state.hands_played,
        player_wins=holdem_state.player_wins,
        ai_wins=holdem_state.ai_wins,
        ties=holdem_state.ties,
        points=holdem_state.points,
        level=level,
        win_streak=holdem_state.win_streak,
        achievements=sorted(holdem_state.achievements),
        opponent_stats=OpponentStats(**summary),
        challenge_target=holdem_state.challenge_target,
        challenge_max_hands=holdem_state.challenge_max_hands,
        challenge_met=holdem_state.challenge_met,
    )


def _card_out(c: dict) -> CardOut:
    return CardOut(rank=c["rank"], suit=c["suit"])


@app.get("/poker/config", response_model=GameConfig)
def poker_config():
    return _config()


@app.get("/poker/hint")
def poker_hint():
    global holdem_state
    if holdem_state is None or holdem_state.hand_finished or holdem_state.current_player != 0:
        return {"hint": None}
    return {"hint": holdem_state.get_hint()}


@app.post("/poker/new-hand", response_model=NewHandResponse)
def poker_new_hand(
    ai_style: str = "balanced",
    reset_stacks: bool = False,
    starting_stack: int = 100,
    difficulty: str = "medium",
    challenge_target: int = 0,
    challenge_max_hands: int = 0,
    small_blind: int = 1,
    big_blind: int = 2,
):
    global holdem_state
    if ai_style not in ("tight", "aggressive", "balanced"):
        ai_style = "balanced"
    if difficulty not in ("easy", "medium", "hard", "legend"):
        difficulty = "medium"
    if reset_stacks or holdem_state is None:
        holdem_state = HoldemGameState(
            ai_style=ai_style,
            starting_stack=starting_stack,
            difficulty=difficulty,
            challenge_target=challenge_target,
            challenge_max_hands=challenge_max_hands,
            small_blind=small_blind,
            big_blind=big_blind,
        )
    else:
        holdem_state.ai_style = ai_style
        holdem_state.difficulty = difficulty
    if holdem_state.stacks[0] < holdem_state.starting_stack // 5 or holdem_state.stacks[1] < holdem_state.starting_stack // 5:
        holdem_state.stacks = [holdem_state.starting_stack, holdem_state.starting_stack]
    holdem_state.deal()
    while not holdem_state.hand_finished and holdem_state.current_player == 1:
        ai_action = holdem_state.get_ai_action()
        holdem_state.act(ai_action)
    ai_cards = holdem_state.ai_cards_dict() if holdem_state.hand_finished else []
    eq = holdem_state.get_equity()
    th = holdem_state.get_theory()
    return NewHandResponse(
        your_cards=[_card_out(c) for c in holdem_state.your_cards_dict()],
        ai_cards=[_card_out(c) for c in ai_cards],
        community_cards=[_card_out(c) for c in holdem_state.community_dict()],
        street=holdem_state.get_street_name(),
        pot=holdem_state.pot,
        current_player=holdem_state.current_player,
        legal_actions=holdem_state.get_legal_actions(),
        hand_finished=holdem_state.hand_finished,
        winner=holdem_state.winner,
        hand_name_player=holdem_state._hand_name_player,
        hand_name_ai=holdem_state._hand_name_ai,
        message="Your turn." if holdem_state.current_player == 0 else "AI acted.",
        your_stack=holdem_state.stacks[0],
        ai_stack=holdem_state.stacks[1],
        to_call=holdem_state.get_to_call(),
        your_bet_this_hand=holdem_state.get_player_contribution_this_hand(),
        equity=EquityOut(**eq),
        hand_strength_pct=holdem_state.get_hand_strength_pct(),
        theory=TheoryOut(**th),
        session=_session(),
        config=_config(),
    )


def _state_response(msg: str) -> StateResponse:
    ai_cards = holdem_state.ai_cards_dict() if holdem_state.hand_finished else []
    eq = holdem_state.get_equity()
    th = holdem_state.get_theory()
    return StateResponse(
        your_cards=[_card_out(c) for c in holdem_state.your_cards_dict()],
        ai_cards=[_card_out(c) for c in ai_cards],
        community_cards=[_card_out(c) for c in holdem_state.community_dict()],
        street=holdem_state.get_street_name(),
        pot=holdem_state.pot,
        current_player=holdem_state.current_player,
        legal_actions=holdem_state.get_legal_actions(),
        hand_finished=holdem_state.hand_finished,
        winner=holdem_state.winner,
        hand_name_player=holdem_state._hand_name_player,
        hand_name_ai=holdem_state._hand_name_ai,
        actions_history=[ActionRecord(player=p, action=a) for p, a in holdem_state.actions_history],
        message=msg,
        your_stack=holdem_state.stacks[0],
        ai_stack=holdem_state.stacks[1],
        to_call=holdem_state.get_to_call(),
        your_bet_this_hand=holdem_state.get_player_contribution_this_hand(),
        equity=EquityOut(**eq),
        hand_strength_pct=holdem_state.get_hand_strength_pct(),
        theory=TheoryOut(**th),
        session=_session(),
        config=_config(),
    )


@app.get("/poker/state", response_model=StateResponse)
def poker_state_get():
    global holdem_state
    if holdem_state is None:
        raise HTTPException(status_code=400, detail="No game. Start a new hand with POST /poker/new-hand")
    return _state_response("")


@app.post("/poker/act", response_model=StateResponse)
def poker_act(req: ActionRequest):
    global holdem_state
    if holdem_state is None:
        raise HTTPException(status_code=400, detail="No game. Start a new hand first.")
    if holdem_state.hand_finished:
        raise HTTPException(status_code=400, detail="Hand finished. Start a new hand.")
    if holdem_state.current_player != 0:
        raise HTTPException(status_code=400, detail="Not your turn.")
    err = holdem_state.act(req.action)
    if err:
        raise HTTPException(status_code=400, detail=err)
    while not holdem_state.hand_finished and holdem_state.current_player == 1:
        ai_action = holdem_state.get_ai_action()
        holdem_state.act(ai_action)
    msg = "Hand over." if holdem_state.hand_finished else "Your turn."
    if holdem_state.hand_finished and holdem_state.winner is not None:
        if holdem_state.winner == -1:
            msg = "Tie. Pot split."
        elif holdem_state.winner == 0:
            msg = "You win!"
        else:
            msg = "AI wins."
    return _state_response(msg)

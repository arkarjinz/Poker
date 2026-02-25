# Royal Poker — Texas Hold'em & Game Theory

A web-based **Texas Hold'em** heads-up game with a React + Tailwind frontend and FastAPI backend. Play against an adaptive AI with real hand rankings, blinds, four betting rounds, and game-theory tools (equity, break-even odds, optional GTO hint).

**Full documentation (quick start, API, algorithms, AI behaviour, difficulty, AI style):** [REPORT.md](REPORT.md)  
**New features (table stakes, left strip, result banner, AI is thinking, layout):** [NEW_FEATURES.md](NEW_FEATURES.md)

## Quick Start

**Backend:** `cd backend` → `python -m venv venv` → `venv\Scripts\activate` → `pip install -r requirements.txt` → `uvicorn main:app --reload --host 0.0.0.0`  
**Frontend:** `cd frontend` → `npm install` → `npm run dev`

- API: [http://localhost:8000](http://localhost:8000) (docs: /docs)  
- App: [http://localhost:5173](http://localhost:5173)

## License

MIT.

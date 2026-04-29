# FitVision Lite

Hackathon-friendly full-stack AI fitness app with auth, profile, live CV rep counting, duel mode, social friends, leaderboard, chatbot, and voice input.

## Folder Structure

```text
backend/
  main.py
  database.py
  models.py
  schemas.py
  auth.py
  workouts.py
  social.py
  leaderboard.py
  chatbot.py
  websocket.py
  cv/
    mediapipe_utils.py
    exercise_counter.py
frontend/
  src/
    components/
    pages/
    context/
    utils/
    App.js
```

## Backend Setup

1. Create PostgreSQL DB named `fitvision`.
2. Copy `.env.example` to `.env` and update values.
3. Install dependencies:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

4. Run backend:

```bash
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo Flow

1. Signup two users.
2. Start live workout and verify reps update.
3. Open duel page in two browser windows, send invite, accept, and finish.
4. Send friend requests and accept/reject in dashboard.
5. Check leaderboard updates.
6. Use chatbot with text or voice input.

## Notes

- Built for short hackathon implementation speed.
- Duel mode uses simple event-based websocket updates.
- Chatbot uses Groq if key is configured, otherwise fallback rule logic.

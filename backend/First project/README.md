# Fitness Backend API

A comprehensive fitness tracking backend built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy**.

## Features

- 🔐 **Authentication** — JWT-based auth with TOTP 2FA support
- 👤 **User Profiles** — Detailed fitness profiles with physical stats
- 🏋️ **Workouts** — AI/Vision and manual workout tracking
- 💧 **Water Tracking** — Daily water intake logging
- 🗓️ **Routines** — Custom exercise routines with steps
- 🏆 **Gamification** — XP, levels, streaks, and badges
- 📊 **Dashboard** — Aggregated fitness stats and insights
- 👥 **Social** — Leaderboard, friends, and activity feed
- 💬 **Real-time Chat** — WebSocket-powered messaging
- 📅 **Workout Plans** — Scheduled workouts by day

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | JWT + bcrypt + TOTP |
| Real-time | WebSocket |

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 14+

### 2. Setup

```bash
# Clone and enter the project
cd "First project"

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database URL and secret key
```

### 3. Database Setup

```bash
# Create the PostgreSQL database
createdb fitness_db

# Run migrations (or let the app auto-create tables on first start)
alembic upgrade head
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. API Documentation

Once running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API Overview

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create new account |
| POST | `/login` | Login and get JWT |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset via token |
| POST | `/change-password` | Change password (auth required) |

### TOTP (2FA)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/totp/setup` | Get TOTP secret + QR code |
| POST | `/totp/verify` | Verify OTP and enable 2FA |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/upload-avatar` | Upload avatar image |

### Workouts
| Method | Endpoint | Description |
|---|---|---|
| POST | `/workouts/ai` | Log AI/Vision workout |
| POST | `/workouts/manual` | Log manual workout |
| GET | `/workouts` | Get workout history |

### Water Tracking
| Method | Endpoint | Description |
|---|---|---|
| POST | `/water` | Log water intake |
| GET | `/water/today` | Get today's water vs goal |

### Routines
| Method | Endpoint | Description |
|---|---|---|
| POST | `/routines` | Create routine with steps |
| GET | `/routines` | List routines |
| GET | `/routines/{id}` | Get single routine |

### Gamification
| Method | Endpoint | Description |
|---|---|---|
| GET | `/badges` | List unlocked badges |
| GET | `/dashboard` | Full dashboard data |

### Social
| Method | Endpoint | Description |
|---|---|---|
| GET | `/leaderboard` | Global leaderboard |
| GET | `/friends` | List friends |
| POST | `/friends/{id}/request` | Send friend request |
| POST | `/friends/{id}/accept` | Accept friend request |
| GET | `/friends/activity` | Friends activity feed |

### Chat
| Method | Endpoint | Description |
|---|---|---|
| GET | `/chat/{user_id}` | Get message history |
| POST | `/chat/{user_id}` | Send message (REST) |
| WS | `/chat/ws/{token}` | Real-time WebSocket chat |

### Workout Plans
| Method | Endpoint | Description |
|---|---|---|
| POST | `/workout-plans` | Create workout plan |
| GET | `/workout-plans` | List workout plans |

## Deployment (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your repo
4. Use the `render.yaml` blueprint (or manually configure):
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add a **PostgreSQL** database in Render
6. Set environment variables:
   - `DATABASE_URL` — from Render PostgreSQL (change `postgresql://` to `postgresql+asyncpg://`)
   - `SECRET_KEY` — generate a secure random string

## WebSocket Chat Usage

```javascript
// Connect with JWT token
const ws = new WebSocket('wss://your-api.onrender.com/chat/ws/YOUR_JWT_TOKEN');

// Send a message
ws.send(JSON.stringify({
  receiver_id: "target-user-uuid",
  content: "Hello!"
}));

// Receive messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

## Project Structure

```
app/
├── main.py              # App entry point
├── config.py            # Settings
├── database.py          # DB engine/session
├── dependencies.py      # Auth dependency
├── utils.py             # Helpers
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic schemas
├── services/            # Business logic
└── routers/             # API endpoints
```

## License

MIT

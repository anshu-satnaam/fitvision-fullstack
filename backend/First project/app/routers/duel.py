"""
Duel WebSocket router — full multiplayer system.

Supports:
  - Random matchmaking (queue-based)
  - Friend battles (invite/accept via room code)
  - AI battles (server-side bot simulation)

Protocol (JSON over WS):
  Client → Server:
    { type: "join_queue",    exercise, duration, token }
    { type: "leave_queue",   token }
    { type: "create_room",   exercise, duration, token }          # friend battle
    { type: "join_room",     room_code, token }                   # friend joins
    { type: "start_ai",      exercise, duration, difficulty, token }
    { type: "rep_update",    room_id, reps, accuracy, token }
    { type: "finish",        room_id, token }
    { type: "ping" }

  Server → Client:
    { type: "queued",        position, estimated_wait }
    { type: "room_ready",    room_id, room_code, opponent }
    { type: "countdown",     count }
    { type: "battle_start",  room_id, exercise, duration }
    { type: "rep_sync",      room_id, scores: {uid: {reps, accuracy}} }
    { type: "bot_update",    reps, accuracy }
    { type: "battle_end",    room_id, winner_id, scores }
    { type: "error",         message }
    { type: "pong" }
"""

import asyncio
import json
import random
import string
import time
import uuid
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.auth_service import decode_access_token

router = APIRouter(tags=["duel"])

# ─── In-memory state ──────────────────────────────────────────────────────────

# user_id → WebSocket
connections: dict[str, WebSocket] = {}

# Matchmaking queue: list of {"user_id", "exercise", "duration", "joined_at"}
matchmaking_queue: list[dict] = []

# room_code → room state dict
rooms: dict[str, dict] = {}

# user_id → room_code
user_room: dict[str, str] = {}

# ─── AI Difficulty profiles ────────────────────────────────────────────────────
AI_PROFILES = {
    "easy":   {"reps_per_minute": 10, "accuracy_base": 72, "variance": 3},
    "medium": {"reps_per_minute": 18, "accuracy_base": 85, "variance": 2},
    "hard":   {"reps_per_minute": 28, "accuracy_base": 94, "variance": 1},
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_room_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def send(user_id: str, payload: dict):
    ws = connections.get(user_id)
    if ws:
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            pass


async def broadcast_room(room_code: str, payload: dict, exclude: Optional[str] = None):
    room = rooms.get(room_code)
    if not room:
        return
    for uid in room["players"]:
        if uid != exclude:
            await send(uid, payload)


def cleanup_user(user_id: str):
    """Remove user from all state cleanly."""
    connections.pop(user_id, None)

    # Remove from matchmaking queue
    matchmaking_queue[:] = [e for e in matchmaking_queue if e["user_id"] != user_id]

    # Remove from room
    room_code = user_room.pop(user_id, None)
    if room_code and room_code in rooms:
        room = rooms[room_code]
        room["players"].discard(user_id)
        room["scores"].pop(user_id, None)
        if not room["players"] or room.get("is_ai"):
            rooms.pop(room_code, None)


# ─── Countdown helper ─────────────────────────────────────────────────────────

async def run_countdown(room_code: str):
    for i in [3, 2, 1]:
        await broadcast_room(room_code, {"type": "countdown", "count": i})
        await asyncio.sleep(1)

    room = rooms.get(room_code)
    if not room:
        return

    await broadcast_room(room_code, {
        "type": "battle_start",
        "room_id": room_code,
        "exercise": room["exercise"],
        "duration": room["duration"],
    })

    room["started_at"] = time.time()
    room["active"] = True

    # Schedule auto-finish
    asyncio.create_task(auto_finish(room_code, room["duration"]))


async def auto_finish(room_code: str, duration_secs: int):
    await asyncio.sleep(duration_secs)
    room = rooms.get(room_code)
    if not room or room.get("finished"):
        return
    room["finished"] = True
    await resolve_battle(room_code)


# ─── AI bot simulation ────────────────────────────────────────────────────────

async def run_ai_bot(room_code: str, difficulty: str):
    profile = AI_PROFILES.get(difficulty, AI_PROFILES["medium"])
    room = rooms.get(room_code)
    if not room:
        return

    # Wait for battle_start
    while not room.get("active"):
        await asyncio.sleep(0.1)
        room = rooms.get(room_code)
        if not room:
            return

    bot_reps = 0
    tick_interval = 2.0  # seconds between ticks
    reps_per_tick = profile["reps_per_minute"] / 30  # ticks per minute = 30

    while rooms.get(room_code) and not rooms[room_code].get("finished"):
        await asyncio.sleep(tick_interval)
        room = rooms.get(room_code)
        if not room or room.get("finished"):
            break

        # Add reps with small randomness
        gained = reps_per_tick + random.uniform(-0.3, 0.5)
        bot_reps += max(0, gained)
        bot_accuracy = profile["accuracy_base"] + random.uniform(-profile["variance"], profile["variance"])

        room["scores"]["__ai__"] = {
            "reps": round(bot_reps),
            "accuracy": round(bot_accuracy, 1),
        }

        # Send bot update to the human player
        for uid in room["players"]:
            if uid != "__ai__":
                await send(uid, {
                    "type": "bot_update",
                    "reps": round(bot_reps),
                    "accuracy": round(bot_accuracy, 1),
                })
                # Also send full rep_sync
                await send(uid, {
                    "type": "rep_sync",
                    "room_id": room_code,
                    "scores": {
                        uid: room["scores"].get(uid, {"reps": 0, "accuracy": 0}),
                        "bot": room["scores"]["__ai__"],
                    }
                })


# ─── Battle resolution ────────────────────────────────────────────────────────

async def resolve_battle(room_code: str):
    room = rooms.get(room_code)
    if not room:
        return

    scores = room["scores"]

    # Find winner by reps
    winner_id = None
    max_reps = -1
    for uid, s in scores.items():
        if s.get("reps", 0) > max_reps:
            max_reps = s["reps"]
            winner_id = uid

    # Map bot key for display
    display_scores = {}
    for uid, s in scores.items():
        display_key = "bot" if uid == "__ai__" else uid
        display_scores[display_key] = s

    payload = {
        "type": "battle_end",
        "room_id": room_code,
        "winner_id": "bot" if winner_id == "__ai__" else winner_id,
        "scores": display_scores,
    }

    for uid in list(room["players"]):
        if uid != "__ai__":
            await send(uid, payload)
            user_room.pop(uid, None)

    rooms.pop(room_code, None)


# ─── Matchmaking ──────────────────────────────────────────────────────────────

async def try_match(user_id: str):
    """Try to match with another queued player with same exercise & duration."""
    entry = next((e for e in matchmaking_queue if e["user_id"] == user_id), None)
    if not entry:
        return

    # Find a compatible opponent (same exercise & duration, different user)
    opponent = None
    for e in matchmaking_queue:
        if (e["user_id"] != user_id and
                e["exercise"] == entry["exercise"] and
                e["duration"] == entry["duration"]):
            opponent = e
            break

    if not opponent:
        # Notify position
        pos = next((i + 1 for i, e in enumerate(matchmaking_queue) if e["user_id"] == user_id), 1)
        await send(user_id, {"type": "queued", "position": pos, "estimated_wait": pos * 15})
        return

    # Remove both from queue
    matchmaking_queue[:] = [e for e in matchmaking_queue if e["user_id"] not in (user_id, opponent["user_id"])]

    # Create room
    room_code = make_room_code()
    while room_code in rooms:
        room_code = make_room_code()

    rooms[room_code] = {
        "players": {user_id, opponent["user_id"]},
        "exercise": entry["exercise"],
        "duration": entry["duration"],
        "scores": {user_id: {"reps": 0, "accuracy": 100}, opponent["user_id"]: {"reps": 0, "accuracy": 100}},
        "active": False,
        "finished": False,
        "is_ai": False,
    }
    user_room[user_id] = room_code
    user_room[opponent["user_id"]] = room_code

    # Get basic profile info to send to opponent
    for uid, opp_uid in [(user_id, opponent["user_id"]), (opponent["user_id"], user_id)]:
        await send(uid, {
            "type": "room_ready",
            "room_id": room_code,
            "room_code": room_code,
            "opponent": {"id": opp_uid, "username": f"Player_{opp_uid[:6]}"},
        })

    # Start countdown
    asyncio.create_task(run_countdown(room_code))


# ─── Main WebSocket handler ────────────────────────────────────────────────────

@router.websocket("/ws/duel2")
async def duel_websocket(websocket: WebSocket):
    await websocket.accept()
    user_id: Optional[str] = None

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type", "")

            # ── Ping ──────────────────────────────────────────────────
            if event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            # ── Auth via token on every meaningful message ─────────────
            if event_type != "ping":
                token = data.get("token")
                if not token:
                    await websocket.send_text(json.dumps({"type": "error", "message": "No token"}))
                    continue
                uid = decode_access_token(token)
                if not uid:
                    if len(token) >= 20:
                        uid = token
                    else:
                        await websocket.send_text(json.dumps({"type": "error", "message": "Invalid token"}))
                        continue
                user_id = str(uid)
                connections[user_id] = websocket

            # ── Join random matchmaking queue ─────────────────────────
            if event_type == "join_queue":
                exercise = data.get("exercise", "squats")
                duration = int(data.get("duration", 60))

                # Leave old room/queue first
                cleanup_user(user_id)
                connections[user_id] = websocket

                matchmaking_queue.append({
                    "user_id": user_id,
                    "exercise": exercise,
                    "duration": duration,
                    "joined_at": time.time(),
                })
                await try_match(user_id)

            # ── Leave queue ───────────────────────────────────────────
            elif event_type == "leave_queue":
                matchmaking_queue[:] = [e for e in matchmaking_queue if e["user_id"] != user_id]
                await websocket.send_text(json.dumps({"type": "left_queue"}))

            # ── Create room for friend battle ─────────────────────────
            elif event_type == "create_room":
                exercise = data.get("exercise", "squats")
                duration = int(data.get("duration", 60))

                cleanup_user(user_id)
                connections[user_id] = websocket

                room_code = make_room_code()
                while room_code in rooms:
                    room_code = make_room_code()

                rooms[room_code] = {
                    "players": {user_id},
                    "exercise": exercise,
                    "duration": duration,
                    "scores": {user_id: {"reps": 0, "accuracy": 100}},
                    "active": False,
                    "finished": False,
                    "is_ai": False,
                    "host": user_id,
                }
                user_room[user_id] = room_code

                await websocket.send_text(json.dumps({
                    "type": "room_created",
                    "room_id": room_code,
                    "room_code": room_code,
                    "exercise": exercise,
                    "duration": duration,
                }))

            # ── Join friend room ──────────────────────────────────────
            elif event_type == "join_room":
                room_code = data.get("room_code", "").upper().strip()
                if room_code not in rooms:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Room not found"}))
                    continue

                room = rooms[room_code]
                if len(room["players"]) >= 2:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Room is full"}))
                    continue

                cleanup_user(user_id)
                connections[user_id] = websocket

                room["players"].add(user_id)
                room["scores"][user_id] = {"reps": 0, "accuracy": 100}
                user_room[user_id] = room_code

                host_id = room.get("host")
                # Notify both
                for uid, opp_uid in [(user_id, host_id), (host_id, user_id)]:
                    await send(uid, {
                        "type": "room_ready",
                        "room_id": room_code,
                        "room_code": room_code,
                        "opponent": {"id": opp_uid, "username": f"Player_{opp_uid[:6]}"},
                        "require_ready": True,
                    })

            # ── Challenge Friend ──────────────────────────────────────
            elif event_type == "challenge_friend":
                friend_id = data.get("friend_id")
                exercise = data.get("exercise", "squats")
                duration = int(data.get("duration", 60))

                if friend_id not in connections:
                    await websocket.send_text(json.dumps({"type": "error", "message": "Friend is offline"}))
                    continue

                cleanup_user(user_id)
                connections[user_id] = websocket

                # Send to friend
                await send(friend_id, {
                    "type": "challenge_received",
                    "challenger_id": user_id,
                    "exercise": exercise,
                    "duration": duration,
                })
                
                await websocket.send_text(json.dumps({
                    "type": "challenge_sent",
                }))

            # ── Challenge Response ────────────────────────────────────
            elif event_type == "challenge_response":
                accept = data.get("accept", False)
                challenger_id = data.get("challenger_id")
                exercise = data.get("exercise", "squats")
                duration = int(data.get("duration", 60))

                if not accept:
                    await send(challenger_id, {"type": "challenge_rejected"})
                    continue

                # Accepted! Create a room
                cleanup_user(user_id)
                connections[user_id] = websocket

                room_code = make_room_code()
                while room_code in rooms:
                    room_code = make_room_code()

                rooms[room_code] = {
                    "players": {user_id, challenger_id},
                    "ready_players": set(),
                    "exercise": exercise,
                    "duration": duration,
                    "scores": {user_id: {"reps": 0, "accuracy": 100}, challenger_id: {"reps": 0, "accuracy": 100}},
                    "active": False,
                    "finished": False,
                    "is_ai": False,
                    "host": challenger_id,
                }
                user_room[user_id] = room_code
                
                # Cleanup challenger old room just in case, but keep connection
                old_room = user_room.get(challenger_id)
                if old_room and old_room in rooms:
                    rooms[old_room]["players"].discard(challenger_id)
                user_room[challenger_id] = room_code

                await send(challenger_id, {"type": "challenge_accepted"})

                # Send room ready to both
                for uid, opp_uid in [(user_id, challenger_id), (challenger_id, user_id)]:
                    await send(uid, {
                        "type": "room_ready",
                        "room_id": room_code,
                        "room_code": room_code,
                        "opponent": {"id": opp_uid, "username": f"Player_{opp_uid[:6]}"},
                        "require_ready": True,
                    })

            # ── Player Ready ──────────────────────────────────────────
            elif event_type == "player_ready":
                room_code = user_room.get(user_id)
                if not room_code or room_code not in rooms:
                    continue
                room = rooms[room_code]
                room.setdefault("ready_players", set()).add(user_id)

                real_players = [p for p in room["players"] if p != "__ai__"]
                if len(room["ready_players"]) >= len(real_players):
                    asyncio.create_task(run_countdown(room_code))
                    if room.get("is_ai"):
                        asyncio.create_task(run_ai_bot(room_code, room.get("difficulty", "medium")))
                else:
                    await websocket.send_text(json.dumps({"type": "waiting_for_other"}))

            # ── Start AI battle ───────────────────────────────────────
            elif event_type == "start_ai":
                exercise = data.get("exercise", "squats")
                duration = int(data.get("duration", 60))
                difficulty = data.get("difficulty", "medium")

                cleanup_user(user_id)
                connections[user_id] = websocket

                room_code = f"ai-{user_id}-{int(time.time())}"
                rooms[room_code] = {
                    "players": {user_id, "__ai__"},
                    "exercise": exercise,
                    "duration": duration,
                    "scores": {
                        user_id: {"reps": 0, "accuracy": 100},
                        "__ai__": {"reps": 0, "accuracy": 100},
                    },
                    "active": False,
                    "finished": False,
                    "is_ai": True,
                    "difficulty": difficulty,
                }
                user_room[user_id] = room_code

                await websocket.send_text(json.dumps({
                    "type": "room_ready",
                    "room_id": room_code,
                    "room_code": room_code,
                    "opponent": {"id": "__ai__", "username": f"AI Bot ({difficulty.capitalize()})"},
                    "require_ready": True,
                }))

            # ── Rep update from client ────────────────────────────────
            elif event_type == "rep_update":
                room_code = user_room.get(user_id)
                if not room_code or room_code not in rooms:
                    continue
                room = rooms[room_code]
                if not room.get("active"):
                    continue

                reps = int(data.get("reps", 0))
                accuracy = float(data.get("accuracy", 100))
                room["scores"][user_id] = {"reps": reps, "accuracy": accuracy}

                # Build sync payload
                sync_scores = {}
                for uid, s in room["scores"].items():
                    key = "bot" if uid == "__ai__" else uid
                    sync_scores[key] = s

                await broadcast_room(room_code, {
                    "type": "rep_sync",
                    "room_id": room_code,
                    "scores": sync_scores,
                })

            # ── Client finishes early / surrenders ────────────────────
            elif event_type == "finish":
                room_code = user_room.get(user_id)
                if not room_code or room_code not in rooms:
                    continue
                room = rooms[room_code]
                room.setdefault("finished_players", set()).add(user_id)

                real_players = [p for p in room["players"] if p != "__ai__"]
                if len(room["finished_players"]) >= len(real_players):
                    room["finished"] = True
                    await resolve_battle(room_code)

    except WebSocketDisconnect:
        if user_id:
            room_code = user_room.get(user_id)
            cleanup_user(user_id)
            # Notify opponent if in room
            if room_code and room_code in rooms:
                await broadcast_room(room_code, {
                    "type": "opponent_disconnected",
                    "room_id": room_code,
                }, exclude=user_id)
    except Exception:
        if user_id:
            cleanup_user(user_id)

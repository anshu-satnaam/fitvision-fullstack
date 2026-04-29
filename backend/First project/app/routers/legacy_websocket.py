"""
Legacy WebSocket router ported from FitVision Lite.
Handles real-time duel syncing.
"""

import json
import time
import uuid
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.auth_service import decode_access_token

router = APIRouter(tags=["legacy-duel"])

active_users: dict[str, WebSocket] = {}
rooms = defaultdict(dict)

async def ws_send(user_id: str, payload: dict):
    ws = active_users.get(user_id)
    if ws:
        await ws.send_text(json.dumps(payload))

@router.websocket("/ws/duel")
async def duel_socket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return
        
    user_uuid = decode_access_token(token)
    if not user_uuid:
        await websocket.close(code=1008)
        return

    user_id = str(user_uuid)
    await websocket.accept()
    active_users[user_id] = websocket

    try:
        while True:
            data = json.loads(await websocket.receive_text())
            event_type = data.get("type")

            if event_type == "invite":
                to_user = str(data["to_user_id"])
                await ws_send(to_user, {"type": "invited", "from_user_id": user_id})

            elif event_type == "accept_invite":
                from_user = str(data["from_user_id"])
                room_id = f"room-{uuid.uuid4()}-{int(time.time())}"
                rooms[room_id] = {
                    "players": [user_id, from_user],
                    "reps": {user_id: 0, from_user: 0},
                    "finished": set(),
                }
                payload = {
                    "type": "duel_started",
                    "room_id": room_id,
                    "players": [user_id, from_user],
                }
                await ws_send(user_id, payload)
                await ws_send(from_user, payload)

            elif event_type == "rep_update":
                room_id = data.get("room_id")
                reps = int(data.get("reps", 0))
                room = rooms.get(room_id)
                if room and user_id in room["reps"]:
                    room["reps"][user_id] = reps
                    for pid in room["players"]:
                        await ws_send(
                            pid,
                            {
                                "type": "rep_sync",
                                "room_id": room_id,
                                "reps": room["reps"],
                            },
                        )

            elif event_type == "finish":
                room_id = data.get("room_id")
                room = rooms.get(room_id)
                if not room:
                    continue
                room["finished"].add(user_id)
                if len(room["finished"]) == 2:
                    p1, p2 = room["players"]
                    r1 = room["reps"].get(p1, 0)
                    r2 = room["reps"].get(p2, 0)
                    winner = p1 if r1 > r2 else p2 if r2 > r1 else None
                    for pid in room["players"]:
                        await ws_send(
                            pid,
                            {
                                "type": "duel_result",
                                "room_id": room_id,
                                "winner": winner,
                                "reps": room["reps"],
                            },
                        )
                    rooms.pop(room_id, None)

    except WebSocketDisconnect:
        active_users.pop(user_id, None)

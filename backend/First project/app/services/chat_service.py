"""
Chat service — WebSocket connection manager for real-time messaging.
"""

from fastapi import WebSocket
from beanie import PydanticObjectId

from app.models.social import ChatMessage


class ConnectionManager:
    """
    Manages active WebSocket connections per user.
    Supports multiple connections per user (e.g., multiple tabs/devices).
    """

    def __init__(self):
        # user_id (str) -> list of active WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection and register it."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                conn for conn in self.active_connections[user_id] if conn != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_online(self, user_id: str) -> bool:
        """Check if a user has any active WebSocket connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_user_ids(self) -> set[str]:
        """Return the set of all currently online user IDs (strings)."""
        return set(self.active_connections.keys())

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to all connections of a specific user."""
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            # Clean up dead connections
            for conn in dead_connections:
                self.disconnect(conn, user_id)

    async def broadcast(self, message: dict):
        """Send a message to all connected users."""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)


async def save_chat_message(
    sender_id: PydanticObjectId,
    receiver_id: PydanticObjectId,
    content: str,
) -> ChatMessage:
    """Persist a chat message to the database."""
    message = ChatMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
    )
    await message.insert()
    return message


# Global connection manager instance
manager = ConnectionManager()

"""
WebSocket router for the AI Chatbot.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from beanie import PydanticObjectId

from app.services.auth_service import decode_access_token
from app.models.user import User

from app.chatbot.service import stream_qwen_response

router = APIRouter(prefix="/chatbot", tags=["AI Chatbot"])

@router.websocket("/ws/{token}")
async def chatbot_websocket(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time streaming chat with Qwen AI.
    """
    user_id_str = decode_access_token(token)
    if user_id_str is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    try:
        user_id = PydanticObjectId(user_id_str)
    except Exception:
        await websocket.close(code=4001, reason="Invalid token format")
        return

    # Look up the user profile for personalized context
    user = await User.get(user_id)

    if not user:
        await websocket.close(code=4001, reason="User not found")
        return

    await websocket.accept()

    try:
        while True:
            # Wait for user message
            data = await websocket.receive_json()
            user_message = data.get("content", "").strip()

            if not user_message:
                await websocket.send_json({"type": "error", "content": "Message cannot be empty."})
                continue

            # Acknowledge receipt and signal that AI is typing
            await websocket.send_json({"type": "status", "content": "typing"})

            # Stream the AI response back to the client
            # We send chunks with a specific "stream" type
            async for chunk in stream_qwen_response(user_message, user):
                await websocket.send_json({
                    "type": "stream_chunk",
                    "content": chunk
                })
            
            # Send an "end" signal when the stream finishes
            await websocket.send_json({"type": "stream_end"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Chatbot WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": "Internal server error."})
        except:
            pass

"""
Chat routes — REST endpoints + WebSocket for real-time messaging.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from beanie import PydanticObjectId
from beanie.operators import Or, And

from app.dependencies import get_current_user
from app.models.user import User
from app.models.social import ChatMessage
from app.schemas.social import ChatMessageCreate, ChatMessageResponse
from app.services.auth_service import decode_access_token
from app.services.chat_service import manager, save_chat_message

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/{user_id}", response_model=list[ChatMessageResponse])
async def get_chat_history(
    user_id: PydanticObjectId,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """Get chat message history between the current user and another user."""
    offset = (page - 1) * size

    messages = await ChatMessage.find(
        Or(
            And(
                ChatMessage.sender_id == current_user.id,
                ChatMessage.receiver_id == user_id,
            ),
            And(
                ChatMessage.sender_id == user_id,
                ChatMessage.receiver_id == current_user.id,
            ),
        )
    ).sort(-ChatMessage.timestamp).skip(offset).limit(size).to_list()

    # Mark received messages as read
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
            await msg.save()

    return [ChatMessageResponse.model_validate(m) for m in reversed(messages)]


@router.post("/{user_id}", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    user_id: PydanticObjectId,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
):
    """Send a message to another user (REST fallback)."""
    # Check target user exists
    target_user = await User.get(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    message = await save_chat_message(current_user.id, user_id, data.content)

    # If the receiver is online via WebSocket, push the message
    msg_data = {
        "type": "new_message",
        "id": str(message.id),
        "sender_id": str(current_user.id),
        "receiver_id": str(user_id),
        "content": data.content,
        "timestamp": message.timestamp.isoformat(),
    }
    await manager.send_personal_message(msg_data, str(user_id))

    return ChatMessageResponse.model_validate(message)


@router.websocket("/ws/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time chat.
    Connect with: ws://host/chat/ws/{jwt_token}
    
    Message format (send):
        { "receiver_id": "<uuid>", "content": "Hello!" }
    
    Message format (receive):
        { "type": "new_message", "id": "...", "sender_id": "...", 
          "receiver_id": "...", "content": "...", "timestamp": "..." }
    """
    # Authenticate via JWT token in the URL
    user_id_str = decode_access_token(token)
    if user_id_str is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, user_id_str)

    try:
        user_id = PydanticObjectId(user_id_str)
        while True:
            data = await websocket.receive_json()

            receiver_id_str = data.get("receiver_id")
            content = data.get("content", "").strip()

            if not receiver_id_str or not content:
                await websocket.send_json({"error": "receiver_id and content are required"})
                continue

            try:
                receiver_id = PydanticObjectId(receiver_id_str)
            except Exception:
                await websocket.send_json({"error": "Invalid receiver_id format"})
                continue

            message = await save_chat_message(user_id, receiver_id, content)

            msg_data = {
                "type": "new_message",
                "id": str(message.id),
                "sender_id": str(user_id),
                "receiver_id": str(receiver_id),
                "content": content,
                "timestamp": message.timestamp.isoformat(),
            }

            # Send to receiver
            await manager.send_personal_message(msg_data, receiver_id_str)

            # Echo back to sender for confirmation
            await websocket.send_json(msg_data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id_str)

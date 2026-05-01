"""
Legacy Chatbot router ported from FitVision Lite.
"""

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.config import get_settings
from app.models.user import User
from app.models.workout import Workout

router = APIRouter(tags=["legacy-chatbot"])
last_reply_by_user: dict[str, str] = {}

class ChatMessageRequest(BaseModel):
    message: str
    session_reps: int   = None
    current_exercise: str   = None

SYSTEM_PROMPT = """
You are FitVision AI Voice Coach, an energetic, motivating, and highly supportive fitness trainer!

Rules:
- Be incredibly motivating, positive, and enthusiastic.
- Address the user's questions clearly but keep it conversational.
- Keep your answers concise enough to be spoken aloud easily (around 1-3 sentences).
- Give actionable and clear fitness or diet advice.
- No JSON, no formatting, no long explanations.
""".strip()

def is_typed_like_input(text: str):
    lowered = text.lower()
    markers = ["{", "}", "[", "]", "http://", "https://", "=>", "::", "127.0.0.1", ".js", ".py"]
    if any(m in lowered for m in markers):
        return True
    return "_" in lowered and " " not in lowered

def enforce_voice_output(reply: str):
    cleaned = " ".join((reply or "").replace("\\n", " ").strip().split())
    if not cleaned:
        return "Keep going, you're doing great!"
    return cleaned

def ensure_not_repeated(reply: str, previous_reply: str  , question: str):
    if not previous_reply:
        return reply
    if reply != previous_reply:
        return reply
    lowered = question.lower()
    if "squat" in lowered:
        return "Brace core, knees aligned, descend slowly."
    if "pushup" in lowered or "push-up" in lowered:
        return "Tighten core, elbows tucked, lower under control."
    if "pain" in lowered or "hurt" in lowered:
        return "Stop now, reduce load, reset neutral spine."
    if "next" in lowered:
        return "Do ten controlled reps with steady breathing."
    return "Repeat that clearly"

def fallback_coach_response(question: str):
    lowered = question.lower()
    if "squat" in lowered:
        return "Stop and keep your spine neutral."
    if "pushup" in lowered or "push-up" in lowered:
        return "Brace core, keep straight line, lower slowly."
    if "tired" in lowered or "exhausted" in lowered:
        return "Slow pace, breathe deep, keep clean form."
    if "what next" in lowered or "next" in lowered:
        return "Do ten squats now, chest up."
    if "pain" in lowered or "hurt" in lowered:
        return "Stop now and keep your spine neutral."
    return "Repeat that clearly"

async def llm_reply(prompt: str, previous_reply: str  ):
    settings = get_settings()
    api_key = settings.QWEN_API_KEY

    user_prompt = prompt
    if previous_reply:
        user_prompt = f"{prompt}\n\nPrevious assistant response (do not repeat): {previous_reply}"

    if not api_key or api_key == "your-qwen-api-key-here":
        return None

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "FitVision Lite",
    }
    body = {
        "model": "qwen/qwen-2.5-72b-instruct",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            res = await client.post(url, headers=headers, json=body)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"]
            return None
    except Exception:
        return None

def build_context_prompt(payload: ChatMessageRequest, user: User, workouts: list):
    recent_workouts = ", ".join([f"{w.exercise}:{w.reps}" for w in workouts[:5]]) or "none"
    age = user.age or "unknown"
    height = user.height_cm or "unknown"
    weight = user.weight_kg or "unknown"
    total_reps = user.points or 0
    return (
        f"User profile -> age:{age}, height:{height}, weight:{weight}, "
        f"total_reps:{total_reps}. "
        f"Recent workouts: {recent_workouts}. "
        f"Current session -> reps:{payload.session_reps}, exercise:{payload.current_exercise}. "
        f"Question: {payload.message}"
    )

async def safe_recent_workouts(user_id):
    try:
        return await Workout.find(
            Workout.user_id == user_id
        ).sort(-Workout.created_at).limit(5).to_list()
    except Exception:
        return []

@router.post("/chatbot/message")
async def message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
):
    question = (payload.message or "").strip()
    if not question:
        return {
            "reply": "I'm here! What do you need help with?",
            "user": current_user.username,
        }
    if is_typed_like_input(question):
        return {"reply": "Let's focus on fitness! How can I help you train today?", "user": current_user.username}

    workouts = await safe_recent_workouts(current_user.id)
    prompt = build_context_prompt(payload, current_user, workouts)

    user_id_str = str(current_user.id)
    previous_reply = last_reply_by_user.get(user_id_str)

    try:
        reply = await llm_reply(prompt, previous_reply)
    except Exception:
        reply = None

    if not reply:
        reply = fallback_coach_response(question)
    reply = ensure_not_repeated(reply, previous_reply, question)
    reply = enforce_voice_output(reply)
    last_reply_by_user[user_id_str] = reply

    return {
        "reply": reply,
        "user": current_user.username,
    }

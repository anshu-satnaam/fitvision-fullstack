"""
AI Posture Feedback router ported from FitVision Lite.
"""

import os
import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])

class PostureFeedbackRequest(BaseModel):
    exercise: str
    avg_angle: float
    reps: int
    stability: float

def rule_based_posture_feedback(payload: PostureFeedbackRequest):
    cues = []
    exercise = payload.exercise.lower()
    if exercise == "squat":
        if payload.avg_angle > 120:
            cues.append("Go lower on each rep to reach depth.")
        if payload.stability < 0.65:
            cues.append("Slow down and keep your knees stable.")
    if exercise == "pushup":
        if payload.avg_angle > 110:
            cues.append("Lower your chest more on each rep.")
        if payload.stability < 0.65:
            cues.append("Keep core tight to avoid body sway.")
    if not cues:
        cues.append("Good session. Keep your tempo consistent and controlled.")
    return " ".join(cues[:2])

async def llm_posture_feedback(prompt: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": "You are a posture coach. Return 2 concise improvement tips.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"]
    except Exception:
        return None
    return None

@router.post("/posture-feedback")
async def posture_feedback(
    payload: PostureFeedbackRequest, current_user: User = Depends(get_current_user)
):
    age = current_user.age or "unknown"
    weight = current_user.weight_kg or "unknown"
    
    prompt = (
        f"User age={age}, weight={weight}. "
        f"Exercise={payload.exercise}, avg_angle={payload.avg_angle}, "
        f"reps={payload.reps}, stability={payload.stability}. "
        "Give concise personalized feedback."
    )
    reply = await llm_posture_feedback(prompt)
    if not reply:
        reply = rule_based_posture_feedback(payload)
    return {"feedback": reply}

"""
AI Chat Service using Qwen API via DashScope.
"""

from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.config import get_settings
from app.models.user import User

settings = get_settings()

# Initialize the OpenAI client with OpenRouter's compatible endpoint
client = AsyncOpenAI(
    api_key=settings.QWEN_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "FitVision"
    }
)

async def stream_qwen_response(user_message: str, user: User) -> AsyncGenerator[str, None]:
    """
    Streams a response from Qwen via OpenRouter, personalized with the user's fitness profile.
    """
    system_prompt = f"""You are a World-Class Personal Trainer and Nutritionist.
Your goal is to provide highly personalized fitness, health, and diet advice.
If the user asks about topics completely unrelated to health or fitness, politely refuse to answer.

USER PROFILE:
- Name: {user.username}
- Age: {user.age or 'Unknown'}
- Weight: {user.weight_kg or 'Unknown'} kg
- Height: {user.height_cm or 'Unknown'} cm
- Fitness Goal: {user.diet_goal or 'General fitness'}
- Body Type: {user.body_type or 'Average'}
- Current Injuries: {user.injuries or 'None reported'}

Always keep their injuries in mind and never suggest exercises that could aggravate them.
Be concise, encouraging, and highly professional.
"""

    try:
        response_stream = await client.chat.completions.create(
            model="qwen/qwen-2.5-72b-instruct", # OpenRouter Qwen model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=True,
        )

        async for chunk in response_stream:
            if chunk.choices and chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content

    except Exception as e:
        print(f"LLM API Error: {e}")
        # Seamless rule-based fallback
        yield "Keep pushing! Maintain your form and breathe steadily. You've got this!"

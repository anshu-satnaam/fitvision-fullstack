"""
Dashboard service — aggregates data from multiple tables for the dashboard endpoint.
"""

from datetime import datetime, timedelta, timezone

from app.models.user import User
from app.models.workout import Workout, WorkoutLog
from app.models.water import WaterLog
from app.schemas.dashboard import (
    DashboardResponse,
    AIPulse,
    AIPulseExercise,
    StatsSummary,
    WaterSummary,
    DietPlan,
)


async def get_dashboard_data(user: User) -> DashboardResponse:
    """Build the full dashboard response for a user."""
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    
    # ── Greeting ──────────────────────────────────────────────
    hour = now.hour
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 17:
        time_greeting = "Good afternoon"
    else:
        time_greeting = "Good evening"
    greeting = f"{time_greeting}, {user.username}!"

    # ── Weekly Progress (last 7 days, Mon–Sun) ────────────────
    # Find the start of the current week (Monday)
    days_since_monday = today_start.weekday()  # 0=Mon, 6=Sun
    week_start = today_start - timedelta(days=days_since_monday)

    weekly_progress: list[bool] = []
    for i in range(7):
        day_start = week_start + timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        # Check AI workouts
        ai_count = await Workout.find(
            Workout.user_id == user.id,
            Workout.created_at >= day_start,
            Workout.created_at < day_end
        ).count()
        
        # Check manual workouts
        manual_count = await WorkoutLog.find(
            WorkoutLog.user_id == user.id,
            WorkoutLog.created_at >= day_start,
            WorkoutLog.created_at < day_end
        ).count()
        
        has_activity = (ai_count + manual_count) > 0
        weekly_progress.append(has_activity)

    # ── Stats Summary ─────────────────────────────────────────
    # We will fetch all and sum in python for simplicity
    ai_workouts = await Workout.find(Workout.user_id == user.id).to_list()
    manual_workouts = await WorkoutLog.find(WorkoutLog.user_id == user.id).to_list()
    
    ai_count = len(ai_workouts)
    manual_count = len(manual_workouts)
    
    total_workouts = ai_count + manual_count
    total_duration = sum(w.duration_seconds or 0 for w in ai_workouts) + sum(w.duration_seconds or 0 for w in manual_workouts)
    total_calories = sum(float(w.calories or 0) for w in ai_workouts) + sum(float(w.calories_burned or 0) for w in manual_workouts)
    total_reps = sum(w.reps for w in ai_workouts) + sum((w.reps * getattr(w, 'sets', 1)) for w in manual_workouts)
    
    ai_posture_total = sum(w.posture_score or 0 for w in ai_workouts if w.posture_score)
    ai_posture_count = sum(1 for w in ai_workouts if w.posture_score)
    avg_posture = (ai_posture_total / ai_posture_count) if ai_posture_count > 0 else None

    stats = StatsSummary(
        total_workouts=total_workouts,
        total_duration_minutes=total_duration // 60,
        total_calories=total_calories,
        avg_posture_score=avg_posture,
        total_reps=total_reps,
    )

    # ── Water Summary ─────────────────────────────────────────
    today_end = today_start + timedelta(days=1)
    water_logs = await WaterLog.find(
        WaterLog.user_id == user.id,
        WaterLog.logged_at >= today_start,
        WaterLog.logged_at < today_end
    ).to_list()
    
    current_water = sum(w.amount_ml for w in water_logs)
    water = WaterSummary(
        current=current_water,
        goal=user.daily_water_goal or 2000,
    )

    # ── AI Pulse (rule-based suggestion) ──────────────────────
    # Suggest a simple workout based on user's activity level
    ai_pulse = AIPulse(
        title="Today's Suggested Workout",
        exercises=[
            AIPulseExercise(name="Push-ups", reps=15, sets=3),
            AIPulseExercise(name="Squats", reps=20, sets=3),
            AIPulseExercise(name="Plank", duration_seconds=60),
            AIPulseExercise(name="Lunges", reps=12, sets=3),
        ],
        total_duration_minutes=25,
        estimated_calories=200,
    )

    # ── Diet Plan (placeholder — user can populate via profile) ──
    diet_plan = DietPlan(
        pre_workout="Banana + peanut butter toast",
        post_workout="Protein shake + mixed nuts",
        analysis="Maintain a balanced intake of proteins and carbs",
        management_suggestion="Stay hydrated and eat within 30 min post-workout",
    )

    return DashboardResponse(
        greeting=greeting,
        streak=user.streak,
        weekly_progress=weekly_progress,
        ai_pulse=ai_pulse,
        stats=stats,
        water=water,
        diet_plan=diet_plan,
    )

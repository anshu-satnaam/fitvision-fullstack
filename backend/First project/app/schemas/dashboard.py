"""
Dashboard schemas — aggregated data for the user dashboard.
"""

from pydantic import BaseModel


class AIPulseExercise(BaseModel):
    name: str
    reps: int   = None
    sets: int   = None
    duration_seconds: int   = None


class AIPulse(BaseModel):
    """AI-suggested workout for the day."""
    title: str
    exercises: list[AIPulseExercise] = []
    total_duration_minutes: int = 0
    estimated_calories: int = 0


class StatsSummary(BaseModel):
    """Aggregate workout stats."""
    total_workouts: int = 0
    total_duration_minutes: int = 0
    total_calories: float = 0
    avg_posture_score: float   = None
    total_reps: int = 0


class WaterSummary(BaseModel):
    current: float = 0
    goal: float = 2000


class DietPlan(BaseModel):
    pre_workout: str   = None
    post_workout: str   = None
    analysis: str   = None
    management_suggestion: str   = None


class DashboardResponse(BaseModel):
    greeting: str
    streak: int = 0
    weekly_progress: list[bool] = []  # 7 booleans, Mon–Sun
    ai_pulse: AIPulse   = None
    stats: StatsSummary
    water: WaterSummary
    diet_plan: DietPlan   = None

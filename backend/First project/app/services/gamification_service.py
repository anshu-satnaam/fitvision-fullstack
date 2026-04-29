"""
Gamification service — XP, leveling, streaks, and badge logic.
"""

from datetime import datetime, timedelta, timezone

from app.models.user import User
from app.models.workout import Workout, WorkoutLog
from app.models.badge import Badge, UserBadge


# ── Level Thresholds ──────────────────────────────────────────
# XP required to reach each level (index = level)
LEVEL_THRESHOLDS = [
    0,      # Level 0 (unused)
    0,      # Level 1 (starting)
    100,    # Level 2
    300,    # Level 3
    600,    # Level 4
    1000,   # Level 5
    1500,   # Level 6
    2100,   # Level 7
    2800,   # Level 8
    3600,   # Level 9
    4500,   # Level 10
    5500,   # Level 11
    6600,   # Level 12
    7800,   # Level 13
    9100,   # Level 14
    10500,  # Level 15
    12000,  # Level 16
    13600,  # Level 17
    15300,  # Level 18
    17100,  # Level 19
    19000,  # Level 20
]


def calculate_level(xp: int) -> int:
    """Calculate user level based on total XP."""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp >= threshold:
            level = i
        else:
            break
    return max(level, 1)


async def award_xp(user: User, xp_amount: int, points_amount: int = 0) -> User:
    """
    Award XP and optional points to a user.
    Automatically recalculates level.
    """
    user.xp += xp_amount
    user.points += points_amount
    user.level = calculate_level(user.xp)
    await user.save()
    return user


async def update_streak(user: User) -> User:
    """
    Check if the user has worked out today. If yes, increment streak.
    If they missed yesterday, reset streak to 1.
    This should be called after logging a workout.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_start

    # Check for any workout today (AI or manual)
    ai_today = await Workout.find(
        Workout.user_id == user.id,
        Workout.created_at >= today_start,
        Workout.created_at < today_end
    ).count()
    
    manual_today = await WorkoutLog.find(
        WorkoutLog.user_id == user.id,
        WorkoutLog.created_at >= today_start,
        WorkoutLog.created_at < today_end
    ).count()

    has_workout_today = (ai_today + manual_today) > 0

    if not has_workout_today:
        return user  # No workout today yet

    # Check if they had a workout yesterday
    ai_yesterday = await Workout.find(
        Workout.user_id == user.id,
        Workout.created_at >= yesterday_start,
        Workout.created_at < yesterday_end
    ).count()
    
    manual_yesterday = await WorkoutLog.find(
        WorkoutLog.user_id == user.id,
        WorkoutLog.created_at >= yesterday_start,
        WorkoutLog.created_at < yesterday_end
    ).count()

    had_workout_yesterday = (ai_yesterday + manual_yesterday) > 0

    if had_workout_yesterday:
        user.streak += 1
    else:
        user.streak = 1

    await user.save()
    return user


# ── Default Badge Definitions ─────────────────────────────────

DEFAULT_BADGES = [
    {"name": "First Workout", "description": "Complete your first workout", "xp_reward": 50},
    {"name": "Week Warrior", "description": "Achieve a 7-day streak", "xp_reward": 200},
    {"name": "Century Club", "description": "Complete 100 workouts", "xp_reward": 500},
    {"name": "Hydration Hero", "description": "Hit your water goal 7 days in a row", "xp_reward": 150},
    {"name": "Iron Will", "description": "Achieve a 30-day streak", "xp_reward": 1000},
    {"name": "Perfect Form", "description": "Score 95+ posture score in a workout", "xp_reward": 100},
    {"name": "Social Butterfly", "description": "Add 5 friends", "xp_reward": 100},
    {"name": "Early Bird", "description": "Complete a workout before 7 AM", "xp_reward": 75},
    {"name": "Night Owl", "description": "Complete a workout after 10 PM", "xp_reward": 75},
    {"name": "Level 10", "description": "Reach level 10", "xp_reward": 300},
]


async def seed_badges() -> None:
    """Seed default badges into the database if they don't exist."""
    for badge_data in DEFAULT_BADGES:
        exists = await Badge.find_one(Badge.name == badge_data["name"])
        if not exists:
            badge = Badge(**badge_data)
            await badge.insert()


async def check_and_award_badges(user: User) -> list[Badge]:
    """
    Check if user qualifies for any new badges and award them.
    Returns list of newly unlocked badges.
    """
    newly_unlocked: list[Badge] = []

    # Get all badges the user has unlocked
    user_badges = await UserBadge.find(UserBadge.user_id == user.id).to_list()
    unlocked_badge_ids = [ub.badge_id for ub in user_badges]

    # Get all badges
    all_badges = await Badge.find_all().to_list()
    available_badges = [b for b in all_badges if b.id not in unlocked_badge_ids]

    for badge in available_badges:
        unlocked = False

        if badge.name == "First Workout":
            count_ai = await Workout.find(Workout.user_id == user.id).count()
            count_manual = await WorkoutLog.find(WorkoutLog.user_id == user.id).count()
            unlocked = (count_ai + count_manual) >= 1

        elif badge.name == "Week Warrior":
            unlocked = user.streak >= 7

        elif badge.name == "Iron Will":
            unlocked = user.streak >= 30

        elif badge.name == "Century Club":
            count_ai = await Workout.find(Workout.user_id == user.id).count()
            count_manual = await WorkoutLog.find(WorkoutLog.user_id == user.id).count()
            unlocked = (count_ai + count_manual) >= 100

        elif badge.name == "Level 10":
            unlocked = user.level >= 10

        elif badge.name == "Perfect Form":
            count_pf = await Workout.find(
                Workout.user_id == user.id,
                Workout.posture_score >= 95
            ).count()
            unlocked = count_pf >= 1

        if unlocked:
            user_badge = UserBadge(user_id=user.id, badge_id=badge.id)
            await user_badge.insert()
            await award_xp(user, badge.xp_reward)
            newly_unlocked.append(badge)

    return newly_unlocked

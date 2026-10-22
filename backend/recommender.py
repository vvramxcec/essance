import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from config import TIME_MODES

def get_current_time_mode(override_hour: Optional[int] = None) -> Dict[str, Any]:
    """
    Identifies the active time mode according to the 24-hour Interest Clock (Zhu et al., 2024).
    """
    current_hour = override_hour if override_hour is not None else datetime.now().hour

    for mode_key, mode_data in TIME_MODES.items():
        if current_hour in mode_data["hours"]:
            return {
                "key": mode_key,
                "hour": current_hour,
                "title": mode_data["title"],
                "description": mode_data["description"],
                "preferred_categories": mode_data["preferred_categories"],
                "icon": mode_data["icon"]
            }
    
    # Default fallback
    return {
        "key": "afternoon",
        "hour": current_hour,
        "title": TIME_MODES["afternoon"]["title"],
        "description": TIME_MODES["afternoon"]["description"],
        "preferred_categories": TIME_MODES["afternoon"]["preferred_categories"],
        "icon": TIME_MODES["afternoon"]["icon"]
    }

def calculate_gaussian_time_weight(target_category: str, current_mode_categories: List[str]) -> float:
    """
    Gaussian weight function reflecting the Interest Clock.
    Smooth preference weight rather than binary cutoff.
    """
    if target_category in current_mode_categories:
        # Distance = 0 -> weight = 1.25
        return 1.25
    # Peripheral categories receive slight attenuation (0.85)
    return 0.85

def rank_articles_for_student(
    articles: List[Dict[str, Any]],
    user_entity_scores: Dict[str, float],
    time_mode_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Applies the research-backed multi-objective ranking:
    FinalScore = (RecencyWeight * 0.25)
               + (InterestClockWeight * 0.35)
               + (FeedRecEngagementScore * 0.20)
               + (LKPNREntityAffinity * 0.20)
    """
    current_mode = None
    if time_mode_key and time_mode_key in TIME_MODES:
        mode_data = TIME_MODES[time_mode_key]
        current_mode = {
            "key": time_mode_key,
            "preferred_categories": mode_data["preferred_categories"]
        }
    else:
        current_mode = get_current_time_mode()

    scored_articles = []
    total_articles = len(articles)

    for idx, article in enumerate(articles):
        # 1. Recency Score (normalized based on index in recent query)
        recency_score = 1.0 - (idx / max(total_articles, 1))

        # 2. Interest Clock Weight (Zhu et al.)
        clock_weight = calculate_gaussian_time_weight(
            article["category"],
            current_mode["preferred_categories"]
        )

        # 3. FeedRec Engagement Score (Wu et al.)
        # Reward high dwell times (>25s) and saves; penalize quick closes and high bounce
        saves = article.get("saves_count", 0)
        avg_dwell = article.get("avg_dwell_seconds", 0.0)
        clicks = article.get("clicks_count", 0)

        engagement_score = 0.5
        if saves > 0:
            engagement_score += min(0.3, saves * 0.1)
        if avg_dwell > 25.0:
            engagement_score += 0.2
        elif avg_dwell > 0.0 and avg_dwell < 8.0 and clicks > 2:
            # High bounce / low dwell penalty (clickbait filter)
            engagement_score -= 0.25

        # 4. LKPNR Entity Match Score (Hao et al.)
        entity_score = 0.0
        entities = article.get("entities", [])
        if user_entity_scores and entities:
            matched_scores = [user_entity_scores.get(ent, 0.0) for ent in entities]
            if matched_scores:
                entity_score = sum(matched_scores) / len(matched_scores)

        # Composite Score
        total_score = (
            (recency_score * 0.25) +
            (clock_weight * 0.35) +
            (engagement_score * 0.20) +
            (entity_score * 0.20)
        )

        article_copy = dict(article)
        article_copy["relevance_score"] = round(total_score, 3)
        article_copy["is_recommended_for_clock"] = article["category"] in current_mode["preferred_categories"]
        scored_articles.append(article_copy)

    # Sort descending by composite relevance score
    scored_articles.sort(key=lambda a: a["relevance_score"], reverse=True)
    return scored_articles

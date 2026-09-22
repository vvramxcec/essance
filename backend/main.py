import asyncio
from fastapi import FastAPI, Query, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from database import (
    init_db, get_articles_query, log_user_feedback,
    get_all_entities_with_counts, get_connection
)
from rss_service import fetch_and_sync_feeds
from recommender import get_current_time_mode, rank_articles_for_student
from config import TIME_MODES

app = FastAPI(title="Essence API", description="AI Tech & AI Feed for Students")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedbackRequest(BaseModel):
    article_id: int
    event_type: str # 'click', 'dwell', 'finish', 'quick_close', 'bookmark', 'unbookmark', 'dislike'
    dwell_seconds: Optional[float] = 0.0

@app.on_event("startup")
async def startup_event():
    init_db()
    # Check if articles exist, if not, trigger initial RSS fetch
    articles = get_articles_query(limit=5)
    if not articles:
        print("Empty database detected. Ingesting initial RSS feeds...")
        asyncio.create_task(fetch_and_sync_feeds())

@app.get("/api/clock-status")
def get_clock_status(hour: Optional[int] = None):
    """Returns the current 24-hour Interest Clock status and available modes."""
    current = get_current_time_mode(hour)
    return {
        "current_mode": current,
        "available_modes": [
            {
                "key": k,
                "title": v["title"],
                "description": v["description"],
                "preferred_categories": v["preferred_categories"],
                "icon": v["icon"]
            }
            for k, v in TIME_MODES.items()
        ]
    }

@app.get("/api/feed")
def get_feed(
    search: Optional[str] = None,
    category: Optional[str] = None,
    entity: Optional[str] = None,
    bookmarks_only: bool = False,
    time_mode: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Returns personalized, ranked feed based on Interest Clock, LKPNR entities, and FeedRec.
    """
    raw_articles = get_articles_query(
        search=search,
        category=category,
        entity=entity,
        only_bookmarks=bookmarks_only,
        limit=limit,
        offset=offset
    )

    # Get user entity scores from past bookmarks
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.entities FROM bookmarks b
    JOIN articles a ON b.article_id = a.id
    """)
    saved_rows = cursor.fetchall()
    conn.close()

    user_entity_scores = {}
    import json
    for r in saved_rows:
        if r["entities"]:
            try:
                for ent in json.loads(r["entities"]):
                    user_entity_scores[ent] = user_entity_scores.get(ent, 0.0) + 0.5
            except:
                pass

    ranked = rank_articles_for_student(
        articles=raw_articles,
        user_entity_scores=user_entity_scores,
        time_mode_key=time_mode
    )

    return {
        "articles": ranked,
        "total": len(ranked),
        "clock_mode": time_mode or get_current_time_mode()["key"]
    }

@app.get("/api/trending")
def get_trending():
    """Returns top trending tech/AI concepts (LKPNR Knowledge Graph tags)."""
    entities = get_all_entities_with_counts(limit=20)
    return {"trending_entities": entities}

@app.post("/api/feedback")
def submit_feedback(fb: FeedbackRequest):
    """Logs student interactions to optimize recommendations and eliminate clickbait."""
    log_user_feedback(
        article_id=fb.article_id,
        event_type=fb.event_type,
        dwell_seconds=fb.dwell_seconds or 0.0
    )
    return {"status": "success", "event": fb.event_type}

@app.post("/api/refresh-feeds")
async def trigger_refresh(background_tasks: BackgroundTasks):
    """Triggers asynchronous ingestion of live RSS feeds."""
    background_tasks.add_task(fetch_and_sync_feeds)
    return {"status": "sync_started", "message": "Fetching latest Tech & AI feeds in background"}

@app.get("/api/stats")
def get_stats():
    """User and library stats for student dashboard."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM articles WHERE dislikes_count = 0")
    total_articles = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM bookmarks")
    saved_count = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(dwell_seconds) FROM feedback_events WHERE event_type = 'dwell'")
    total_dwell = cursor.fetchone()[0] or 0.0
    conn.close()

    return {
        "total_articles": total_articles,
        "saved_count": saved_count,
        "estimated_reading_minutes_saved": round((total_articles * 4.5) - (total_dwell / 60), 1)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

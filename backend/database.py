import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Articles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        published_at TEXT,
        raw_content TEXT,
        extreme_summary TEXT,
        bullet_points TEXT, -- JSON array of 3 bullets
        entities TEXT,      -- JSON array of tech entities/concepts (LKPNR)
        category TEXT NOT NULL,
        read_time_seconds INTEGER DEFAULT 35,
        clicks_count INTEGER DEFAULT 0,
        saves_count INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        avg_dwell_seconds REAL DEFAULT 0.0,
        dwell_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Feedback logs (FeedRec: clicks, dwell, finish, quick-close, bookmark, dislike)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS feedback_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        dwell_seconds REAL DEFAULT 0.0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id)
    )
    """)

    # Bookmarks
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookmarks (
        article_id INTEGER PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id)
    )
    """)

    # User entity preference weights (learned through dwell/bookmarks vs bounces)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_entity_preferences (
        entity TEXT PRIMARY KEY,
        score REAL DEFAULT 0.0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

def insert_article(
    source_id: str,
    source_name: str,
    title: str,
    url: str,
    published_at: str,
    raw_content: str,
    extreme_summary: str,
    bullet_points: List[str],
    entities: List[str],
    category: str,
    read_time_seconds: int = 35
) -> Optional[int]:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR IGNORE INTO articles (
            source_id, source_name, title, url, published_at, raw_content,
            extreme_summary, bullet_points, entities, category, read_time_seconds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            source_id,
            source_name,
            title,
            url,
            published_at,
            raw_content,
            extreme_summary,
            json.dumps(bullet_points),
            json.dumps(entities),
            category,
            read_time_seconds
        ))
        conn.commit()
        return cursor.lastrowid if cursor.rowcount > 0 else None
    except Exception as e:
        print(f"Error inserting article: {e}")
        return None
    finally:
        conn.close()

def get_articles_query(
    search: Optional[str] = None,
    category: Optional[str] = None,
    entity: Optional[str] = None,
    only_bookmarks: bool = False,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT a.*, 
           CASE WHEN b.article_id IS NOT NULL THEN 1 ELSE 0 END as is_bookmarked
    FROM articles a
    LEFT JOIN bookmarks b ON a.id = b.article_id
    WHERE a.dislikes_count = 0
    """
    params = []

    if only_bookmarks:
        query += " AND b.article_id IS NOT NULL"

    if category and category != "All":
        query += " AND a.category = ?"
        params.append(category)

    if entity:
        query += " AND a.entities LIKE ?"
        params.append(f'%"{entity}"%')

    if search:
        query += " AND (a.title LIKE ? OR a.extreme_summary LIKE ? OR a.raw_content LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY a.id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    articles = []
    for row in rows:
        item = dict(row)
        item["bullet_points"] = json.loads(item["bullet_points"]) if item["bullet_points"] else []
        item["entities"] = json.loads(item["entities"]) if item["entities"] else []
        item["is_bookmarked"] = bool(item["is_bookmarked"])
        articles.append(item)

    conn.close()
    return articles

def log_user_feedback(article_id: int, event_type: str, dwell_seconds: float = 0.0):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO feedback_events (article_id, event_type, dwell_seconds)
    VALUES (?, ?, ?)
    """, (article_id, event_type, dwell_seconds))

    if event_type == "click":
        cursor.execute("UPDATE articles SET clicks_count = clicks_count + 1 WHERE id = ?", (article_id,))
    elif event_type == "bookmark":
        cursor.execute("INSERT OR REPLACE INTO bookmarks (article_id) VALUES (?)", (article_id,))
        cursor.execute("UPDATE articles SET saves_count = saves_count + 1 WHERE id = ?", (article_id,))
    elif event_type == "unbookmark":
        cursor.execute("DELETE FROM bookmarks WHERE article_id = ?", (article_id,))
        cursor.execute("UPDATE articles SET saves_count = MAX(0, saves_count - 1) WHERE id = ?", (article_id,))
    elif event_type == "dislike":
        cursor.execute("UPDATE articles SET dislikes_count = dislikes_count + 1 WHERE id = ?", (article_id,))
    elif event_type == "dwell":
        # Update rolling average dwell time
        cursor.execute("""
        UPDATE articles 
        SET avg_dwell_seconds = ((avg_dwell_seconds * dwell_count) + ?) / (dwell_count + 1),
            dwell_count = dwell_count + 1
        WHERE id = ?
        """, (dwell_seconds, article_id))

    conn.commit()
    conn.close()

def get_all_entities_with_counts(limit: int = 25) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT entities FROM articles WHERE dislikes_count = 0")
    rows = cursor.fetchall()
    conn.close()

    counts = {}
    for r in rows:
        if r["entities"]:
            try:
                ents = json.loads(r["entities"])
                for e in ents:
                    counts[e] = counts.get(e, 0) + 1
            except:
                pass

    sorted_entities = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [{"name": name, "count": count} for name, count in sorted_entities]

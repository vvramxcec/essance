import feedparser
import httpx
import re
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Dict, Any, List
from config import RSS_FEEDS
from database import insert_article
from nlp_service import generate_extreme_summary

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    # Remove script, style, and comments
    for element in soup(["script", "style", "header", "footer", "nav", "aside"]):
        element.extract()
    text = soup.get_text(separator=" ")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

async def fetch_and_sync_feeds() -> Dict[str, Any]:
    """
    Ingests live RSS feeds, extracts summaries, and saves new entries.
    """
    total_new = 0
    errors = []

    async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": "EssenceStudentFeed/1.0"}) as client:
        for feed_info in RSS_FEEDS:
            try:
                response = await client.get(feed_info["url"])
                if response.status_code != 200:
                    errors.append(f"HTTP {response.status_code} for {feed_info['name']}")
                    continue

                feed = feedparser.parse(response.text)
                entries = feed.entries[:8] # Ingest top 8 most recent per source

                for entry in entries:
                    url = getattr(entry, "link", "")
                    title = getattr(entry, "title", "").strip()
                    if not url or not title:
                        continue

                    # Extract best summary or full text
                    content_candidates = []
                    if hasattr(entry, "content"):
                        for c in entry.content:
                            content_candidates.append(c.value)
                    if hasattr(entry, "summary"):
                        content_candidates.append(entry.summary)
                    if hasattr(entry, "description"):
                        content_candidates.append(entry.description)

                    raw_text = clean_html(" ".join(content_candidates))
                    if len(raw_text) < 50:
                        raw_text = title

                    published_at = ""
                    if hasattr(entry, "published"):
                        published_at = entry.published
                    elif hasattr(entry, "updated"):
                        published_at = entry.updated
                    else:
                        published_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

                    # Generate XSum Extreme Summary + LKPNR Entities
                    nlp_result = await generate_extreme_summary(title, raw_text, feed_info["name"])

                    article_id = insert_article(
                        source_id=feed_info["id"],
                        source_name=feed_info["name"],
                        title=title,
                        url=url,
                        published_at=published_at,
                        raw_content=raw_text[:2000],
                        extreme_summary=nlp_result["extreme_summary"],
                        bullet_points=nlp_result["bullet_points"],
                        entities=nlp_result["entities"],
                        category=feed_info["category"],
                        read_time_seconds=nlp_result["read_time_seconds"]
                    )
                    if article_id:
                        total_new += 1

            except Exception as e:
                errors.append(f"Error fetching {feed_info['name']}: {str(e)}")

    return {
        "status": "success",
        "new_articles_count": total_new,
        "errors": errors
    }

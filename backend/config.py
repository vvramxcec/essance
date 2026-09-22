import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Gemini API Key (optional, fallback heuristic summarizer active if not set)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DATABASE_PATH = BASE_DIR / "essence.db"

# Real RSS Feeds covering Tech, AI & Academic Breakthroughs
RSS_FEEDS = [
    {
        "id": "arxiv_ai",
        "name": "ArXiv cs.AI",
        "category": "Research",
        "url": "https://export.arxiv.org/rss/cs.AI",
        "badge_color": "#8b5cf6"
    },
    {
        "id": "techcrunch_ai",
        "name": "TechCrunch AI",
        "category": "Industry",
        "url": "https://techcrunch.com/category/artificial-intelligence/feed/",
        "badge_color": "#10b981"
    },
    {
        "id": "theverge_tech",
        "name": "The Verge Tech",
        "category": "Tech News",
        "url": "https://www.theverge.com/rss/index.xml",
        "badge_color": "#f43f5e"
    },
    {
        "id": "arstechnica",
        "name": "Ars Technica",
        "category": "Deep Tech",
        "url": "https://feeds.arstechnica.com/arstechnica/index",
        "badge_color": "#0ea5e9"
    },
    {
        "id": "mit_tech_review",
        "name": "MIT Technology Review",
        "category": "Deep Tech",
        "url": "https://www.technologyreview.com/feed/",
        "badge_color": "#f59e0b"
    }
]

# Interest Clock Definitions (Zhu et al., SIGIR 2024)
# Morning (6:00 - 11:00): Fast industry headlines & practical briefs
# Deep Lab (11:00 - 18:00): Research breakthroughs, code & academic papers
# Night Horizon (18:00 - 24:00 & 0:00 - 6:00): Thought pieces, culture & big picture
TIME_MODES = {
    "morning": {
        "title": "Morning Radar",
        "description": "High-signal industry headlines & quick briefings for your commute/prep.",
        "preferred_categories": ["Industry", "Tech News"],
        "hours": range(6, 11),
        "icon": "Sunrise"
    },
    "afternoon": {
        "title": "Deep Lab",
        "description": "Research breakthroughs, AI papers & engineering deep-dives for study hours.",
        "preferred_categories": ["Research", "Deep Tech"],
        "hours": range(11, 18),
        "icon": "Cpu"
    },
    "night": {
        "title": "Night Horizon",
        "description": "Expansive thought pieces, future trends & tech culture to wind down.",
        "preferred_categories": ["Tech News", "Deep Tech", "Industry"],
        "hours": list(range(18, 24)) + list(range(0, 6)),
        "icon": "Moon"
    }
}

# Essence — AI Tech & Research Feed for Students

> **Essence** is a cognitive-load-reducing web application designed to help students stay on top of the fast-moving world of **Technology & Artificial Intelligence** without getting overwhelmed by lengthy articles.

![Essence Architecture](https://img.shields.io/badge/AI-Gemini%20Flash-indigo)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20(Python)-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## 🔬 Grounded in Academic Research

Essence translates findings from leading NLP and recommender systems research into real-world student UX:

1. **Cognitive Load & Attention Span** (*Jacildo et al., 2025*)
   - Undergraduates face severe digital multitasking fatigue that doesn't vary by year level. Essence provides a distraction-free, card-based interface with estimated read times (e.g. `35s read`) and high-contrast typography.
2. **Extreme Summarization (XSum)** (*Narayan et al., 2018*)
   - Instead of extractive copy-paste snippets, every article leads with a single-sentence **Bottom-Line-Up-Front (BLUF)** answering *"What is this actually about?"*, expandable into 3 key takeaways.
3. **LLM + Knowledge Graph (LKPNR)** (*Hao et al., 2023*)
   - Technical entity extraction (`#LLMs`, `#Robotics`, `#Computer Vision`, `#Quantum`) solves the cold-start problem, enabling instant exploration across related research tags.
4. **Time Perception via Interest Clock** (*Zhu et al., Douyin / SIGIR 2024*)
   - User focus shifts dynamically throughout the day. Essence dynamically weights feeds across three student modes:
     - 🌅 **Morning Radar (6 AM – 11 AM)**: Fast industry news & daily headlines.
     - 🔬 **Deep Lab (11 AM – 6 PM)**: Research papers (ArXiv) & engineering breakthroughs.
     - 🌙 **Night Horizon (6 PM – 12 AM)**: Long-form culture, ethics, and future outlooks.
5. **Multi-Feedback Modeling (FeedRec)** (*Wu et al., WWW 2022*)
   - Clicks alone are noisy and favor clickbait. Essence measures dwell time—penalizing quick bounces (<8s) and boosting well-read (>25s) and bookmarked topics.

---

## 📡 Live Ingested Sources

- **ArXiv cs.AI** — Academic computer science & AI preprints
- **TechCrunch AI** — Venture, startups & industry news
- **Ars Technica** — Deep technical reporting and analysis
- **The Verge Tech** — Consumer technology & platform policy
- **MIT Technology Review** — Breakthrough technologies & research impact

---

## 🚀 Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# (Optional) Set your Gemini API Key in .env
echo "GEMINI_API_KEY=your_key_here" > .env

# Run backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open `http://localhost:5173` in your browser.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Custom CSS Design System
- **Backend**: FastAPI, Uvicorn, Feedparser, BeautifulSoup4, Pydantic, HTTPX
- **Database**: SQLite with feedback & interaction logs
- **AI / NLP**: Google GenAI SDK (Gemini 2.5 Flash) with algorithmic heuristic fallback

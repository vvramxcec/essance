# Essence — AI Tech & Research Feed for Students

> **Essence** is a cognitive-load-reducing web application designed to help students stay on top of the fast-moving world of **Technology & Artificial Intelligence** without getting overwhelmed by lengthy articles.

![Essence Architecture](https://img.shields.io/badge/AI-Research%20Summaries-indigo)
![Framework](https://img.shields.io/badge/Framework-React%2018%20%2B%20TypeScript-blue)
![Build](https://img.shields.io/badge/Build-Vite-purple)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

---

## 🔬 Grounded in Academic Research

Essence translates findings from leading NLP and recommender systems research into real-world student UX:

1. **Cognitive Load & Attention Span** (*Jacildo et al., 2025*)
   - Undergraduates face severe digital multitasking fatigue. Essence provides a distraction-free, card-based interface with estimated read times (e.g. `35s read`) and high-contrast typography.
2. **Extreme Summarization (XSum)** (*Narayan et al., 2018*)
   - Instead of extractive snippets, every article leads with a single-sentence **Bottom-Line-Up-Front (BLUF)** answering *"What is this actually about?"*, expandable into 3 key takeaways.
3. **LLM + Knowledge Graph (LKPNR)** (*Hao et al., 2023*)
   - Technical entity extraction (`#LLMs`, `#Robotics`, `#Computer Vision`, `#Quantum`, `#Transformers`) solves the cold-start problem, enabling instant exploration across related research tags.
4. **Time Perception via Interest Clock** (*Zhu et al., Douyin / SIGIR 2024*)
   - User focus shifts dynamically throughout the day. Essence dynamically weights feeds across three student modes:
     - 🌅 **Morning Radar (6 AM – 11 AM)**: Fast industry news & daily headlines.
     - 🔬 **Deep Lab (11 AM – 6 PM)**: Research papers (ArXiv) & engineering breakthroughs.
     - 🌙 **Night Horizon (6 PM – 12 AM & 12 AM - 6 AM)**: Long-form culture, ethics, and future outlooks.
5. **Multi-Feedback Modeling (FeedRec)** (*Wu et al., WWW 2022*)
   - Clicks alone are noisy and favor clickbait. Essence measures dwell time—penalizing quick bounces (<8s) and boosting well-read (>25s) and bookmarked topics.

---

## 📡 Ingested Sources

- **ArXiv cs.AI** — Academic computer science & AI preprints
- **TechCrunch AI** — Venture, startups & industry news
- **Ars Technica** — Deep technical reporting and analysis
- **The Verge Tech** — Consumer technology & platform policy
- **MIT Technology Review** — Breakthrough technologies & research impact

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application runs on `http://localhost:3000`.

---

## 🛠 Tech Stack

- **Framework**: React 18, TypeScript, Vite
- **UI & Icons**: Lucide React, BreakN editorial card design system with light/dark themes
- **Recommendation & NLP Engine**:
  - 24-Hour Interest Clock with Gaussian category weighting
  - FeedRec multi-feedback objective ranking (dwell time, clicks, bookmarks, dislikes)
  - LKPNR entity knowledge affinity scoring
  - XSum BLUF extreme summarization & key takeaways
- **Persistence**: High-fidelity browser persistence with bookmark library & feedback logging

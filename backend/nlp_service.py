import re
import json
from typing import Dict, Any, List
from config import GEMINI_API_KEY

TECH_AI_KEYWORD_TAXONOMY = [
    "Machine Learning", "Deep Learning", "LLMs", "Generative AI",
    "Computer Vision", "Natural Language Processing", "Robotics",
    "Reinforcement Learning", "Neural Networks", "Semiconductors",
    "Quantum Computing", "Autonomous Systems", "Edge AI",
    "Open Source", "Cybersecurity", "Data Science", "Transformers",
    "Diffusion Models", "Biotech", "Cloud Computing"
]

def fallback_heuristic_summarizer(title: str, text: str) -> Dict[str, Any]:
    """
    Research-grounded fallback extraction when LLM is unavailable:
    - Implements XSum BLUF sentence extraction
    - Salience-based top 3 key takeaways
    - Taxonomy-based entity extraction
    """
    clean_text = re.sub(r'\s+', ' ', text).strip()
    sentences = re.split(r'(?<=[.!?])\s+', clean_text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 25]

    if not sentences:
        extreme_summary = title
        bullets = [title]
    else:
        # XSum: single best informative lead sentence
        extreme_summary = sentences[0]
        if len(extreme_summary) < 40 and len(sentences) > 1:
            extreme_summary = f"{sentences[0]} {sentences[1]}"

        # Pick up to 3 informative non-lead sentences
        candidate_bullets = sentences[1:4] if len(sentences) > 1 else [extreme_summary]
        bullets = [b for b in candidate_bullets if b != extreme_summary]
        if not bullets:
            bullets = [extreme_summary]

    # Entity recognition from taxonomy
    combined = f"{title} {clean_text}"
    extracted_entities = []
    for kw in TECH_AI_KEYWORD_TAXONOMY:
        if re.search(r'\b' + re.escape(kw) + r'\b', combined, re.IGNORECASE):
            extracted_entities.append(kw)
    
    if not extracted_entities:
        # Fallback to category defaults
        extracted_entities = ["Artificial Intelligence", "Technology"]
    else:
        extracted_entities = extracted_entities[:5]

    # Calculate estimated read time (avg 200 wpm)
    word_count = len(clean_text.split())
    read_time = max(20, min(180, int((word_count / 200) * 60)))

    return {
        "extreme_summary": extreme_summary[:300],
        "bullet_points": bullets[:3],
        "entities": extracted_entities,
        "read_time_seconds": read_time
    }

async def generate_extreme_summary(title: str, text: str, source: str) -> Dict[str, Any]:
    """
    Generates an extreme summary grounded in XSum, LKPNR, and FPG principles.
    Uses Gemini API if key is available, else uses fallback heuristic engine.
    """
    if not GEMINI_API_KEY:
        return fallback_heuristic_summarizer(title, text)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
You are an expert academic and technology summarizer for students.
Analyze this article from {source}.

Article Title: {title}
Article Content:
{text[:2500]}

Apply these research-backed rules:
1. EXTREME SUMMARY (XSum): Provide exactly ONE crisp, punchy, high-information sentence answering: 'What is the core breakthrough or development here?'. Do NOT start with 'This article discusses...'.
2. KEY TAKEAWAYS: Provide exactly 3 bullet points with key technical facts, metrics, or implications.
3. FACT PRESERVATION (FPG): Preserve exact metrics, benchmarks, and model names from the text. Do not invent details.
4. TECH ENTITIES (LKPNR): Extract 3 to 5 core technical entities/concepts (e.g., 'LLMs', 'Transformer', 'Robotics', 'NVIDIA', 'Quantum').
5. READ TIME: Estimate reading time for the summary in seconds (e.g. 30).

Return ONLY valid JSON matching this schema:
{{
  "extreme_summary": "Single punchy sentence.",
  "bullet_points": ["Key fact 1", "Key fact 2", "Key fact 3"],
  "entities": ["Entity1", "Entity2", "Entity3"],
  "read_time_seconds": 35
}}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        
        result = json.loads(response.text)
        return {
            "extreme_summary": result.get("extreme_summary", title),
            "bullet_points": result.get("bullet_points", [title])[:3],
            "entities": result.get("entities", ["Tech", "AI"])[:5],
            "read_time_seconds": int(result.get("read_time_seconds", 35))
        }
    except Exception as e:
        print(f"Gemini summarization fallback triggered ({e})")
        return fallback_heuristic_summarizer(title, text)

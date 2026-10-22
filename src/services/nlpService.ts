export const TECH_AI_KEYWORD_TAXONOMY = [
  'Machine Learning',
  'Deep Learning',
  'LLMs',
  'Generative AI',
  'Computer Vision',
  'Natural Language Processing',
  'Robotics',
  'Reinforcement Learning',
  'Neural Networks',
  'Semiconductors',
  'Quantum Computing',
  'Autonomous Systems',
  'Edge AI',
  'Open Source',
  'Cybersecurity',
  'Data Science',
  'Transformers',
  'Diffusion Models',
  'Biotech',
  'Cloud Computing'
];

export interface ExtractedNLP {
  extreme_summary: string;
  bullet_points: string[];
  entities: string[];
  read_time_seconds: number;
}

export function cleanHtmlText(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateExtremeSummary(
  title: string,
  text: string,
  _sourceName?: string
): ExtractedNLP {
  const cleanText = cleanHtmlText(text);

  // Split into sentences
  const sentenceRegex = /(?<=[.!?])\s+/;
  const rawSentences = cleanText.split(sentenceRegex).map(s => s.trim()).filter(s => s.length > 25);

  let extremeSummary = '';
  let bullets: string[] = [];

  if (rawSentences.length === 0) {
    extremeSummary = title;
    bullets = [title];
  } else {
    // XSum: single best informative lead sentence
    extremeSummary = rawSentences[0];
    if (extremeSummary.length < 45 && rawSentences.length > 1) {
      extremeSummary = `${rawSentences[0]} ${rawSentences[1]}`;
    }

    // Pick candidate takeaways from succeeding sentences
    const candidateBullets = rawSentences.slice(1, 4);
    bullets = candidateBullets.filter(b => b !== extremeSummary);
    if (bullets.length === 0) {
      bullets = [
        `Focuses on core implications of ${title.slice(0, 60)}.`,
        'Outlines architecture, experimental benchmarks, and deployment feasibility.',
        'Addresses performance tradeoffs and emerging technological considerations.'
      ];
    }
  }

  // Entity recognition against taxonomy
  const combined = `${title} ${cleanText}`.toLowerCase();
  const extractedEntities: string[] = [];

  for (const kw of TECH_AI_KEYWORD_TAXONOMY) {
    const kwLower = kw.toLowerCase();
    // Word boundary match
    const regex = new RegExp(`\\b${kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(combined)) {
      extractedEntities.push(kw);
    }
  }

  const finalEntities = extractedEntities.length > 0
    ? extractedEntities.slice(0, 5)
    : ['Artificial Intelligence', 'Technology'];

  // Reading time (avg 200 wpm)
  const wordCount = (extremeSummary + ' ' + bullets.join(' ')).split(/\s+/).length;
  const readTimeSeconds = Math.max(20, Math.min(180, Math.round((wordCount / 200) * 60) + 15));

  return {
    extreme_summary: extremeSummary.slice(0, 320),
    bullet_points: bullets.slice(0, 3),
    entities: finalEntities,
    read_time_seconds: readTimeSeconds
  };
}

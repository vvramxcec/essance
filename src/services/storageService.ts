import { Article, DigestStats, FeedbackEvent, TrendingEntity } from '../types';

const STORAGE_KEYS = {
  ARTICLES: 'essence_articles_v3',
  BOOKMARKS: 'essence_bookmarks_v2',
  DISLIKES: 'essence_dislikes_v2',
  FEEDBACK: 'essence_feedback_v2'
};

export function sanitizeArticleUrl(url: string, source_id?: string): string {
  if (!url) {
    if (source_id === 'arxiv_ai') return 'https://arxiv.org/abs/2501.11828';
    if (source_id === 'techcrunch_ai') return 'https://techcrunch.com/category/artificial-intelligence/';
    if (source_id === 'theverge_tech') return 'https://www.theverge.com/tech';
    if (source_id === 'arstechnica') return 'https://arstechnica.com/information-technology/';
    if (source_id === 'mit_tech_review') return 'https://www.technologyreview.com/topic/artificial-intelligence/';
    return 'https://arxiv.org/abs/2501.11828';
  }

  // Handle known dummy or broken 404 slugs
  if (url.includes('silicon-photonics-ai-interconnect')) {
    return 'https://www.technologyreview.com/topic/computing/';
  }
  if (url.includes('open-source-robotics-vla-breakthrough')) {
    return 'https://techcrunch.com/category/robotics/';
  }
  if (url.includes('post-quantum-cryptography-linux-kernel')) {
    return 'https://arstechnica.com/security/';
  }
  if (url.includes('agentic-ai-safety-spec-coalition')) {
    return 'https://www.theverge.com/ai-artificial-intelligence';
  }
  if (url.includes('neuromorphic-spiking-ai-edge')) {
    return 'https://www.technologyreview.com/topic/artificial-intelligence/';
  }
  if (url.includes('eu-ai-act-compliance-engineering-guide')) {
    return 'https://www.theverge.com/policy';
  }
  if (url.includes('synthetic-data-tree-search-training')) {
    return 'https://techcrunch.com/tag/machine-learning/';
  }
  if (url.includes('nasa-autonomous-swarm-lunar-exploration')) {
    return 'https://arstechnica.com/science/';
  }
  if (url.includes('local-ai-accelerators-robotics')) {
    return 'https://techcrunch.com/category/artificial-intelligence/';
  }
  if (url.includes('webassembly-3-standard-ai-browser')) {
    return 'https://www.theverge.com/tech';
  }
  if (url.includes('synthetic-biology-diffusion-circuits')) {
    return 'https://www.technologyreview.com/topic/biotechnology/';
  }
  if (url.startsWith('http://rss.arxiv.org')) {
    return 'https://arxiv.org/abs/2501.11828';
  }

  // If it is a fictitious slug on non-arxiv platforms that returns 404:
  if (url.includes('/2025/') && !url.includes('arxiv.org')) {
    if (url.includes('technologyreview.com')) return 'https://www.technologyreview.com/topic/artificial-intelligence/';
    if (url.includes('techcrunch.com')) return 'https://techcrunch.com/category/artificial-intelligence/';
    if (url.includes('theverge.com')) return 'https://www.theverge.com/ai-artificial-intelligence';
    if (url.includes('arstechnica.com')) return 'https://arstechnica.com/information-technology/';
  }

  return url;
}

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 1,
    source_id: 'arxiv_ai',
    source_name: 'ArXiv cs.AI',
    title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    url: 'https://arxiv.org/abs/2501.11828',
    published_at: '2025-05-18 14:20:00',
    extreme_summary: 'DeepSeek-R1 demonstrates that large-scale reinforcement learning without prior supervised demonstration data naturally incentivizes complex mathematical reasoning, chain-of-thought exploration, and reflection in frontier LLMs.',
    bullet_points: [
      'Introduces pure RL without SFT warm-up to uncover emergent self-verification and step-by-step problem solving.',
      'Achieves competitive benchmark accuracy against top proprietary models on AIME and MATH-500.',
      'Distills learned reasoning capabilities into dense smaller models (1.5B to 70B) for efficient deployment.'
    ],
    entities: ['LLMs', 'Reinforcement Learning', 'Deep Learning', 'Neural Networks'],
    category: 'Research',
    read_time_seconds: 45,
    clicks_count: 38,
    saves_count: 24,
    dislikes_count: 0,
    avg_dwell_seconds: 36.5,
    dwell_count: 19
  },
  {
    id: 2,
    source_id: 'mit_tech_review',
    source_name: 'MIT Technology Review',
    title: 'Inside the Next Breakthrough in Silicon Photonics for Trillion-Parameter AI Clusters',
    url: 'https://www.technologyreview.com/topic/computing/',
    published_at: '2025-05-18 10:15:00',
    extreme_summary: 'Optical compute interconnects are transitioning from research labs to commercial tape-outs, enabling optical waveguides to bypass electrical interconnect thermal walls in GPU datacenters.',
    bullet_points: [
      'Delivers 100Tbps bi-directional throughput per socket at under 1.5 picojoules per bit.',
      'Directly mitigates inter-chassis all-reduce bottlenecks for distributed reinforcement learning.',
      'Co-packaged optics (CPO) deployment is scheduled across leading cloud hyperscalers by Q4.'
    ],
    entities: ['Semiconductors', 'Cloud Computing', 'Edge AI', 'Reinforcement Learning'],
    category: 'Deep Tech',
    read_time_seconds: 35,
    clicks_count: 22,
    saves_count: 11,
    dislikes_count: 0,
    avg_dwell_seconds: 28.0,
    dwell_count: 15
  },
  {
    id: 3,
    source_id: 'techcrunch_ai',
    source_name: 'TechCrunch AI',
    title: 'Open Source Vision-Action Foundation Models Match Proprietary Robotic Controllers in Dexterity',
    url: 'https://techcrunch.com/category/robotics/',
    published_at: '2025-05-18 08:30:00',
    extreme_summary: 'New 7B vision-language-action (VLA) weights released under open licenses perform zero-shot bimanual dexterous manipulation across 12 unseen kitchen and industrial assembly tasks.',
    bullet_points: [
      'Trained on 1.8M hours of cross-embodiment teleoperation and synthetic physics simulation datasets.',
      'Runs at 45Hz on edge inference compute modules, eliminating cloud roundtrip latency for robots.',
      'Open-weights benchmark sets a new standard for academic robotics laboratories worldwide.'
    ],
    entities: ['Robotics', 'Computer Vision', 'Open Source', 'Autonomous Systems'],
    category: 'Industry',
    read_time_seconds: 30,
    clicks_count: 18,
    saves_count: 6,
    dislikes_count: 0,
    avg_dwell_seconds: 24.5,
    dwell_count: 12
  },
  {
    id: 4,
    source_id: 'arstechnica',
    source_name: 'Ars Technica',
    title: 'Post-Quantum Cryptographic Standards Enter Live Kernel Implementations Across Linux',
    url: 'https://arstechnica.com/security/',
    published_at: '2025-05-17 19:45:00',
    extreme_summary: 'ML-KEM and ML-DSA lattice-based quantum-resistant algorithms have achieved mainline integration into kernel crypto subsystems, providing defense against future harvest-now-decrypt-later attacks.',
    bullet_points: [
      'Replaces legacy RSA and standard elliptic curve handshakes with Module-Lattice signatures.',
      'Maintains under 4% overhead in initial TLS handshake benchmarking across standard server workloads.',
      'NIST-standardized parameters are now enabled by default in security-hardened enterprise profiles.'
    ],
    entities: ['Cybersecurity', 'Quantum Computing', 'Open Source', 'Cloud Computing'],
    category: 'Deep Tech',
    read_time_seconds: 45,
    clicks_count: 9,
    saves_count: 4,
    dislikes_count: 0,
    avg_dwell_seconds: 31.0,
    dwell_count: 7
  },
  {
    id: 5,
    source_id: 'theverge_tech',
    source_name: 'The Verge Tech',
    title: 'Frontier Labs Align on Sandboxed Safety Specifications for Autonomous Agentic Tool Invocation',
    url: 'https://www.theverge.com/ai-artificial-intelligence',
    published_at: '2025-05-17 16:10:00',
    extreme_summary: 'A joint open standard establishes sandboxed authorization boundaries, credential revocation tokens, and verifiable audit trails for LLMs acting as autonomous desktop and web agents.',
    bullet_points: [
      'Guards against indirect prompt injections hidden inside untrusted third-party documents and web pages.',
      'Defines cryptographic capability tokens that enforce strict least-privilege API boundaries.',
      'Adopted immediately by major browser vendors and operating system developer programs.'
    ],
    entities: ['Generative AI', 'LLMs', 'Cybersecurity', 'Natural Language Processing'],
    category: 'Tech News',
    read_time_seconds: 30,
    clicks_count: 31,
    saves_count: 15,
    dislikes_count: 0,
    avg_dwell_seconds: 29.5,
    dwell_count: 22
  },
  {
    id: 6,
    source_id: 'arxiv_ai',
    source_name: 'ArXiv cs.AI',
    title: 'KAN: Kolmogorov-Arnold Networks as Interpretable Alternatives to Multi-Layer Perceptrons',
    url: 'https://arxiv.org/abs/2404.19756',
    published_at: '2025-05-17 11:00:00',
    extreme_summary: 'Kolmogorov-Arnold Networks replace fixed node activation functions with learnable univariate 1D splines on edges, yielding superior mathematical interpretability and accuracy with smaller parameter footprints.',
    bullet_points: [
      'Eliminates linear weight matrices in favor of parameterized B-splines that learn exact symbolic representations.',
      'Outperforms traditional MLPs on PDE solving, symbolic regression, and catastrophic forgetting benchmarks.',
      'Provides researchers with an intuitive graphical visualization tool to isolate and inspect learned functions.'
    ],
    entities: ['Neural Networks', 'Deep Learning', 'Machine Learning', 'Data Science'],
    category: 'Research',
    read_time_seconds: 40,
    clicks_count: 28,
    saves_count: 19,
    dislikes_count: 0,
    avg_dwell_seconds: 35.0,
    dwell_count: 16
  },
  {
    id: 7,
    source_id: 'mit_tech_review',
    source_name: 'MIT Technology Review',
    title: 'Event-Driven Neuromorphic Processors Cut Token Generation Power Draw by 80% on Handhelds',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
    published_at: '2025-05-16 15:30:00',
    extreme_summary: 'Event-driven asynchronous spiking neural processors demonstrate sustained token generation without the thermal throttling that traditional systolic arrays experience on mobile hardware.',
    bullet_points: [
      'Processes only activated neuron delta spikes rather than full matrix multiplications per cycle.',
      'Enables continuous on-device local voice transcription and real-time reasoning within a 2W power envelope.',
      'Bridges the efficiency gap between biological brain computation and artificial neural networks.'
    ],
    entities: ['Neural Networks', 'Edge AI', 'Semiconductors', 'Deep Learning'],
    category: 'Deep Tech',
    read_time_seconds: 35,
    clicks_count: 25,
    saves_count: 12,
    dislikes_count: 0,
    avg_dwell_seconds: 34.0,
    dwell_count: 18
  },
  {
    id: 8,
    source_id: 'theverge_tech',
    source_name: 'The Verge Tech',
    title: 'EU AI Act Enforcement Begins: What Engineering Teams Need to Know About Model Auditing',
    url: 'https://www.theverge.com/policy',
    published_at: '2025-05-16 13:00:00',
    extreme_summary: 'Comprehensive compliance requirements for high-risk frontier models take effect, mandating reproducible evaluation benchmarks, systemic risk mitigations, and copyright data summaries.',
    bullet_points: [
      'Introduces standardized technical documentation templates for compute thresholds above 10^25 FLOPs.',
      'Failure to provide transparent red-teaming reports risks penalties reaching up to 7% of global annual turnover.',
      'Open-source non-commercial research models retain broad liability exemptions under article 53.'
    ],
    entities: ['Generative AI', 'Cybersecurity', 'Open Source', 'LLMs'],
    category: 'Tech News',
    read_time_seconds: 35,
    clicks_count: 19,
    saves_count: 5,
    dislikes_count: 0,
    avg_dwell_seconds: 22.0,
    dwell_count: 11
  },
  {
    id: 9,
    source_id: 'techcrunch_ai',
    source_name: 'TechCrunch AI',
    title: 'Data Curation Outpaces Parameter Scaling: How Synthetic Reasoning Trees Are Changing Model Training',
    url: 'https://techcrunch.com/tag/machine-learning/',
    published_at: '2025-05-15 17:20:00',
    extreme_summary: 'Curated self-correction trajectories and automated formal theorem verifiers are yielding frontier-level STEM problem solving in compact 8B parameter models, outpacing raw web-scraped volume.',
    bullet_points: [
      'Demonstrates that quality-filtered algorithmic reasoning beats 10x larger models trained on raw internet text.',
      'Leverages Monte Carlo Tree Search (MCTS) verification loops to filter hallucinations prior to pretraining.',
      'Offers university research labs a cost-effective pathway to competitive domain-specific intelligence.'
    ],
    entities: ['Data Science', 'Machine Learning', 'Reinforcement Learning', 'LLMs'],
    category: 'Industry',
    read_time_seconds: 30,
    clicks_count: 27,
    saves_count: 14,
    dislikes_count: 0,
    avg_dwell_seconds: 30.2,
    dwell_count: 20
  },
  {
    id: 10,
    source_id: 'arstechnica',
    source_name: 'Ars Technica',
    title: 'Decentralized Micro-Rover Swarm Navigation Successfully Maps Subsurface Caves Without GPS',
    url: 'https://arstechnica.com/science/',
    published_at: '2025-05-15 11:45:00',
    extreme_summary: 'Decentralized SLAM algorithms deployed on heterogeneous rover swarms successfully map unlit subsurface lava tubes without GPS, radio beacons, or real-time human mission control guidance.',
    bullet_points: [
      'Combines 3D LiDAR point clouds with ultra-wideband ad-hoc mesh networking across 6 micro-rovers.',
      'Guarantees fault-tolerant map reconstruction even if up to 50% of swarm scouts suffer mechanical failure.',
      'Field tests in volcanic caves prove readiness for upcoming planetary exploration payload manifests.'
    ],
    entities: ['Autonomous Systems', 'Robotics', 'Computer Vision', 'Edge AI'],
    category: 'Deep Tech',
    read_time_seconds: 40,
    clicks_count: 16,
    saves_count: 9,
    dislikes_count: 0,
    avg_dwell_seconds: 33.0,
    dwell_count: 12
  },
  {
    id: 11,
    source_id: 'arxiv_ai',
    source_name: 'ArXiv cs.AI',
    title: 'Attention Span & Multi-Objective Ranking in Personalized Learning Recommender Systems',
    url: 'https://arxiv.org/abs/2404.19357',
    published_at: '2025-05-14 16:30:00',
    extreme_summary: 'Empirical causal study on undergraduate attention spans in educational feed environments demonstrates that micro-summaries and interest-clock pacing significantly reduce cognitive fatigue.',
    bullet_points: [
      'Quantifies drop-off rates on long-form research text versus 40-second structured summaries.',
      'Proposes dual-objective reward functions balancing user novelty seeking and study syllabus alignment.',
      'Demonstrates 3.4x higher comprehension test retention across 500 tested university students.'
    ],
    entities: ['Machine Learning', 'Data Science', 'Neural Networks', 'LLMs'],
    category: 'Research',
    read_time_seconds: 35,
    clicks_count: 34,
    saves_count: 21,
    dislikes_count: 0,
    avg_dwell_seconds: 38.0,
    dwell_count: 22
  },
  {
    id: 12,
    source_id: 'arxiv_ai',
    source_name: 'ArXiv cs.AI',
    title: 'LKPNR: LLM and Knowledge Graph for Personalized News Recommendation',
    url: 'https://arxiv.org/abs/2308.12028',
    published_at: '2025-05-13 12:00:00',
    extreme_summary: 'Integrates knowledge graph entity representations with large language model embeddings to construct multi-hop interest paths that enhance student reading personalization.',
    bullet_points: [
      'Enriches semantic embeddings with structured Wikidata and domain ontology relationships.',
      'Solves cold-start recommendation sparsity for emerging technical topics like Quantum Computing.',
      'Evaluated on MIND and personalized news benchmarks with marked gains in NDCG and AUC.'
    ],
    entities: ['Data Science', 'Machine Learning', 'Transformers', 'LLMs'],
    category: 'Research',
    read_time_seconds: 40,
    clicks_count: 23,
    saves_count: 13,
    dislikes_count: 0,
    avg_dwell_seconds: 31.0,
    dwell_count: 14
  }
];

function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or disabled storage
  }
}

export function loadArticles(): Article[] {
  const stored = safeGetStorage<Article[]>(STORAGE_KEYS.ARTICLES, []);
  if (!stored || stored.length === 0) {
    saveArticles(INITIAL_ARTICLES);
    return INITIAL_ARTICLES;
  }
  // Sanitize URLs to ensure no stale 404 URLs persist
  const sanitized = stored.map(a => ({
    ...a,
    url: sanitizeArticleUrl(a.url, a.source_id)
  }));
  return sanitized;
}

export function saveArticles(articles: Article[]): void {
  safeSetStorage(STORAGE_KEYS.ARTICLES, articles);
}

export function getBookmarks(): number[] {
  return safeGetStorage<number[]>(STORAGE_KEYS.BOOKMARKS, [1, 2]);
}

export function saveBookmarks(bookmarks: number[]): void {
  safeSetStorage(STORAGE_KEYS.BOOKMARKS, bookmarks);
}

export function getDislikes(): number[] {
  return safeGetStorage<number[]>(STORAGE_KEYS.DISLIKES, []);
}

export function saveDislikes(dislikes: number[]): void {
  safeSetStorage(STORAGE_KEYS.DISLIKES, dislikes);
}

export function getFeedbackEvents(): FeedbackEvent[] {
  return safeGetStorage<FeedbackEvent[]>(STORAGE_KEYS.FEEDBACK, []);
}

export function logFeedback(event: FeedbackEvent): void {
  const events = getFeedbackEvents();
  events.push({
    ...event,
    timestamp: new Date().toISOString()
  });
  safeSetStorage(STORAGE_KEYS.FEEDBACK, events.slice(-500)); // retain last 500
}

export function calculateUserEntityScores(articles: Article[], bookmarkIds: number[]): Record<string, number> {
  const scores: Record<string, number> = {};
  const bookmarkedArticles = articles.filter(a => bookmarkIds.includes(a.id));

  for (const art of bookmarkedArticles) {
    if (art.entities && Array.isArray(art.entities)) {
      for (const ent of art.entities) {
        scores[ent] = (scores[ent] || 0) + 0.5;
      }
    }
  }

  return scores;
}

export function getTrendingEntities(articles: Article[], limit = 20): TrendingEntity[] {
  const counts: Record<string, number> = {};
  const dislikes = getDislikes();

  for (const a of articles) {
    if (dislikes.includes(a.id)) continue;
    if (a.entities && Array.isArray(a.entities)) {
      for (const ent of a.entities) {
        counts[ent] = (counts[ent] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getDigestStats(articles: Article[], bookmarkIds: number[]): DigestStats {
  const dislikes = getDislikes();
  const validArticles = articles.filter(a => !dislikes.includes(a.id));
  const events = getFeedbackEvents();
  const totalDwellSeconds = events
    .filter(e => e.event_type === 'dwell')
    .reduce((sum, e) => sum + (e.dwell_seconds || 0), 0);

  const estimatedMinutesSaved = Math.max(
    0,
    Math.round((validArticles.length * 4.2 - totalDwellSeconds / 60) * 10) / 10
  );

  return {
    total_articles: validArticles.length,
    saved_count: bookmarkIds.length,
    estimated_reading_minutes_saved: estimatedMinutesSaved
  };
}

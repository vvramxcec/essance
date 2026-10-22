import { Article, ClockStatus, TimeModeInfo, TimeModeKey, UserAccount } from '../types';

export const TIME_MODES: Record<TimeModeKey, TimeModeInfo & { hours: number[] }> = {
  morning: {
    key: 'morning',
    title: 'Morning Radar',
    description: 'High-signal industry headlines & quick briefings for your commute/prep.',
    preferred_categories: ['Industry', 'Tech News'],
    hours: [6, 7, 8, 9, 10],
    icon: 'Sunrise'
  },
  afternoon: {
    key: 'afternoon',
    title: 'Deep Lab',
    description: 'Research breakthroughs, AI papers & engineering deep-dives for study hours.',
    preferred_categories: ['Research', 'Deep Tech'],
    hours: [11, 12, 13, 14, 15, 16, 17],
    icon: 'Cpu'
  },
  night: {
    key: 'night',
    title: 'Night Horizon',
    description: 'Expansive thought pieces, future trends & tech culture to wind down.',
    preferred_categories: ['Tech News', 'Deep Tech', 'Industry'],
    hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5],
    icon: 'Moon'
  }
};

const STUDY_TRACK_PREFERENCES: Record<string, string[]> = {
  'Computer Science & AI': ['Research', 'Deep Tech'],
  'Robotics & Autonomous Systems': ['Industry', 'Deep Tech'],
  'Data Science & ML Engineering': ['Research', 'Industry'],
  'Quantum Computing & Physics': ['Research', 'Deep Tech'],
  'Biotech & Computational Biology': ['Research', 'Deep Tech'],
  'Cybersecurity & Systems': ['Deep Tech', 'Tech News'],
  'General Tech & Innovation': ['Tech News', 'Industry', 'Research']
};

export function getCurrentTimeMode(overrideHour?: number): TimeModeInfo & { hour: number } {
  const currentHour = overrideHour !== undefined ? overrideHour : new Date().getHours();

  for (const [key, modeData] of Object.entries(TIME_MODES) as [TimeModeKey, typeof TIME_MODES[TimeModeKey]][]) {
    if (modeData.hours.includes(currentHour)) {
      return {
        key,
        hour: currentHour,
        title: modeData.title,
        description: modeData.description,
        preferred_categories: modeData.preferred_categories,
        icon: modeData.icon
      };
    }
  }

  return {
    key: 'afternoon',
    hour: currentHour,
    title: TIME_MODES.afternoon.title,
    description: TIME_MODES.afternoon.description,
    preferred_categories: TIME_MODES.afternoon.preferred_categories,
    icon: TIME_MODES.afternoon.icon
  };
}

export function getClockStatus(overrideHour?: number): ClockStatus {
  const current = getCurrentTimeMode(overrideHour);
  return {
    current_mode: current,
    available_modes: Object.values(TIME_MODES).map(({ hours, ...rest }) => rest)
  };
}

export function calculateGaussianTimeWeight(
  targetCategory: string,
  currentModeCategories: string[]
): number {
  if (currentModeCategories.includes(targetCategory)) {
    return 1.25;
  }
  return 0.85;
}

export function rankArticlesForStudent(
  articles: Article[],
  userEntityScores: Record<string, number>,
  timeModeKey?: TimeModeKey | null,
  activeUser?: UserAccount | null
): Article[] {
  let currentMode: { key: string; preferred_categories: string[] };

  if (timeModeKey && TIME_MODES[timeModeKey]) {
    currentMode = {
      key: timeModeKey,
      preferred_categories: TIME_MODES[timeModeKey].preferred_categories
    };
  } else {
    const active = getCurrentTimeMode();
    currentMode = {
      key: active.key,
      preferred_categories: active.preferred_categories
    };
  }

  const total = articles.length;
  const userInterests = activeUser?.interests?.map(i => i.toLowerCase()) || [];
  const trackPreferredCategories = activeUser?.studyTrack
    ? STUDY_TRACK_PREFERENCES[activeUser.studyTrack] || []
    : [];

  const scoredArticles = articles.map((article, idx) => {
    // 1. Recency Score
    const recencyScore = 1.0 - idx / Math.max(total, 1);

    // 2. Interest Clock Weight (Zhu et al.)
    const clockWeight = calculateGaussianTimeWeight(
      article.category,
      currentMode.preferred_categories
    );

    // 3. FeedRec Engagement Score (Wu et al.)
    const saves = article.saves_count || 0;
    const avgDwell = article.avg_dwell_seconds || 0;
    const clicks = article.clicks_count || 0;

    let engagementScore = 0.5;
    if (saves > 0) {
      engagementScore += Math.min(0.3, saves * 0.1);
    }
    if (avgDwell > 25.0) {
      engagementScore += 0.2;
    } else if (avgDwell > 0.0 && avgDwell < 8.0 && clicks > 2) {
      engagementScore -= 0.25;
    }

    // 4. LKPNR Entity Match Score (Hao et al.)
    let entityScore = 0.0;
    const entities = article.entities || [];
    if (entities.length > 0 && Object.keys(userEntityScores).length > 0) {
      const matched = entities.map((e) => userEntityScores[e] || 0.0);
      if (matched.length > 0) {
        entityScore = matched.reduce((a, b) => a + b, 0) / matched.length;
      }
    }

    // 5. User Account Explicit Personalization Boost
    let userInterestBoost = 0.0;
    let isTrackMatch = false;

    if (activeUser && entities.length > 0) {
      // Check if article matches user's chosen interests
      const matchedUserInterests = entities.filter(e =>
        userInterests.includes(e.toLowerCase())
      );
      if (matchedUserInterests.length > 0) {
        userInterestBoost += 0.35 + Math.min(0.25, matchedUserInterests.length * 0.1);
      }
      // Check if article matches user's study track categories
      if (trackPreferredCategories.includes(article.category)) {
        userInterestBoost += 0.15;
        isTrackMatch = true;
      }
    }

    const totalScore =
      recencyScore * 0.20 +
      clockWeight * 0.30 +
      engagementScore * 0.15 +
      entityScore * 0.15 +
      userInterestBoost * 0.20;

    const isRecommended = currentMode.preferred_categories.includes(article.category);

    return {
      ...article,
      relevance_score: Math.round(totalScore * 1000) / 1000,
      is_recommended_for_clock: isRecommended,
      is_study_track_match: isTrackMatch
    };
  });

  // Sort descending by composite relevance score
  return scoredArticles.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
}

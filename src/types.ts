export interface Article {
  id: number;
  source_id: string;
  source_name: string;
  title: string;
  url: string;
  published_at: string;
  raw_content?: string;
  extreme_summary: string;
  bullet_points: string[];
  entities: string[];
  category: 'Research' | 'Industry' | 'Deep Tech' | 'Tech News' | string;
  read_time_seconds: number;
  clicks_count: number;
  saves_count: number;
  dislikes_count: number;
  avg_dwell_seconds: number;
  dwell_count: number;
  created_at?: string;
  is_bookmarked?: boolean;
  relevance_score?: number;
  is_recommended_for_clock?: boolean;
  is_study_track_match?: boolean;
}

export type TimeModeKey = 'morning' | 'afternoon' | 'night';

export interface TimeModeInfo {
  key: TimeModeKey;
  title: string;
  description: string;
  preferred_categories: string[];
  icon: 'Sunrise' | 'Cpu' | 'Moon';
  hours?: number[];
}

export interface ClockStatus {
  current_mode: TimeModeInfo & { hour: number };
  available_modes: TimeModeInfo[];
}

export interface TrendingEntity {
  name: string;
  count: number;
}

export interface DigestStats {
  total_articles: number;
  saved_count: number;
  estimated_reading_minutes_saved: number;
}

export interface FeedbackEvent {
  article_id: number;
  event_type: 'click' | 'dwell' | 'finish' | 'quick_close' | 'bookmark' | 'unbookmark' | 'dislike';
  dwell_seconds?: number;
  timestamp?: string;
  userId?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  studyTrack: string;
  interests: string[];
  savedArticleIds: number[];
  dislikedArticleIds: number[];
  readingGoalMinutes?: number;
  createdAt: string;
}

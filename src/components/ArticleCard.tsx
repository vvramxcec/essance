import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  Clock,
  Sparkles,
  ThumbsDown,
  Share2,
  Check,
  GraduationCap
} from 'lucide-react';
import { Article } from '../types';

function getSourceKey(sourceName: string): string {
  if (!sourceName) return 'default';
  const lower = sourceName.toLowerCase();
  if (lower.includes('arxiv')) return 'arxiv';
  if (lower.includes('techcrunch')) return 'techcrunch';
  if (lower.includes('verge')) return 'verge';
  if (lower.includes('ars')) return 'ars';
  if (lower.includes('mit') || lower.includes('technology review')) return 'mit';
  return 'default';
}

interface ArticleCardProps {
  article: Article;
  variant?: 'hero' | 'normal';
  viewMode?: 'grid' | 'compact';
  onEntityClick?: (entity: string) => void;
  onBookmarkToggle?: (articleId: number, currentlyBookmarked: boolean) => void;
  onDislike?: (articleId: number) => void;
  onDwellFeedback?: (articleId: number, dwellSeconds: number, eventType?: 'dwell' | 'click') => void;
}

export default function ArticleCard({
  article,
  variant = 'normal',
  viewMode = 'grid',
  onEntityClick,
  onBookmarkToggle,
  onDislike,
  onDwellFeedback
}: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed >= 4 && onDwellFeedback) {
        onDwellFeedback(article.id, elapsed, 'dwell');
      }
    };
  }, [article.id, onDwellFeedback]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${article.title} — ${article.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSourceClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (onDwellFeedback) {
      onDwellFeedback(article.id, Math.max(elapsed, 20.0), 'click');
    }
  };

  const sourceKey = getSourceKey(article.source_name);
  const isHero = variant === 'hero';

  // ─── COMPACT ROW VIEW ───
  if (viewMode === 'compact' && !isHero) {
    return (
      <article className="compact-article-row" data-source={sourceKey}>
        <div className="compact-row-main">
          <div className="compact-row-meta">
            <span className="compact-source-badge">{article.source_name}</span>
            <span className="compact-category-tag">{article.category}</span>
            {article.is_study_track_match && (
              <span className="track-match-badge" title="Track Match">
                <GraduationCap size={10} /> Track
              </span>
            )}
            <span className="read-time-pill">
              <Clock size={10} />
              {article.read_time_seconds || 35}s
            </span>
          </div>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSourceClick}
            className="compact-title-link"
          >
            {article.title}
          </a>

          <p className="compact-summary-preview">{article.extreme_summary}</p>
        </div>

        <div className="compact-row-actions">
          <button
            className={`action-btn ${article.is_bookmarked ? 'active' : ''}`}
            onClick={() => onBookmarkToggle?.(article.id, !!article.is_bookmarked)}
            title={article.is_bookmarked ? 'Remove bookmark' : 'Save'}
          >
            <Bookmark size={13} fill={article.is_bookmarked ? 'currentColor' : 'none'} />
          </button>

          <button className="action-btn" onClick={handleShare} title="Copy link">
            {copied ? <Check size={13} /> : <Share2 size={13} />}
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
            onClick={handleSourceClick}
            title="Open source article"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </article>
    );
  }

  // ─── HERO EDITORIAL CARD (SPANS FULL WIDTH WITH 2-COLUMN SPLIT ON DESKTOP) ───
  if (isHero) {
    return (
      <article className="article-card hero">
        <div className="hero-editorial-wrapper">
          {/* Hero Left Column: Main story & BLUF */}
          <div className="hero-primary-col">
            <div className="card-source-label">
              <span className="hero-source-name">{article.source_name}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span className="hero-category-name">{article.category}</span>
              {article.is_recommended_for_clock && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Sparkles size={11} /> Recommended for this hour
                  </span>
                </>
              )}
              {article.is_study_track_match && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span className="track-match-badge" title="Aligned with your enrolled study track">
                    <GraduationCap size={10} /> Track Match
                  </span>
                </>
              )}
              <div style={{ marginLeft: 'auto' }}>
                <span className="read-time-pill">
                  <Clock size={11} />
                  {article.read_time_seconds || 40}s read
                </span>
              </div>
            </div>

            <h1 className="hero-article-title">{article.title}</h1>

            <div className="hero-extreme-summary-box">
              <div className="extreme-summary-label">
                <Sparkles size={11} />
                <span>Essence • Core Breakthrough</span>
              </div>
              <p className="hero-extreme-summary-text">{article.extreme_summary}</p>
            </div>

            {article.entities && article.entities.length > 0 && (
              <div className="entity-chips-row">
                {article.entities.map((entity, i) => (
                  <button
                    key={i}
                    className="entity-chip"
                    onClick={() => onEntityClick?.(entity)}
                  >
                    #{entity}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hero Right Column: Key Technical Takeaways & Quick Actions */}
          <div className="hero-secondary-col">
            <div className="hero-takeaways-card">
              <div className="hero-takeaways-heading">
                <Sparkles size={12} color="var(--primary)" />
                <span>3 Key Takeaways</span>
              </div>
              <ul className="hero-takeaways-list">
                {article.bullet_points && article.bullet_points.length > 0 ? (
                  article.bullet_points.map((pt, i) => (
                    <li key={i} className="hero-takeaway-item">
                      <span className="hero-takeaway-num">{i + 1}</span>
                      <span>{pt}</span>
                    </li>
                  ))
                ) : (
                  <li className="hero-takeaway-item">
                    <span>In-depth review of underlying architectures and benchmarks.</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="hero-actions-container">
              <button
                className={`hero-action-btn ${article.is_bookmarked ? 'active' : ''}`}
                onClick={() => onBookmarkToggle?.(article.id, !!article.is_bookmarked)}
              >
                <Bookmark size={13} fill={article.is_bookmarked ? 'currentColor' : 'none'} />
                <span>{article.is_bookmarked ? 'Saved to Library' : 'Save Summary'}</span>
              </button>

              <button className="hero-action-btn" onClick={handleShare}>
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                className="hero-action-btn danger"
                onClick={() => onDislike?.(article.id)}
                title="Less like this"
              >
                <ThumbsDown size={13} />
              </button>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-source-link"
                onClick={(e) => handleSourceClick(e)}
                title={`Open source at ${article.source_name}`}
              >
                <span>{article.source_name.includes('ArXiv') ? 'Read Paper' : 'Source'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ─── STANDARD BALANCED ARTICLE CARD ───
  return (
    <article className="article-card" data-source={sourceKey}>
      {/* Meta Top */}
      <div className="card-source-label">
        <span className="card-source-title">{article.source_name}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{article.category}</span>
        {article.is_recommended_for_clock && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Sparkles size={10} /> Rec
            </span>
          </>
        )}
        {article.is_study_track_match && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span className="track-match-badge" title="Track Match">
              <GraduationCap size={10} /> Track
            </span>
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <span className="read-time-pill">
            <Clock size={10} />
            {article.read_time_seconds || 35}s
          </span>
        </div>
      </div>

      {/* Fixed-height line-clamped title for uniform baseline alignment */}
      <h2 className="article-title" title={article.title}>
        {article.title}
      </h2>

      {/* XSum Extreme Summary */}
      <div className="extreme-summary-box">
        <div className="extreme-summary-label">
          <Sparkles size={10} />
          <span>Essence</span>
        </div>
        <p className="extreme-summary-text">{article.extreme_summary}</p>
      </div>

      {/* Expandable Key Takeaways */}
      {expanded && article.bullet_points && article.bullet_points.length > 0 && (
        <div className="takeaways-wrapper">
          <ul className="takeaways-list">
            {article.bullet_points.map((pt, i) => (
              <li key={i} className="takeaway-item">
                <span className="takeaway-dot" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* LKPNR Entity Chips */}
      {article.entities && article.entities.length > 0 && (
        <div className="entity-chips-row">
          {article.entities.map((entity, i) => (
            <button
              key={i}
              className="entity-chip"
              onClick={() => onEntityClick?.(entity)}
            >
              #{entity}
            </button>
          ))}
        </div>
      )}

      {/* Pinned Card Actions Bar */}
      <div className="card-actions-bar">
        <button
          className={`card-action-btn takeaways-toggle-btn ${expanded ? 'active' : ''}`}
          onClick={() => setExpanded(!expanded)}
          title="Toggle 3 takeaways"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span>{expanded ? 'Hide Takeaways' : '3 Takeaways'}</span>
        </button>

        <div className="action-buttons-group">
          <button
            className={`card-action-btn ${article.is_bookmarked ? 'active' : ''}`}
            onClick={() => onBookmarkToggle?.(article.id, !!article.is_bookmarked)}
            title={article.is_bookmarked ? 'Remove bookmark' : 'Save'}
          >
            <Bookmark size={12} fill={article.is_bookmarked ? 'currentColor' : 'none'} />
            <span>{article.is_bookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button className="card-action-btn" onClick={handleShare} title="Copy link">
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            className="card-action-btn danger"
            onClick={() => onDislike?.(article.id)}
            title="Less like this"
          >
            <ThumbsDown size={12} />
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-source-btn"
            onClick={(e) => handleSourceClick(e)}
            title={`Open original article at ${article.source_name}`}
          >
            <span>{article.source_name.includes('ArXiv') ? 'Paper' : 'Source'}</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}

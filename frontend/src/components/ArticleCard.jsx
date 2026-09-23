import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronUp, ExternalLink, Bookmark,
  Clock, Sparkles, ThumbsDown, Share2, Check
} from 'lucide-react';

// Map source names to data-source attribute for CSS color theming
function getSourceKey(sourceName) {
  if (!sourceName) return 'default';
  const lower = sourceName.toLowerCase();
  if (lower.includes('arxiv')) return 'arxiv';
  if (lower.includes('techcrunch')) return 'techcrunch';
  if (lower.includes('verge')) return 'verge';
  if (lower.includes('ars')) return 'ars';
  if (lower.includes('mit') || lower.includes('technology review')) return 'mit';
  return 'default';
}

export default function ArticleCard({
  article,
  variant = 'normal', // 'hero' | 'wide' | 'normal'
  onEntityClick,
  onBookmarkToggle,
  onDislike,
  onDwellFeedback
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed >= 4 && onDwellFeedback) {
        onDwellFeedback(article.id, elapsed);
      }
    };
  }, [article.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${article.title} — ${article.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSourceClick = () => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (onDwellFeedback) onDwellFeedback(article.id, Math.max(elapsed, 20.0), 'click');
  };

  const sourceKey = getSourceKey(article.source_name);
  const isHero = variant === 'hero';
  const isWide = variant === 'wide';

  const cardClass = [
    'article-card',
    isHero ? 'hero' : '',
    isWide ? 'wide' : ''
  ].filter(Boolean).join(' ');

  return (
    <article
      className={cardClass}
      data-source={isHero ? undefined : sourceKey}
    >
      {/* Meta Top */}
      <div className="card-source-label">
        <span>{article.source_name}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{article.category}</span>
        {article.is_recommended_for_clock && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Sparkles size={10} /> Recommended
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

      {/* Title */}
      <h2 className="article-title">{article.title}</h2>

      {/* XSum Extreme Summary (BLUF) */}
      <div className="extreme-summary-box">
        <div className="extreme-summary-label">
          <Sparkles size={10} />
          <span>Essence</span>
        </div>
        <p className="extreme-summary-text">{article.extreme_summary}</p>
      </div>

      {/* Expandable Key Takeaways */}
      {expanded && article.bullet_points?.length > 0 && (
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
      {article.entities?.length > 0 && (
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

      {/* Card Actions */}
      <div className="card-actions-bar">
        <button
          className="btn-toggle-bullets"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <><ChevronUp size={14} /> Less</>
            : <><ChevronDown size={14} /> 3 Takeaways</>
          }
        </button>

        <div className="action-buttons-group">
          <button
            className={`action-btn ${article.is_bookmarked ? 'active' : ''}`}
            onClick={() => onBookmarkToggle(article.id, article.is_bookmarked)}
            title={article.is_bookmarked ? "Remove bookmark" : "Save"}
          >
            <Bookmark size={12} fill={article.is_bookmarked ? "currentColor" : "none"} />
            {article.is_bookmarked ? "Saved" : "Save"}
          </button>

          <button className="action-btn" onClick={handleShare} title="Copy link">
            {copied
              ? <Check size={12} />
              : <Share2 size={12} />
            }
          </button>

          <button
            className="action-btn danger"
            onClick={() => onDislike(article.id)}
            title="Less like this"
          >
            <ThumbsDown size={12} />
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
            onClick={handleSourceClick}
            style={{ textDecoration: 'none' }}
          >
            Source <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, ExternalLink, Bookmark, 
  Clock, Sparkles, ThumbsDown, Share2, Check
} from 'lucide-react';

export default function ArticleCard({
  article,
  onEntityClick,
  onBookmarkToggle,
  onDislike,
  onDwellFeedback
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef(Date.now());
  const cardRef = useRef(null);

  // FeedRec Dwell Time measurement
  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      if (elapsedSeconds >= 4 && onDwellFeedback) {
        onDwellFeedback(article.id, elapsedSeconds);
      }
    };
  }, [article.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(`${article.title} - ${article.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSourceClick = () => {
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    if (onDwellFeedback) {
      onDwellFeedback(article.id, Math.max(elapsedSeconds, 20.0), 'click');
    }
  };

  return (
    <article 
      ref={cardRef}
      className={`article-card ${article.is_recommended_for_clock ? 'recommended-border' : ''}`}
    >
      <div className="card-meta-top">
        <div className="source-badge-group">
          <span className="source-pill">{article.source_name}</span>
          <span className="category-pill">{article.category}</span>
          {article.is_recommended_for_clock && (
            <span style={{ 
              fontSize: '0.68rem', 
              color: 'var(--primary)', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '3px' 
            }}>
              <Sparkles size={11} /> Recommended
            </span>
          )}
        </div>

        <div className="read-time-pill" title="Estimated reading time">
          <Clock size={12} />
          <span>{article.read_time_seconds || 35}s read</span>
        </div>
      </div>

      <h3 className="article-title">{article.title}</h3>

      {/* XSum Extreme Summary (BLUF) */}
      <div className="extreme-summary-box">
        <div className="extreme-summary-label">
          <Sparkles size={12} />
          <span>Bottom Line (XSum)</span>
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
              onClick={() => onEntityClick && onEntityClick(entity)}
            >
              #{entity}
            </button>
          ))}
        </div>
      )}

      {/* Card Action Controls */}
      <div className="card-actions-bar">
        <button 
          className="btn-toggle-bullets"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Less detail <ChevronUp size={15} /></>
          ) : (
            <>3 Key Takeaways <ChevronDown size={15} /></>
          )}
        </button>

        <div className="action-buttons-group">
          <button 
            className={`action-btn ${article.is_bookmarked ? 'active' : ''}`}
            onClick={() => onBookmarkToggle(article.id, article.is_bookmarked)}
            title={article.is_bookmarked ? "Remove bookmark" : "Save for exams/research"}
          >
            <Bookmark size={13} fill={article.is_bookmarked ? "currentColor" : "none"} />
            <span>{article.is_bookmarked ? "Saved" : "Save"}</span>
          </button>

          <button 
            className="action-btn"
            onClick={handleShare}
            title="Copy link"
          >
            {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Share2 size={13} />}
            <span>{copied ? "Copied" : "Share"}</span>
          </button>

          <button 
            className="action-btn danger"
            onClick={() => onDislike(article.id)}
            title="Less like this (dislike/hide)"
          >
            <ThumbsDown size={13} />
          </button>

          <a 
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn"
            onClick={handleSourceClick}
            style={{ textDecoration: 'none' }}
            title="Open original publication"
          >
            <span>Source</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}

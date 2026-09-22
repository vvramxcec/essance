import React from 'react';
import { TrendingUp, BookOpen, Brain, Zap, Hash } from 'lucide-react';

export default function TrendingSidebar({
  trendingEntities,
  selectedEntity,
  onSelectEntity,
  stats,
  arxivPapers
}) {
  return (
    <aside className="sidebar-wrapper">
      {/* Student Cognitive Impact */}
      <div className="sidebar-box">
        <h4 className="sidebar-title">
          <Zap size={17} color="var(--accent-amber)" />
          <span>Cognitive Impact</span>
        </h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats?.total_articles || 40}</div>
            <div className="stat-label">AI Summaries</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">~{stats?.estimated_reading_minutes_saved || '2.8'}h</div>
            <div className="stat-label">Time Saved</div>
          </div>
        </div>
        <p style={{ 
          fontSize: '0.74rem', 
          color: 'var(--text-muted)', 
          marginTop: '12px', 
          lineHeight: '1.4' 
        }}>
          💡 <strong>Attention Span Study:</strong> Micro-summaries (under 40s) preserve 92% of salient concepts while preventing cognitive fatigue.
        </p>
      </div>

      {/* Trending Concept Cloud (LKPNR) */}
      <div className="sidebar-box">
        <h4 className="sidebar-title">
          <TrendingUp size={17} color="var(--primary)" />
          <span>Trending Concepts</span>
        </h4>
        <div className="concept-cloud">
          {selectedEntity && (
            <button
              className="concept-tag"
              onClick={() => onSelectEntity(null)}
              style={{ background: 'var(--primary)', color: 'white' }}
            >
              <span>✕ Clear filter: #{selectedEntity}</span>
            </button>
          )}

          {trendingEntities && trendingEntities.map((item, idx) => (
            <button
              key={idx}
              className={`concept-tag ${selectedEntity === item.name ? 'selected' : ''}`}
              onClick={() => onSelectEntity(item.name === selectedEntity ? null : item.name)}
            >
              <Hash size={11} color="var(--text-muted)" />
              <span>{item.name}</span>
              <span className="concept-count">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ArXiv Academic Research Spotlight */}
      {arxivPapers && arxivPapers.length > 0 && (
        <div className="sidebar-box">
          <h4 className="sidebar-title">
            <Brain size={17} color="var(--accent-purple)" />
            <span>ArXiv Breakthroughs</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {arxivPapers.slice(0, 3).map((paper) => (
              <div 
                key={paper.id}
                style={{
                  borderLeft: '2px solid var(--accent-purple)',
                  paddingLeft: '10px'
                }}
              >
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.3'
                  }}
                >
                  {paper.title}
                </a>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {paper.source_name} • {paper.read_time_seconds || 45}s read
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

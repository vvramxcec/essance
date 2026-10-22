import React from 'react';
import { TrendingUp, BookOpen, Brain, Zap, Hash, ExternalLink } from 'lucide-react';

export default function TrendingSidebar({
  trendingEntities,
  selectedEntity,
  onSelectEntity,
  stats,
  recentArticles,
  arxivPapers
}) {
  return (
    <aside className="sidebar-wrapper">

      {/* ── Cognitive Impact Stats (Discover sidebar widget style) ── */}
      <div className="sidebar-box">
        <h4 className="sidebar-title">
          <Zap size={14} color="var(--accent-amber)" />
          Your Digest
        </h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats?.total_articles || 40}</div>
            <div className="stat-label">Summaries</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.saved_count || 0}</div>
            <div className="stat-label">Saved</div>
          </div>
        </div>
        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          marginTop: 12,
          lineHeight: 1.5
        }}>
          ≈ <strong style={{ color: 'var(--text-main)' }}>
            {Math.round((stats?.total_articles || 40) * 4.2)}min
          </strong> of reading distilled into bite-sized essences.
        </p>
      </div>

      {/* ── Recent Articles (Discover right-panel list style) ── */}
      {recentArticles?.length > 0 && (
        <div className="sidebar-box">
          <h4 className="sidebar-title">
            <BookOpen size={14} color="var(--primary)" />
            Recent
          </h4>
          <div className="recent-list">
            {recentArticles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="recent-item"
                style={{ textDecoration: 'none' }}
              >
                <span className="recent-item-source">{article.source_name}</span>
                <span className="recent-item-title">{article.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Trending Concepts (LKPNR Knowledge Graph) ── */}
      <div className="sidebar-box">
        <h4 className="sidebar-title">
          <TrendingUp size={14} color="var(--accent-emerald)" />
          Trending Concepts
        </h4>

        {selectedEntity && (
          <div style={{ marginBottom: 10 }}>
            <button
              className="concept-tag"
              onClick={() => onSelectEntity(null)}
              style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
            >
              ✕ #{selectedEntity}
            </button>
          </div>
        )}

        <div className="concept-cloud">
          {trendingEntities?.map((item, idx) => (
            <button
              key={idx}
              className="concept-tag"
              onClick={() => onSelectEntity(item.name)}
              style={selectedEntity === item.name ? {
                background: 'var(--primary)',
                color: 'white',
                borderColor: 'var(--primary)'
              } : {}}
            >
              <Hash size={10} />
              {item.name}
              <span className="concept-count">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ArXiv Research Spotlight ── */}
      {arxivPapers?.length > 0 && (
        <div className="sidebar-box">
          <h4 className="sidebar-title">
            <Brain size={14} color="var(--accent-purple)" />
            ArXiv Spotlight
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {arxivPapers.slice(0, 4).map((paper) => (
              <a
                key={paper.id}
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  gap: 10,
                  textDecoration: 'none',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{
                  width: 3,
                  flexShrink: 0,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  background: 'var(--card-arxiv-fg)',
                  minHeight: 36
                }} />
                <div>
                  <span style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    lineHeight: 1.35
                  }}>
                    {paper.title}
                  </span>
                  <div style={{
                    fontSize: '0.66rem',
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {paper.read_time_seconds || 45}s read
                    <ExternalLink size={10} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
